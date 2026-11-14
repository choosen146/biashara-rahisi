import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PeriodKey, inRange, lastMonthToDate, monthRange, periodRange } from '../../core/metrics';
import { Expense, METHODS, PaymentMethod } from '../../core/models';
import { Store } from '../../core/store';
import { Ui } from '../../core/ui';
import { IconComponent } from '../../shared/icon.component';
import { ModalComponent } from '../../shared/modal.component';

const EAT = 3 * 3600e3;
const todayLocal = () => new Date(Date.now() + EAT).toISOString().slice(0, 10);

@Component({
  selector: 'tbms-expenses',
  standalone: true,
  imports: [FormsModule, IconComponent, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div><h1>{{ ui.t('exp.title') }}</h1><p>{{ ui.t('exp.subtitle') }}</p></div>
      @if (store.can('expenses.create')) {
        <div class="head-actions"><button type="button" class="btn primary" (click)="openForm()"><tbms-icon name="plus" [size]="18" [stroke]="2.2" />{{ ui.t('exp.new') }}</button></div>
      }
    </header>

    <div class="top">
      <div class="stats col">
        <div class="stat"><span>{{ ui.t('exp.thisMonth') }}</span><strong>{{ ui.money(thisMonth()) }}</strong>
          @if (lastMonth()) { <small [class.neg]="thisMonth() > lastMtd()">{{ change() }} {{ ui.t('common.vsLastMonth') }}</small> }
        </div>
        <div class="stat"><span>{{ ui.t('exp.lastMonth') }}</span><strong>{{ ui.money(lastMonth()) }}</strong></div>
      </div>
      <section class="card panel">
        <div class="panel-head"><div><h2>{{ ui.t('rep.expByCat') }}</h2><p>{{ ui.t('per.' + period()) }}</p></div></div>
        @for (c of byCategory(); track c.id) {
          <div class="bar-row"><span>{{ c.name }}</span><span class="v">{{ ui.money(c.amount) }}</span><div class="track exp"><i [style.width.%]="c.pct"></i></div></div>
        } @empty { <p class="muted">{{ ui.t('rep.nothing') }}</p> }
      </section>
    </div>

    <section class="card table-card mt">
      <div class="toolbar">
        <label class="search"><tbms-icon name="search" [size]="16" /><input type="search" [placeholder]="ui.t('common.search')" [ngModel]="q()" (ngModelChange)="q.set($event)" /></label>
        <select [ngModel]="period()" (ngModelChange)="period.set($event)">
          <option value="thisMonth">{{ ui.t('per.thisMonth') }}</option><option value="lastMonth">{{ ui.t('per.lastMonth') }}</option>
          <option value="last90">{{ ui.t('per.last90') }}</option><option value="thisYear">{{ ui.t('per.thisYear') }}</option>
        </select>
        <select [ngModel]="cat()" (ngModelChange)="cat.set($event)">
          <option value="">{{ ui.t('common.all') }}</option>
          @for (c of store.expenseCategories(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
        </select>
        <span class="count">{{ filtered().length }}</span>
      </div>
      @if (filtered().length) {
        <table class="table">
          <thead><tr><th>{{ ui.t('common.category') }}</th><th>{{ ui.t('common.date') }}</th><th>{{ ui.t('common.method') }}</th><th class="num">{{ ui.t('common.amount') }}</th><th></th></tr></thead>
          <tbody>
            @for (e of filtered(); track e.id) {
              <tr [class.voided]="e.status === 'VOIDED'">
                <td class="lead"><span class="strong">{{ catName(e) }}</span><span class="sub">{{ e.number }}@if (e.note) { · {{ e.note }} }@if (e.status === 'VOIDED') { · {{ ui.t('common.voided') }}: {{ e.voidReason }} }</span></td>
                <td [attr.data-label]="ui.t('common.date')">{{ ui.date(e.date) }}</td>
                <td [attr.data-label]="ui.t('common.method')">{{ ui.t('pm.' + e.method) }}</td>
                <td class="num strong" [attr.data-label]="ui.t('common.amount')">{{ ui.money(e.amount) }}</td>
                <td class="num">
                  @if (e.status === 'POSTED' && store.can('expenses.void')) {
                    <button type="button" class="icon-btn" (click)="voidTarget.set(e); voidReason = ''" [attr.aria-label]="ui.t('common.void')" [attr.title]="ui.t('common.void')"><tbms-icon name="ban" [size]="16" /></button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <div class="empty"><span class="empty-ic"><tbms-icon name="expenses" [size]="26" /></span><p>{{ store.expenses().length ? ui.t('common.noResults') : ui.t('exp.empty') }}</p></div>
      }
    </section>

    <tbms-modal [open]="formOpen()" [title]="ui.t('exp.new')" (closed)="formOpen.set(false)">
      <form class="form" id="expForm" (ngSubmit)="save()">
        <label class="field">{{ ui.t('common.category') }}
          @if (!addingCat()) {
            <select [ngModel]="categoryId" (ngModelChange)="onCat($event)" name="cat" required>
              <option value="">{{ ui.t('common.selectOne') }}</option>
              @for (c of store.expenseCategories(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
              <option value="__new">{{ ui.t('exp.newCategory') }}</option>
            </select>
          } @else {
            <div class="inline"><input [(ngModel)]="newCat" name="nc" [placeholder]="ui.t('exp.categoryName')" />
              <button type="button" class="btn secondary sm" (click)="addCat()">{{ ui.t('common.add') }}</button>
              <button type="button" class="icon-btn" (click)="addingCat.set(false)"><tbms-icon name="x" [size]="16" /></button></div>
          }
        </label>
        <div class="grid-2">
          <label class="field">{{ ui.t('common.amount') }} (TZS)<input type="number" min="0" step="500" [(ngModel)]="amount" name="amt" required /></label>
          <label class="field">{{ ui.t('common.date') }}<input type="date" [(ngModel)]="date" name="date" [max]="today" /></label>
        </div>
        <label class="field">{{ ui.t('common.method') }}
          <select [(ngModel)]="method" name="m">@for (m of methods; track m) { <option [value]="m">{{ ui.t('pm.' + m) }}</option> }</select>
        </label>
        <label class="field">{{ ui.t('common.notes') }} <span class="opt">({{ ui.t('common.optional') }})</span><input [(ngModel)]="note" name="note" /></label>
        @if (error()) { <div class="form-error" role="alert"><tbms-icon name="alert" [size]="16" />{{ error() }}</div> }
      </form>
      <div footer>
        <button type="button" class="btn secondary" (click)="formOpen.set(false)">{{ ui.t('common.cancel') }}</button>
        <button type="submit" form="expForm" class="btn primary" [disabled]="busy()">{{ ui.t('common.save') }}</button>
      </div>
    </tbms-modal>

    <tbms-modal [open]="!!voidTarget()" [title]="ui.t('exp.voidTitle')" [subtitle]="ui.t('exp.voidHint')" (closed)="voidTarget.set(null)">
      @if (voidTarget(); as e) {
        <p class="vt"><b>{{ catName(e) }}</b> · {{ ui.money(e.amount) }} · {{ ui.date(e.date) }}</p>
        <label class="field">{{ ui.t('common.reason') }}<textarea [(ngModel)]="voidReason" rows="2"></textarea></label>
      }
      <div footer>
        <button type="button" class="btn secondary" (click)="voidTarget.set(null)">{{ ui.t('common.cancel') }}</button>
        <button type="button" class="btn danger" [disabled]="!voidReason.trim()" (click)="doVoid()">{{ ui.t('common.void') }}</button>
      </div>
    </tbms-modal>
  `,
  styles: [`
    .top { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: 16px; align-items: start; }
    .stats.col { grid-template-columns: 1fr; margin: 0; }
    .muted { color: var(--text-3); margin: 0; font-size: 14px; }
    .inline { display: flex; gap: 8px; align-items: center; input { flex: 1; } }
    .vt { margin: 0 0 12px; font-size: 14px; }
    @media (max-width: 900px) { .top { grid-template-columns: minmax(0, 1fr); } .stats.col { grid-template-columns: 1fr 1fr; } }
  `],
})
export class ExpensesComponent {
  readonly ui = inject(Ui);
  readonly store = inject(Store);
  readonly methods = METHODS;
  readonly today = todayLocal();

  readonly q = signal('');
  readonly cat = signal('');
  readonly period = signal<PeriodKey>('thisMonth');
  private posted = computed(() => this.store.expenses().filter((e) => e.status === 'POSTED'));
  readonly thisMonth = computed(() => this.posted().filter((e) => inRange(e.date, monthRange(0))).reduce((a, e) => a + e.amount, 0));
  readonly lastMonth = computed(() => this.posted().filter((e) => inRange(e.date, monthRange(-1))).reduce((a, e) => a + e.amount, 0));
  private lastMtd = computed(() => this.posted().filter((e) => inRange(e.date, lastMonthToDate())).reduce((a, e) => a + e.amount, 0));
  readonly change = computed(() => {
    const pct = Math.round(((this.thisMonth() - this.lastMtd()) / Math.max(1, this.lastMtd())) * 100);
    return `${pct >= 0 ? '↑' : '↓'} ${Math.abs(pct)}%`;
  });
  readonly filtered = computed(() => {
    const q = this.q().trim().toLowerCase();
    const range = periodRange(this.period());
    const cats = this.store.expenseCategoryById();
    return this.store.expenses().filter((e) => inRange(e.date, range) && (!this.cat() || e.categoryId === this.cat())
      && (!q || (cats.get(e.categoryId)?.name ?? '').toLowerCase().includes(q) || (e.note ?? '').toLowerCase().includes(q) || e.number.toLowerCase().includes(q)));
  });
  readonly byCategory = computed(() => {
    const range = periodRange(this.period());
    const map = new Map<string, number>();
    for (const e of this.posted()) if (inRange(e.date, range)) map.set(e.categoryId, (map.get(e.categoryId) ?? 0) + e.amount);
    const max = Math.max(1, ...map.values());
    return [...map.entries()].sort((a, b) => b[1] - a[1])
      .map(([id, amount]) => ({ id, amount, name: this.store.expenseCategoryById().get(id)?.name ?? '—', pct: (amount / max) * 100 }));
  });
  catName(e: Expense) { return this.store.expenseCategoryById().get(e.categoryId)?.name ?? '—'; }

  readonly formOpen = signal(false);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);
  readonly addingCat = signal(false);
  categoryId = '';
  amount = 0;
  date = todayLocal();
  method: PaymentMethod = 'CASH';
  note = '';
  newCat = '';
  private key = '';

  constructor() {
    const router = inject(Router);
    inject(ActivatedRoute).queryParamMap.subscribe((p) => {
      if (p.get('new') && this.store.can('expenses.create')) { this.openForm(); router.navigate([], { queryParams: {} }); }
    });
  }

  openForm() {
    this.categoryId = ''; this.amount = 0; this.date = todayLocal(); this.method = 'CASH'; this.note = '';
    this.error.set(null); this.busy.set(false); this.addingCat.set(false);
    this.key = this.ui.newKey();
    this.formOpen.set(true);
  }
  onCat(v: string) { if (v === '__new') { this.addingCat.set(true); this.newCat = ''; } else this.categoryId = v; }
  addCat() {
    const r = this.ui.attempt(() => this.store.addExpenseCategory(this.newCat));
    if (r.ok) { this.categoryId = r.value.id; this.addingCat.set(false); } else this.error.set(r.error);
  }
  save() {
    if (this.busy()) return;
    this.busy.set(true);
    // Store the chosen local date at midday EAT so it lands in the right day/month.
    const iso = this.date === todayLocal() ? new Date().toISOString() : new Date(Date.parse(`${this.date}T12:00:00Z`) - EAT).toISOString();
    const r = this.ui.attempt(() => this.store.createExpense({ key: this.key, categoryId: this.categoryId, amount: this.amount, method: this.method, date: iso, note: this.note }));
    this.busy.set(false);
    if (!r.ok) { this.error.set(r.error); return; }
    this.formOpen.set(false);
    this.ui.toast(r.value.duplicate ? this.ui.t('sales.duplicate') : this.ui.t('exp.recorded'));
  }

  readonly voidTarget = signal<Expense | null>(null);
  voidReason = '';
  doVoid() {
    const e = this.voidTarget();
    if (e && this.ui.run(() => this.store.voidExpense(e.id, this.voidReason), 'exp.voided')) this.voidTarget.set(null);
  }
}
