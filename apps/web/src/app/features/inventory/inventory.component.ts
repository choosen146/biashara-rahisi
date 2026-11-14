import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Movement, MovementType, Product } from '../../core/models';
import { Store } from '../../core/store';
import { Ui } from '../../core/ui';
import { IconComponent } from '../../shared/icon.component';
import { ModalComponent } from '../../shared/modal.component';

const REASONS = ['count', 'damage', 'loss', 'expired', 'other'];

@Component({
  selector: 'tbms-inventory',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div><h1>{{ ui.t('inv.title') }}</h1><p>{{ ui.t('inv.subtitle') }}</p></div>
      @if (store.inventoryOn()) {
        <div class="head-actions">
          @if (store.can('inventory.adjust')) {
            <button type="button" class="btn secondary" (click)="openAdjust()"><tbms-icon name="swap" [size]="17" />{{ ui.t('inv.adjust') }}</button>
          }
          @if (store.can('purchases.create')) {
            <a class="btn primary" routerLink="/purchases" [queryParams]="{ new: 1 }"><tbms-icon name="plus" [size]="18" [stroke]="2.2" />{{ ui.t('pur.new') }}</a>
          }
        </div>
      }
    </header>

    @if (!store.inventoryOn()) {
      <section class="card empty">
        <span class="empty-ic"><tbms-icon name="inventory" [size]="26" /></span>
        <p>{{ ui.t('inv.disabled') }}</p>
        @if (store.can('settings.manage')) { <a class="btn secondary" routerLink="/settings">{{ ui.t('inv.enableInSettings') }}</a> }
      </section>
    } @else {
      <div class="stats">
        <div class="stat"><span>{{ ui.t('inv.value') }}</span><strong>{{ ui.money(value()) }}</strong><small>{{ tracked().length }} {{ ui.t('common.items') }}</small></div>
        <div class="stat" [class.warn]="lowCount() > 0"><span>{{ ui.t('dash.lowStock') }}</span><strong>{{ lowCount() }}</strong><small>{{ ui.t('dash.atReorder') }}</small></div>
        <div class="stat" [class.warn]="outCount() > 0"><span>{{ ui.t('inv.out') }}</span><strong>{{ outCount() }}</strong></div>
      </div>

      <section class="card table-card">
        <div class="toolbar">
          <div class="seg" role="tablist">
            <button type="button" [class.on]="tab() === 'levels'" (click)="tab.set('levels')">{{ ui.t('inv.levels') }}</button>
            <button type="button" [class.on]="tab() === 'movements'" (click)="tab.set('movements')">{{ ui.t('inv.movements') }}</button>
          </div>
          <label class="search"><tbms-icon name="search" [size]="16" /><input type="search" [placeholder]="ui.t('common.search')" [ngModel]="q()" (ngModelChange)="q.set($event)" /></label>
          @if (tab() === 'movements') {
            <select [ngModel]="type()" (ngModelChange)="type.set($event)">
              <option value="">{{ ui.t('common.all') }}</option>
              @for (t of types; track t) { <option [value]="t">{{ ui.t('mv.' + t) }}</option> }
            </select>
          } @else {
            <label class="check lowonly"><input type="checkbox" [ngModel]="lowOnly()" (ngModelChange)="lowOnly.set($event)" />{{ ui.t('dash.lowStock') }}</label>
          }
        </div>

        @if (tab() === 'levels') {
          <table class="table">
            <thead><tr><th>{{ ui.t('common.product') }}</th><th class="num">{{ ui.t('inv.onHand') }}</th><th class="num">{{ ui.t('prod.reorder') }}</th><th>{{ ui.t('common.status') }}</th><th class="num">{{ ui.t('inv.value') }}</th><th></th></tr></thead>
            <tbody>
              @for (r of levels(); track r.p.id) {
                <tr>
                  <td class="lead"><span class="strong">{{ r.p.name }}</span><span class="sub">{{ r.p.sku }}</span></td>
                  <td class="num strong" [attr.data-label]="ui.t('inv.onHand')">{{ ui.qty(r.qty, r.p.unit) }}</td>
                  <td class="num" [attr.data-label]="ui.t('prod.reorder')">{{ ui.num(r.p.reorderLevel) }}</td>
                  <td [attr.data-label]="ui.t('common.status')"><span class="badge" [attr.data-s]="r.level">{{ ui.t(r.level === 'OUT' ? 'inv.out' : r.level === 'LOW' ? 'inv.low' : 'inv.ok') }}</span></td>
                  <td class="num" [attr.data-label]="ui.t('inv.value')">{{ ui.money(r.qty * r.p.cost) }}</td>
                  <td class="num"><div class="row-acts">
                    @if (r.level !== 'OK' && store.can('purchases.create')) {
                      <a class="btn secondary sm" routerLink="/purchases" [queryParams]="{ new: 1, product: r.p.id }">{{ ui.t('dash.recordPurchase') }}</a>
                    }
                    @if (store.can('inventory.adjust')) {
                      <button type="button" class="icon-btn" (click)="openAdjust(r.p)" [attr.aria-label]="ui.t('inv.adjust')"><tbms-icon name="swap" [size]="16" /></button>
                    }
                  </div></td>
                </tr>
              } @empty { <tr><td colspan="6" class="muted">{{ ui.t('common.noResults') }}</td></tr> }
            </tbody>
          </table>
        } @else {
          <table class="table">
            <thead><tr><th>{{ ui.t('common.when') }}</th><th>{{ ui.t('common.product') }}</th><th>{{ ui.t('common.status') }}</th><th class="num">{{ ui.t('inv.change') }}</th><th>{{ ui.t('inv.source') }}</th></tr></thead>
            <tbody>
              @for (m of movements(); track m.id) {
                <tr>
                  <td class="lead"><span class="strong">{{ store.productById().get(m.productId)?.name }}</span><span class="sub">{{ ui.dateTime(m.createdAt) }} · {{ ui.userName(m.createdBy) }}</span></td>
                  <td class="lead-hide" [attr.data-label]="ui.t('common.product')">{{ store.productById().get(m.productId)?.name }}</td>
                  <td [attr.data-label]="ui.t('common.status')"><span class="badge" [class.brand]="m.type === 'PURCHASE'" [class.warn]="m.type === 'ADJUSTMENT'" [class.bad]="m.type === 'VOID'">{{ ui.t('mv.' + m.type) }}</span></td>
                  <td class="num strong" [attr.data-label]="ui.t('inv.change')" [class.pos]="m.quantity > 0" [class.neg]="m.quantity < 0">{{ m.quantity > 0 ? '+' : '' }}{{ ui.num(m.quantity) }}</td>
                  <td [attr.data-label]="ui.t('inv.source')" class="muted">{{ source(m) }}</td>
                </tr>
              } @empty { <tr><td colspan="5" class="muted">{{ ui.t('common.noResults') }}</td></tr> }
            </tbody>
          </table>
          @if (allMovements().length > limit()) {
            <div class="table-more"><button type="button" class="btn secondary sm" (click)="limit.set(limit() + 60)">{{ ui.t('dash.seeAll') }} ({{ allMovements().length - limit() }})</button></div>
          }
        }
      </section>
    }

    <tbms-modal [open]="adjustOpen()" [title]="ui.t('inv.adjust')" [subtitle]="ui.t('inv.adjustHint')" (closed)="adjustOpen.set(false)">
      <form class="form" id="adjForm" (ngSubmit)="saveAdjust()">
        <label class="field">{{ ui.t('common.product') }}
          <select [(ngModel)]="adjProduct" name="p" required>
            <option value="">{{ ui.t('common.selectOne') }}</option>
            @for (p of tracked(); track p.id) { <option [value]="p.id">{{ p.name }}</option> }
          </select>
        </label>
        <div class="grid-2">
          <div class="field">{{ ui.t('inv.change') }}
            <div class="seg"><button type="button" [class.on]="adjDir === 1" (click)="adjDir = 1">{{ ui.t('inv.add') }}</button><button type="button" [class.on]="adjDir === -1" (click)="adjDir = -1">{{ ui.t('inv.removeQty') }}</button></div>
          </div>
          <label class="field">{{ ui.t('common.qty') }}<input type="number" min="0" step="any" [(ngModel)]="adjQty" name="q" /></label>
        </div>
        @if (adjProduct) {
          <div class="hint"><tbms-icon name="info" [size]="16" />{{ ui.t('inv.onHand') }}: {{ ui.num(current()) }} → {{ ui.t('inv.newLevel') }}: <b>{{ ui.num(current() + adjDir * (adjQty || 0)) }}</b></div>
        }
        <label class="field">{{ ui.t('common.reason') }}
          <select [(ngModel)]="adjReason" name="r">@for (r of reasons; track r) { <option [value]="r">{{ ui.t('inv.reason.' + r) }}</option> }</select>
        </label>
        <label class="field">{{ ui.t('common.notes') }} <span class="opt">({{ ui.t('common.optional') }})</span><input [(ngModel)]="adjNote" name="n" [placeholder]="ui.t('inv.noteHint')" /></label>
        @if (error()) { <div class="form-error" role="alert"><tbms-icon name="alert" [size]="16" />{{ error() }}</div> }
      </form>
      <div footer>
        <button type="button" class="btn secondary" (click)="adjustOpen.set(false)">{{ ui.t('common.cancel') }}</button>
        <button type="submit" form="adjForm" class="btn primary" [disabled]="!adjProduct || !adjQty">{{ ui.t('common.save') }}</button>
      </div>
    </tbms-modal>
  `,
  styles: [`.lowonly { margin-left: auto; font-size: 13.5px; } .row-acts { display: flex; gap: 6px; justify-content: flex-end; align-items: center; } .muted { color: var(--text-3); }
    @media (max-width: 720px) { .row-acts { justify-content: flex-start; padding-top: 8px !important; } }`],
})
export class InventoryComponent {
  readonly ui = inject(Ui);
  readonly store = inject(Store);
  readonly types: MovementType[] = ['OPENING', 'PURCHASE', 'SALE', 'ADJUSTMENT', 'VOID'];
  readonly reasons = REASONS;
  readonly tab = signal<'levels' | 'movements'>('levels');
  readonly q = signal('');
  readonly type = signal('');
  readonly lowOnly = signal(false);
  readonly limit = signal(60);

  readonly tracked = computed(() => this.store.products().filter((p) => p.trackStock && p.active).sort((a, b) => a.name.localeCompare(b.name)));
  private rows = computed(() => this.tracked().map((p) => {
    const qty = this.store.stock().get(p.id) ?? 0;
    return { p, qty, level: qty <= 0 ? 'OUT' : qty <= p.reorderLevel ? 'LOW' : 'OK' };
  }));
  readonly levels = computed(() => {
    const q = this.q().trim().toLowerCase();
    return this.rows().filter((r) => (!this.lowOnly() || r.level !== 'OK') && (!q || r.p.name.toLowerCase().includes(q) || r.p.sku.toLowerCase().includes(q)));
  });
  readonly value = computed(() => this.rows().reduce((a, r) => a + Math.max(0, r.qty) * r.p.cost, 0));
  readonly lowCount = computed(() => this.rows().filter((r) => r.level === 'LOW').length);
  readonly outCount = computed(() => this.rows().filter((r) => r.level === 'OUT').length);

  readonly allMovements = computed(() => {
    const q = this.q().trim().toLowerCase();
    const prods = this.store.productById();
    return this.store.movements().filter((m) => (!this.type() || m.type === this.type()) && (!q || prods.get(m.productId)?.name.toLowerCase().includes(q)));
  });
  readonly movements = computed(() => this.allMovements().slice(0, this.limit()));
  private refs = computed(() => {
    const map = new Map<string, string>();
    for (const s of this.store.sales()) map.set(s.id, s.number);
    for (const p of this.store.purchases()) map.set(p.id, p.number);
    return map;
  });
  source(m: Movement) {
    const ref = m.sourceId ? this.refs().get(m.sourceId) ?? '' : '';
    const reason = m.reason ? this.ui.reason(m.reason) : '';
    return [ref, reason].filter(Boolean).join(' · ') || '—';
  }

  readonly adjustOpen = signal(false);
  readonly error = signal<string | null>(null);
  adjProduct = '';
  adjDir: 1 | -1 = -1;
  adjQty = 0;
  adjReason = 'count';
  adjNote = '';
  current() { return this.store.stock().get(this.adjProduct) ?? 0; }

  openAdjust(p?: Product) {
    this.adjProduct = p?.id ?? '';
    this.adjDir = -1;
    this.adjQty = 0;
    this.adjReason = 'count';
    this.adjNote = '';
    this.error.set(null);
    this.adjustOpen.set(true);
  }
  saveAdjust() {
    const r = this.ui.attempt(() => this.store.adjustStock(this.adjProduct, this.adjDir * (Number(this.adjQty) || 0), this.adjReason, this.adjNote));
    if (!r.ok) { this.error.set(r.error); return; }
    this.adjustOpen.set(false);
    this.ui.toast(this.ui.t('inv.adjusted'));
  }
}
