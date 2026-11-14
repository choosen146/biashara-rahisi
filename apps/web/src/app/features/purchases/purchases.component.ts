import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PeriodKey, inRange, payables, periodRange } from '../../core/metrics';
import { Purchase } from '../../core/models';
import { Store } from '../../core/store';
import { Ui } from '../../core/ui';
import { IconComponent } from '../../shared/icon.component';
import { ModalComponent } from '../../shared/modal.component';

interface DraftLine { productId: string; quantity: number; unitCost: number }

@Component({
  selector: 'tbms-purchases',
  standalone: true,
  imports: [FormsModule, IconComponent, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div><h1>{{ ui.t('pur.title') }}</h1><p>{{ ui.t('pur.subtitle') }}</p></div>
      @if (store.can('purchases.create')) {
        <div class="head-actions"><button type="button" class="btn primary" (click)="openForm()"><tbms-icon name="plus" [size]="18" [stroke]="2.2" />{{ ui.t('pur.new') }}</button></div>
      }
    </header>

    <div class="stats">
      <div class="stat"><span>{{ ui.t('common.total') }}</span><strong>{{ ui.money(sum()) }}</strong><small>{{ filtered().length }} · {{ ui.t('per.' + period()) }}</small></div>
      <div class="stat" [class.warn]="owed() > 0"><span>{{ ui.t('pur.owed') }}</span><strong>{{ ui.money(owed()) }}</strong></div>
    </div>

    <section class="card table-card">
      <div class="toolbar">
        <label class="search"><tbms-icon name="search" [size]="16" /><input type="search" [placeholder]="ui.t('common.search')" [ngModel]="q()" (ngModelChange)="q.set($event)" /></label>
        <select [ngModel]="period()" (ngModelChange)="period.set($event)">
          <option value="thisMonth">{{ ui.t('per.thisMonth') }}</option><option value="lastMonth">{{ ui.t('per.lastMonth') }}</option>
          <option value="last90">{{ ui.t('per.last90') }}</option><option value="thisYear">{{ ui.t('per.thisYear') }}</option>
        </select>
        <div class="seg">
          <button type="button" [class.on]="!unpaidOnly()" (click)="unpaidOnly.set(false)">{{ ui.t('common.all') }}</button>
          <button type="button" [class.on]="unpaidOnly()" (click)="unpaidOnly.set(true)">{{ ui.t('pur.unpaid') }}</button>
        </div>
      </div>
      @if (filtered().length) {
        <table class="table">
          <thead><tr><th>{{ ui.t('pur.number') }}</th><th>{{ ui.t('common.supplier') }}</th><th class="num">{{ ui.t('common.itemsCol') }}</th><th class="num">{{ ui.t('common.total') }}</th><th>{{ ui.t('common.status') }}</th></tr></thead>
          <tbody>
            @for (p of filtered(); track p.id) {
              <tr class="click" [class.voided]="p.status === 'VOIDED'" (click)="detailId.set(p.id); voiding.set(false); voidReason = ''" tabindex="0" (keydown.enter)="detailId.set(p.id)">
                <td class="lead"><span class="strong">{{ p.number }}</span><span class="sub">{{ ui.dateTime(p.createdAt) }} · {{ ui.userName(p.createdBy) }}</span></td>
                <td [attr.data-label]="ui.t('common.supplier')">{{ supplierName(p) }}</td>
                <td class="num" [attr.data-label]="ui.t('common.itemsCol')">{{ p.lines.length }}</td>
                <td class="num strong" [attr.data-label]="ui.t('common.total')">{{ ui.money(p.total) }}</td>
                <td [attr.data-label]="ui.t('common.status')">
                  @if (p.status === 'VOIDED') { <span class="badge" data-s="VOIDED">{{ ui.t('status.VOIDED') }}</span> }
                  @else if (p.paid) { <span class="badge good">{{ ui.t('pur.paidLabel') }}</span> }
                  @else { <span class="badge warn">{{ ui.t('pur.unpaid') }}</span> }
                </td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <div class="empty"><span class="empty-ic"><tbms-icon name="purchases" [size]="26" /></span><p>{{ store.purchases().length ? ui.t('common.noResults') : ui.t('pur.empty') }}</p></div>
      }
    </section>

    <tbms-modal [open]="formOpen()" [title]="ui.t('pur.new')" size="wide" (closed)="formOpen.set(false)">
      <form class="form" id="purForm" (ngSubmit)="submit()">
        <label class="field">{{ ui.t('common.supplier') }}
          <select [(ngModel)]="supplierId" name="sup">
            <option value="">{{ ui.t('common.none') }}</option>
            @for (s of store.suppliers(); track s.id) { <option [value]="s.id">{{ s.name }}</option> }
          </select>
        </label>
        <div class="pl-head"><span>{{ ui.t('common.product') }}</span><span>{{ ui.t('common.qty') }}</span><span>{{ ui.t('pur.unitCost') }}</span><span></span></div>
        @for (l of lines(); track $index; let i = $index) {
          <div class="pl-row">
            <select [ngModel]="l.productId" (ngModelChange)="setProduct(i, $event)" [name]="'pp' + i" [attr.aria-label]="ui.t('common.product')">
              <option value="">{{ ui.t('common.selectOne') }}</option>
              @for (p of products(); track p.id) { <option [value]="p.id">{{ p.name }} ({{ ui.num(stockOf(p.id)) }})</option> }
            </select>
            <input type="number" min="0" step="any" [ngModel]="l.quantity" (ngModelChange)="patch(i, { quantity: +$event })" [name]="'pq' + i" [attr.aria-label]="ui.t('common.qty')" />
            <input type="number" min="0" step="50" [ngModel]="l.unitCost" (ngModelChange)="patch(i, { unitCost: +$event })" [name]="'pc' + i" [attr.aria-label]="ui.t('pur.unitCost')" />
            <button type="button" class="icon-btn" (click)="removeLine(i)" [disabled]="lines().length === 1" [attr.aria-label]="ui.t('common.remove')"><tbms-icon name="x" [size]="16" /></button>
          </div>
        }
        <button type="button" class="btn secondary sm add-line" (click)="addLine()"><tbms-icon name="plus" [size]="15" />{{ ui.t('sales.addItem') }}</button>
        <div class="total-row"><span>{{ ui.t('common.total') }}</span><span>{{ ui.money(total()) }}</span></div>
        <label class="check"><input type="checkbox" [(ngModel)]="paid" name="paid" />{{ ui.t('pur.paidNow') }}</label>
        <label class="check"><input type="checkbox" [(ngModel)]="updateCost" name="uc" />{{ ui.t('pur.updateCost') }}</label>
        @if (error()) { <div class="form-error" role="alert"><tbms-icon name="alert" [size]="16" />{{ error() }}</div> }
      </form>
      <div footer>
        <button type="button" class="btn secondary" (click)="formOpen.set(false)">{{ ui.t('common.cancel') }}</button>
        <button type="submit" form="purForm" class="btn primary" [disabled]="busy()"><tbms-icon name="check" [size]="17" />{{ ui.t('pur.complete') }}</button>
      </div>
    </tbms-modal>

    <tbms-modal [open]="!!detail()" variant="drawer" [title]="detail()?.number ?? ''" [subtitle]="detail() ? ui.dateTime(detail()!.createdAt) + ' · ' + ui.userName(detail()!.createdBy) : ''" (closed)="detailId.set(null)">
      @if (detail(); as p) {
        <p class="muted">{{ supplierName(p) }}</p>
        @if (p.status === 'VOIDED') { <div class="hint"><tbms-icon name="ban" [size]="16" />{{ ui.t('common.reason') }}: {{ p.voidReason }}</div> }
        <h3 class="section-title">{{ ui.t('sales.lines') }}</h3>
        <ul class="lines">
          @for (l of p.lines; track l.productId) {
            <li><span>{{ store.productById().get(l.productId)?.name }}<small>{{ ui.qty(l.quantity, store.productById().get(l.productId)?.unit) }} × {{ ui.money(l.unitCost) }}</small></span><span>{{ ui.money(l.quantity * l.unitCost) }}</span></li>
          }
        </ul>
        <div class="total-row"><span>{{ ui.t('common.total') }}</span><span>{{ ui.money(p.total) }}</span></div>
        @if (p.status === 'COMPLETED') {
          <div class="detail-actions">
            @if (!p.paid && store.can('purchases.create')) {
              <button type="button" class="btn primary block" (click)="ui.run(markPaid(p.id), 'pur.markedPaid')"><tbms-icon name="cash" [size]="17" />{{ ui.t('pur.markPaid') }}</button>
            }
            @if (store.can('purchases.void')) {
              @if (!voiding()) {
                <button type="button" class="btn ghost-btn" (click)="voiding.set(true)"><tbms-icon name="ban" [size]="16" />{{ ui.t('common.void') }}</button>
              } @else {
                <h3 class="section-title">{{ ui.t('pur.voidTitle') }}</h3>
                <p class="muted">{{ ui.t('pur.voidHint') }}</p>
                <label class="field">{{ ui.t('common.reason') }}<textarea [(ngModel)]="voidReason" rows="2"></textarea></label>
                <div class="row-btns">
                  <button type="button" class="btn secondary" (click)="voiding.set(false)">{{ ui.t('common.cancel') }}</button>
                  <button type="button" class="btn danger" [disabled]="!voidReason.trim()" (click)="doVoid(p.id)">{{ ui.t('common.void') }}</button>
                </div>
              }
            }
          </div>
        }
      }
    </tbms-modal>
  `,
  styles: [`
    .pl-head, .pl-row { display: grid; grid-template-columns: minmax(0, 1fr) 90px 120px 34px; gap: 8px; align-items: center; }
    .pl-head { font-size: 12px; color: var(--text-3); margin-bottom: -6px; }
    .pl-row input { padding: 10px; font-size: 14px; }
    .add-line { align-self: flex-start; }
    .muted { color: var(--text-2); margin: 0 0 8px; font-size: 14px; }
    .detail-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 22px; padding-top: 16px; border-top: 1px dashed var(--border-strong); .section-title { margin: 0; } }
    .row-btns { display: flex; gap: 8px; justify-content: flex-end; }
    @media (max-width: 560px) { .pl-head { display: none; } .pl-row { grid-template-columns: 1fr 1fr 34px; select { grid-column: 1 / -1; } } }
  `],
})
export class PurchasesComponent {
  readonly ui = inject(Ui);
  readonly store = inject(Store);
  private router = inject(Router);

  readonly q = signal('');
  readonly period = signal<PeriodKey>('last90');
  readonly unpaidOnly = signal(false);
  readonly filtered = computed(() => {
    const q = this.q().trim().toLowerCase();
    const range = periodRange(this.period());
    const sup = this.store.supplierById();
    return this.store.purchases().filter((p) => {
      if (this.unpaidOnly() && (p.paid || p.status !== 'COMPLETED')) return false;
      if (!this.unpaidOnly() && !inRange(p.createdAt, range)) return false;
      if (q && !p.number.toLowerCase().includes(q) && !(sup.get(p.supplierId ?? '')?.name.toLowerCase().includes(q))) return false;
      return true;
    });
  });
  readonly sum = computed(() => this.filtered().filter((p) => p.status === 'COMPLETED').reduce((a, p) => a + p.total, 0));
  readonly owed = computed(() => payables(this.store.purchases()));
  readonly products = computed(() => this.store.products().filter((p) => p.active));

  supplierName(p: Purchase) { return p.supplierId ? this.store.supplierById().get(p.supplierId)?.name ?? '—' : '—'; }
  stockOf(id: string) { return this.store.stock().get(id) ?? 0; }

  // form
  readonly formOpen = signal(false);
  readonly lines = signal<DraftLine[]>([]);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);
  supplierId = '';
  paid = true;
  updateCost = true;
  private key = '';
  readonly total = computed(() => this.lines().reduce((a, l) => a + Math.round((l.quantity || 0) * (l.unitCost || 0)), 0));

  constructor() {
    inject(ActivatedRoute).queryParamMap.subscribe((p) => {
      if (p.get('new') && this.store.can('purchases.create')) { this.openForm(p.get('product') ?? undefined); this.router.navigate([], { queryParams: {} }); }
    });
  }

  openForm(productId?: string) {
    const p = productId ? this.store.productById().get(productId) : undefined;
    this.lines.set([{ productId: p?.id ?? '', quantity: p ? Math.max(1, p.reorderLevel * 2) : 1, unitCost: p?.cost ?? 0 }]);
    this.supplierId = '';
    this.paid = true;
    this.updateCost = true;
    this.error.set(null);
    this.busy.set(false);
    this.key = this.ui.newKey();
    this.formOpen.set(true);
  }
  addLine() { this.lines.update((l) => [...l, { productId: '', quantity: 1, unitCost: 0 }]); }
  removeLine(i: number) { this.lines.update((l) => l.filter((_, j) => j !== i)); }
  patch(i: number, p: Partial<DraftLine>) { this.lines.update((l) => l.map((x, j) => (j === i ? { ...x, ...p } : x))); }
  setProduct(i: number, id: string) { this.patch(i, { productId: id, unitCost: this.store.productById().get(id)?.cost ?? 0 }); }

  submit() {
    if (this.busy()) return;
    this.busy.set(true);
    const r = this.ui.attempt(() => this.store.createPurchase({ key: this.key, supplierId: this.supplierId || null, lines: this.lines(), paid: this.paid, updateCost: this.updateCost }));
    this.busy.set(false);
    if (!r.ok) { this.error.set(r.error); return; }
    this.formOpen.set(false);
    this.ui.toast(r.value.duplicate ? this.ui.t('sales.duplicate') : this.ui.t('pur.recorded', { ref: r.value.purchase.number }));
  }

  // detail
  readonly detailId = signal<string | null>(null);
  readonly detail = computed(() => this.store.purchases().find((p) => p.id === this.detailId()) ?? null);
  readonly voiding = signal(false);
  voidReason = '';
  markPaid(id: string) { return () => this.store.markPurchasePaid(id); }
  doVoid(id: string) { if (this.ui.run(() => this.store.voidPurchase(id, this.voidReason), 'pur.voided')) this.voiding.set(false); }
}
