import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PeriodKey, inRange, periodRange } from '../../core/metrics';
import { METHODS, PaymentMethod, Product, Sale } from '../../core/models';
import { Store, paymentStatus, saleBalance, salePaid } from '../../core/store';
import { Ui } from '../../core/ui';
import { IconComponent } from '../../shared/icon.component';
import { ModalComponent } from '../../shared/modal.component';

interface DraftLine { productId: string; quantity: number; unitPrice: number }

@Component({
  selector: 'tbms-sales',
  standalone: true,
  imports: [FormsModule, IconComponent, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss',
})
export class SalesComponent {
  readonly ui = inject(Ui);
  readonly store = inject(Store);
  private router = inject(Router);
  readonly methods = METHODS;
  readonly status = paymentStatus;
  readonly balance = saleBalance;
  readonly paidOf = salePaid;

  // ----- list -----
  readonly q = signal('');
  readonly filter = signal<'all' | 'owing' | 'voided'>('all');
  readonly period = signal<PeriodKey | 'all'>('thisMonth');
  readonly limit = signal(40);

  readonly filtered = computed(() => {
    const q = this.q().trim().toLowerCase();
    const f = this.filter();
    const range = this.period() === 'all' ? null : periodRange(this.period() as PeriodKey);
    const customers = this.store.customerById();
    return this.store.sales().filter((s) => {
      if (range && !inRange(s.createdAt, range)) return false;
      if (f === 'owing' && (s.status !== 'COMPLETED' || saleBalance(s) <= 0)) return false;
      if (f === 'voided' && s.status !== 'VOIDED') return false;
      if (q) {
        const name = s.customerId ? customers.get(s.customerId)?.name.toLowerCase() ?? '' : '';
        if (!s.number.toLowerCase().includes(q) && !name.includes(q)) return false;
      }
      return true;
    });
  });
  readonly visible = computed(() => this.filtered().slice(0, this.limit()));
  readonly totals = computed(() => {
    const list = this.filtered().filter((s) => s.status === 'COMPLETED');
    return {
      revenue: list.reduce((a, s) => a + s.total, 0),
      received: list.reduce((a, s) => a + salePaid(s), 0),
      owing: list.reduce((a, s) => a + saleBalance(s), 0),
      count: list.length,
    };
  });

  customerName(s: Sale) { return s.customerId ? this.store.customerById().get(s.customerId)?.name ?? '—' : this.ui.t('sales.walkIn'); }
  itemCount(s: Sale) { return s.lines.reduce((a, l) => a + l.quantity, 0); }

  // ----- new sale -----
  readonly formOpen = signal(false);
  readonly lines = signal<DraftLine[]>([]);
  readonly productQuery = signal('');
  customerId = '';
  readonly paidMode = signal<'full' | 'credit' | 'custom'>('full');
  paidAmount = 0;
  method: PaymentMethod = 'CASH';
  readonly formError = signal<string | null>(null);
  readonly busy = signal(false);
  private key = '';

  readonly results = computed(() => {
    const q = this.productQuery().trim().toLowerCase();
    if (!q) return [];
    return this.store.products()
      .filter((p) => p.active && (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)))
      .slice(0, 6);
  });
  readonly quickPicks = computed(() => {
    // most-sold products this month for one-tap adding
    const count = new Map<string, number>();
    for (const s of this.store.sales().slice(0, 200)) for (const l of s.lines) count.set(l.productId, (count.get(l.productId) ?? 0) + 1);
    return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([id]) => this.store.productById().get(id)).filter((p): p is Product => !!p && p.active);
  });
  readonly total = computed(() => this.lines().reduce((a, l) => a + Math.round((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0)), 0));

  constructor() {
    const route = inject(ActivatedRoute);
    route.queryParamMap.subscribe((p) => {
      if (p.get('new') && this.store.can('sales.create')) { this.openForm(); this.router.navigate([], { queryParams: {} }); }
      const id = p.get('id');
      if (id) { this.openDetail(id); this.router.navigate([], { queryParams: {} }); }
    });
  }

  openForm() {
    this.lines.set([]);
    this.productQuery.set('');
    this.customerId = '';
    this.paidMode.set('full');
    this.paidAmount = 0;
    this.method = 'CASH';
    this.formError.set(null);
    this.busy.set(false);
    this.key = this.ui.newKey();
    this.formOpen.set(true);
  }

  product(id: string) { return this.store.productById().get(id); }
  stockOf(id: string) { return this.store.stock().get(id) ?? 0; }
  tracks(p?: Product) { return !!p && p.trackStock && this.store.inventoryOn(); }
  stockLabel(p: Product) {
    if (!this.tracks(p)) return p.sku;
    const n = this.stockOf(p.id);
    return `${p.sku} · ${n > 0 ? this.ui.t('sales.inStock', { n: this.ui.num(n) }) : this.ui.t('sales.outOfStock')}`;
  }

  addProduct(p: Product) {
    this.lines.update((ls) => {
      const i = ls.findIndex((l) => l.productId === p.id);
      if (i >= 0) return ls.map((l, j) => (j === i ? { ...l, quantity: Number(l.quantity) + 1 } : l));
      return [...ls, { productId: p.id, quantity: 1, unitPrice: p.price }];
    });
    this.productQuery.set('');
    this.formError.set(null);
  }
  setQty(i: number, v: number) { this.lines.update((ls) => ls.map((l, j) => (j === i ? { ...l, quantity: Math.max(0, Number(v) || 0) } : l))); }
  step(i: number, d: number) { this.setQty(i, Number(this.lines()[i].quantity) + d); }
  setPrice(i: number, v: number) { this.lines.update((ls) => ls.map((l, j) => (j === i ? { ...l, unitPrice: Math.max(0, Number(v) || 0) } : l))); }
  removeLine(i: number) { this.lines.update((ls) => ls.filter((_, j) => j !== i)); }
  overStock(l: DraftLine) { const p = this.product(l.productId); return this.tracks(p) && Number(l.quantity) > this.stockOf(l.productId); }

  paidNow() {
    const m = this.paidMode();
    return m === 'full' ? this.total() : m === 'credit' ? 0 : Math.min(this.total(), Math.max(0, Number(this.paidAmount) || 0));
  }

  submit() {
    if (this.busy()) return;
    this.busy.set(true);
    const r = this.ui.attempt(() => this.store.createSale({
      key: this.key, customerId: this.customerId || null, lines: this.lines(), paid: this.paidNow(), method: this.method,
    }));
    if (!r.ok) { this.formError.set(r.error); this.busy.set(false); return; }
    this.formOpen.set(false);
    this.ui.toast(r.value.duplicate ? this.ui.t('sales.duplicate') : this.ui.t('sales.recorded', { ref: r.value.sale.number }));
    this.period.set('thisMonth');
    this.filter.set('all');
  }

  // ----- detail -----
  readonly detailId = signal<string | null>(null);
  readonly detail = computed(() => this.store.sales().find((s) => s.id === this.detailId()) ?? null);
  payAmount = 0;
  payMethod: PaymentMethod = 'CASH';
  readonly voiding = signal(false);
  voidReason = '';

  openDetail(id: string) {
    this.detailId.set(id);
    const s = this.store.sales().find((x) => x.id === id);
    this.payAmount = s ? saleBalance(s) : 0;
    this.payMethod = 'CASH';
    this.voiding.set(false);
    this.voidReason = '';
  }
  pay() {
    const s = this.detail();
    if (!s) return;
    if (this.ui.run(() => this.store.recordPayment(s.id, this.payAmount, this.payMethod), 'sales.paymentRecorded')) {
      this.payAmount = this.detail() ? saleBalance(this.detail()!) : 0;
    }
  }
  doVoid() {
    const s = this.detail();
    if (!s) return;
    if (this.ui.run(() => this.store.voidSale(s.id, this.voidReason), 'sales.voided')) this.voiding.set(false);
  }
}
