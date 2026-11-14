import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatMonth } from '../../core/format';
import { I18nKey } from '../../core/i18n';
import { dayRange, finance, inRange, lastMonthToDate, monthRange, receivables } from '../../core/metrics';
import { Perm } from '../../core/models';
import { Store } from '../../core/store';
import { Ui } from '../../core/ui';
import { CashflowChartComponent, CashflowPoint } from '../../shared/cashflow-chart.component';
import { IconComponent, IconName } from '../../shared/icon.component';
import { CountComponent, RingComponent, SparkComponent } from '../../shared/viz';

interface Kpi {
  key: string; icon: IconName; tone: string; label: string; value: string; foot?: string; link?: string;
  delta?: { pct: number; good: boolean } | null; alert?: boolean;
  raw?: number; kind?: 'money' | 'num'; spark?: number[]; sparkColor?: string; ring?: number; ringFrom?: string; ringTo?: string;
}

@Component({
  selector: 'tbms-dashboard',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet, IconComponent, CashflowChartComponent, CountComponent, SparkComponent, RingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly ui = inject(Ui);
  readonly store = inject(Store);
  readonly view = signal<'chart' | 'table'>('chart');
  readonly finance = computed(() => this.store.can('dashboard.finance'));

  readonly firstName = computed(() => (this.store.user()?.name ?? '').split(/\s+/)[0] ?? '');
  readonly greeting = computed<I18nKey>(() => {
    const h = (new Date().getUTCHours() + 3) % 24;
    return h < 12 ? 'greet.morning' : h < 17 ? 'greet.afternoon' : 'greet.evening';
  });
  readonly today = computed(() =>
    new Intl.DateTimeFormat(this.ui.i18n.locale(), { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Dar_es_Salaam' }).format(new Date()));

  readonly thisMonth = computed(() => finance(this.store.sales(), this.store.expenses(), this.store.productById(), monthRange(0)));
  /** Same days of last month, so month-to-date deltas compare like with like. */
  readonly lastMonth = computed(() => finance(this.store.sales(), this.store.expenses(), this.store.productById(), lastMonthToDate()));
  readonly todayFin = computed(() => finance(this.store.sales(), [], this.store.productById(), dayRange(0)));
  readonly recv = computed(() => receivables(this.store.sales()));

  /** Six months of revenue/expenses for the chart, plus estimated profit for the hero bars. */
  readonly months = computed(() => {
    const out: (CashflowPoint & { profit: number })[] = [];
    for (let i = 5; i >= 0; i--) {
      const r = monthRange(-i);
      const f = finance(this.store.sales(), this.store.expenses(), this.store.productById(), r);
      const key = new Date(r[0] + 3 * 3600e3 + 86400e3).toISOString().slice(0, 7);
      out.push({ month: key, revenue: String(f.revenue), expenses: String(f.expenses), profit: f.net });
    }
    return out;
  });
  readonly hasSeriesData = computed(() => this.months().some((m) => +m.revenue > 0 || +m.expenses > 0));
  readonly tableRows = computed(() => this.months().map((m) => ({
    month: formatMonth(m.month, this.ui.i18n.locale(), 'long'), revenue: this.ui.money(+m.revenue), expenses: this.ui.money(+m.expenses),
    net: this.ui.money(+m.revenue - +m.expenses), negative: +m.revenue < +m.expenses,
  })));

  /** Last 30 days of daily revenue/expenses for the KPI sparklines. */
  readonly daily = computed(() => {
    const rev = new Array(30).fill(0), exp = new Array(30).fill(0);
    const start = dayRange(-29)[0];
    const idx = (iso: string) => Math.floor((Date.parse(iso) - start) / 86400e3);
    for (const s of this.store.sales()) { if (s.status !== 'COMPLETED') continue; const i = idx(s.createdAt); if (i >= 0 && i < 30) rev[i] += s.total; }
    for (const e of this.store.expenses()) { if (e.status !== 'POSTED') continue; const i = idx(e.date); if (i >= 0 && i < 30) exp[i] += e.amount; }
    // 3-day rolling mean keeps the sparkline readable
    const roll = (a: number[]) => a.map((_, i) => (a[i] + (a[i - 1] ?? a[i]) + (a[i - 2] ?? a[i])) / 3);
    return { rev: roll(rev), exp: roll(exp) };
  });

  readonly hero = computed(() => {
    if (this.finance()) {
      const f = this.thisMonth();
      const nets = this.months().map((m) => m.profit);
      const max = Math.max(1, ...nets.map(Math.abs));
      return {
        label: this.ui.t('dash.profit'), value: this.ui.money(f.net), raw: f.net, negative: f.net < 0, hint: this.ui.t('dash.profitHint'),
        chip: f.revenue > 0 ? `${Math.round((f.net / f.revenue) * 100)}% ${this.ui.t('dash.margin')}` : null,
        bars: this.months().map((m, i) => ({
          label: formatMonth(m.month, this.ui.i18n.locale()), h: Math.max(4, Math.round((Math.abs(nets[i]) / max) * 100)),
          negative: nets[i] < 0, empty: nets[i] === 0, title: `${formatMonth(m.month, this.ui.i18n.locale(), 'long')}: ${this.ui.money(nets[i])}`,
        })),
      };
    }
    // Operational view for cashiers and stock staff: today and the last 7 days of sales.
    const days = Array.from({ length: 7 }, (_, i) => {
      const r = dayRange(i - 6);
      const total = this.store.sales().filter((s) => s.status === 'COMPLETED' && inRange(s.createdAt, r)).reduce((a, s) => a + s.total, 0);
      return { r, total };
    });
    const max = Math.max(1, ...days.map((d) => d.total));
    const t = this.todayFin();
    return {
      label: this.ui.t('dash.todaySales'), value: this.ui.money(t.revenue), raw: t.revenue, negative: false,
      hint: this.ui.t('dash.todayHint', { n: t.saleCount }), chip: null,
      bars: days.map((d) => ({
        label: new Intl.DateTimeFormat(this.ui.i18n.locale(), { weekday: 'short', timeZone: 'Africa/Dar_es_Salaam' }).format(new Date(d.r[0] + 12 * 3600e3)),
        h: Math.max(4, Math.round((d.total / max) * 100)), negative: false, empty: d.total === 0, title: this.ui.money(d.total),
      })),
    };
  });

  readonly kpis = computed<Kpi[]>(() => {
    const low = this.store.lowStock().length;
    const lowTile: Kpi = { key: 'low', icon: 'inventory', tone: 'blue', label: this.ui.t('dash.lowStock'), value: this.ui.num(low),
      foot: this.ui.t('dash.atReorder'), link: '/inventory', alert: low > 0, raw: low, kind: 'num',
      ring: 1 - low / Math.max(1, this.store.products().filter((p) => p.trackStock && p.active).length), ringFrom: '#38bdf8', ringTo: '#6366f1' };
    if (this.finance()) {
      const cur = this.thisMonth(), prev = this.lastMonth();
      const delta = (a: number, b: number, upGood: boolean) => (b ? { pct: Math.round(((a - b) / b) * 100), good: upGood ? a >= b : a <= b } : null);
      const recv = this.recv();
      return [
        { key: 'rev', icon: 'up', tone: 'green', label: this.ui.t('dash.revenue'), value: this.ui.money(cur.revenue), foot: this.ui.t('dash.thisMonth'),
          delta: delta(cur.revenue, prev.revenue, true), link: '/reports', raw: cur.revenue, kind: 'money', spark: this.daily().rev, sparkColor: '#12b886' },
        { key: 'exp', icon: 'expenses', tone: 'amber', label: this.ui.t('dash.expenses'), value: this.ui.money(cur.expenses), foot: this.ui.t('dash.thisMonth'),
          delta: delta(cur.expenses, prev.expenses, false), link: '/expenses', raw: cur.expenses, kind: 'money', spark: this.daily().exp, sparkColor: '#ff7a45' },
        { key: 'recv', icon: 'customers', tone: 'violet', label: this.ui.t('dash.receivables'), value: this.ui.money(recv.reduce((a, r) => a + r.amount, 0)),
          foot: this.ui.t('dash.customersOwing', { n: recv.length }), link: '/reports', raw: recv.reduce((a, r) => a + r.amount, 0), kind: 'money',
          ring: cur.revenue ? cur.received / cur.revenue : 1, ringFrom: '#8b5cf6', ringTo: '#d946ef' },
        ...(this.store.inventoryOn() ? [lowTile] : [{ key: 'cus', icon: 'customers' as IconName, tone: 'blue', label: this.ui.t('dash.customers'),
          value: this.ui.num(this.store.customers().length), foot: this.ui.t('dash.onRecord'), link: '/customers' }]),
      ];
    }
    const t = this.todayFin();
    const items = t.topProducts.reduce((a, p) => a + p.qty, 0);
    return [
      { key: 'st', icon: 'sales', tone: 'green', label: this.ui.t('dash.salesToday'), value: this.ui.num(t.saleCount), foot: this.ui.money(t.revenue), link: '/sales', raw: t.saleCount, kind: 'num', spark: this.daily().rev, sparkColor: '#12b886' },
      { key: 'it', icon: 'products', tone: 'amber', label: this.ui.t('dash.itemsToday'), value: this.ui.num(items), raw: items, kind: 'num' },
      { key: 'cu', icon: 'customers', tone: 'violet', label: this.ui.t('dash.customers'), value: this.ui.num(this.store.customers().length), foot: this.ui.t('dash.onRecord'),
        link: this.store.can('customers.view') ? '/customers' : undefined },
      ...(this.store.inventoryOn() ? [lowTile] : []),
    ];
  });

  readonly actions = computed(() => {
    const all: { icon: IconName; tone: string; label: I18nKey; hint: I18nKey; link: string; perm: Perm }[] = [
      { icon: 'sales', tone: 'green', label: 'dash.recordSale', hint: 'dash.recordSaleHint', link: '/sales', perm: 'sales.create' },
      { icon: 'expenses', tone: 'amber', label: 'dash.addExpense', hint: 'dash.addExpenseHint', link: '/expenses', perm: 'expenses.create' },
      { icon: 'purchases', tone: 'violet', label: 'dash.recordPurchase', hint: 'dash.recordPurchaseHint', link: '/purchases', perm: 'purchases.create' },
      { icon: 'products', tone: 'blue', label: 'dash.addProduct', hint: 'dash.addProductHint', link: '/products', perm: 'products.manage' },
    ];
    return all.filter((a) => this.store.can(a.perm));
  });

  readonly activity = computed(() => {
    if (this.store.can('audit.view')) return this.store.audit().slice(0, 7).map((e) => ({
      id: e.id, text: this.ui.auditText(e), meta: `${this.ui.userName(e.actorId)} · ${this.ui.rel(e.at)}`, icon: this.iconFor(e.action),
    }));
    const me = this.store.user()?.id;
    return this.store.sales().filter((s) => s.createdBy === me).slice(0, 7).map((s) => ({
      id: s.id, text: `${s.number} · ${this.ui.money(s.total)}`, meta: this.ui.rel(s.createdAt), icon: 'sales' as IconName,
    }));
  });
  private iconFor(action: string): IconName {
    const e = action.split('.')[1];
    return ({ sale: 'sales', purchase: 'purchases', expense: 'expenses', product: 'products', stock: 'inventory', customer: 'customers',
      supplier: 'suppliers', member: 'team', org: 'settings', category: 'products' } as Record<string, IconName>)[e] ?? 'audit';
  }

  readonly low = computed(() => this.store.lowStock().slice(0, 5));

  readonly steps = computed(() => [
    { label: 'dash.step.product' as I18nKey, done: this.store.products().length > 0, link: '/products' },
    { label: 'dash.step.customer' as I18nKey, done: this.store.customers().length > 0, link: '/customers' },
    { label: 'dash.step.sale' as I18nKey, done: this.store.sales().length > 0, link: '/sales' },
    { label: 'dash.step.expense' as I18nKey, done: this.store.expenses().length > 0, link: '/expenses' },
    { label: 'dash.step.team' as I18nKey, done: this.store.members().length > 1, link: '/team' },
  ]);
  readonly stepsDone = computed(() => this.steps().filter((s) => s.done).length);
  readonly showSetup = computed(() => this.store.can('settings.manage') && this.stepsDone() < this.steps().length);

  abs(n: number) { return Math.abs(n); }
}
