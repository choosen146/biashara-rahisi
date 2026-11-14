import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PeriodKey, daysSince, finance, payables, periodRange, receivables } from '../../core/metrics';
import { Store } from '../../core/store';
import { Ui } from '../../core/ui';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'tbms-reports',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div><h1>{{ ui.t('rep.title') }}</h1><p>{{ ui.t('rep.subtitle') }}</p></div>
      <div class="head-actions no-print">
        <div class="seg">
          @for (p of periods; track p) { <button type="button" [class.on]="period() === p" (click)="period.set(p)">{{ ui.t('per.' + p) }}</button> }
        </div>
        <button type="button" class="btn secondary" (click)="print()"><tbms-icon name="printer" [size]="16" />{{ ui.t('rep.print') }}</button>
      </div>
    </header>
    <p class="print-only">{{ store.org()?.name }} · {{ ui.t('per.' + period()) }}</p>

    <div class="cols-2">
      <section class="card panel">
        <div class="panel-head"><div><h2>{{ ui.t('rep.pl') }}</h2><p>{{ ui.t('rep.salesCount', { n: f().saleCount }) }}</p></div></div>
        <dl class="pl">
          <dt>{{ ui.t('rep.revenue') }}</dt><dd>{{ ui.money(f().revenue) }}</dd>
          <dt class="ind">− {{ ui.t('rep.cogs') }}</dt><dd>{{ ui.money(f().cogs) }}</dd>
          <dt class="sum">{{ ui.t('rep.gross') }} <span class="pct">{{ pct(f().gross, f().revenue) }}</span></dt><dd class="sum">{{ ui.money(f().gross) }}</dd>
          <dt class="ind">− {{ ui.t('rep.opex') }}</dt><dd>{{ ui.money(f().expenses) }}</dd>
          <dt class="total">{{ ui.t('rep.net') }} <span class="pct">{{ pct(f().net, f().revenue) }}</span></dt>
          <dd class="total" [class.neg]="f().net < 0" [class.pos]="f().net > 0">{{ ui.money(f().net) }}</dd>
        </dl>
        <p class="note"><tbms-icon name="info" [size]="14" />{{ ui.t('rep.cogsNote') }}</p>
      </section>

      <section class="card panel">
        <div class="panel-head"><div><h2>{{ ui.t('rep.cash') }}</h2></div></div>
        <div class="split">
          <div class="split-bar" [attr.aria-hidden]="true">
            <i class="rcv" [style.flex]="f().received || 0.0001"></i><i class="crd" [style.flex]="f().creditOutstanding || 0.0001"></i>
          </div>
          <dl class="kv">
            <dt><i class="dot rcv"></i>{{ ui.t('rep.received') }}</dt><dd>{{ ui.money(f().received) }}</dd>
            <dt><i class="dot crd"></i>{{ ui.t('rep.onCredit') }}</dt><dd [class.neg]="f().creditOutstanding > 0">{{ ui.money(f().creditOutstanding) }}</dd>
          </dl>
        </div>
        <div class="liab">
          <dl class="kv">
            <dt>{{ ui.t('rep.receivables') }}</dt><dd>{{ ui.money(totalReceivable()) }}</dd>
            <dt>{{ ui.t('rep.liabilities') }}</dt><dd>{{ ui.money(owed()) }}</dd>
          </dl>
        </div>
      </section>
    </div>

    <div class="cols-2 mt">
      <section class="card panel">
        <div class="panel-head"><div><h2>{{ ui.t('rep.topProducts') }}</h2></div></div>
        @for (t of top(); track t.productId) {
          <div class="bar-row"><span>{{ t.name }} <small class="muted">· {{ ui.num(t.qty) }} {{ ui.t('rep.unitsSold') }}</small></span><span class="v">{{ ui.money(t.revenue) }}</span>
            <div class="track"><i [style.width.%]="t.pct"></i></div></div>
        } @empty { <p class="muted">{{ ui.t('rep.nothing') }}</p> }
      </section>
      <section class="card panel">
        <div class="panel-head"><div><h2>{{ ui.t('rep.expByCat') }}</h2></div></div>
        @for (c of expCats(); track c.id) {
          <div class="bar-row"><span>{{ c.name }}</span><span class="v">{{ ui.money(c.amount) }}</span><div class="track exp"><i [style.width.%]="c.pct"></i></div></div>
        } @empty { <p class="muted">{{ ui.t('rep.nothing') }}</p> }
      </section>
    </div>

    <section class="card table-card mt">
      <div class="panel-head pad"><div><h2>{{ ui.t('rep.receivables') }}</h2></div></div>
      @if (recv().length) {
        <table class="table">
          <thead><tr><th>{{ ui.t('common.customer') }}</th><th class="num">{{ ui.t('nav.sales') }}</th><th>{{ ui.t('rep.oldest') }}</th><th class="num">{{ ui.t('cus.owes') }}</th></tr></thead>
          <tbody>
            @for (r of recv(); track r.customerId) {
              <tr class="click" [routerLink]="['/customers']">
                <td class="lead"><span class="strong">{{ store.customerById().get(r.customerId)?.name }}</span></td>
                <td class="num" [attr.data-label]="ui.t('nav.sales')">{{ r.sales }}</td>
                <td [attr.data-label]="ui.t('rep.oldest')"><span class="badge" [class.bad]="age(r.oldest) > 30" [class.warn]="age(r.oldest) <= 30">{{ ui.t('rep.daysAgo', { n: age(r.oldest) }) }}</span></td>
                <td class="num strong neg" [attr.data-label]="ui.t('cus.owes')">{{ ui.money(r.amount) }}</td>
              </tr>
            }
          </tbody>
        </table>
      } @else { <div class="empty"><span class="empty-ic"><tbms-icon name="check" [size]="26" /></span><p>{{ ui.t('rep.noReceivables') }}</p></div> }
    </section>
  `,
  styles: [`
    .pl { display: grid; grid-template-columns: 1fr auto; gap: 10px 16px; margin: 0; font-size: 14.5px; font-variant-numeric: tabular-nums;
      dt { color: var(--text-2); } dd { margin: 0; text-align: right; color: var(--text-1); }
      .ind { padding-left: 12px; }
      .sum { font-weight: 600; color: var(--text-1); border-top: 1px solid var(--border); padding-top: 10px; }
      .total { font: 700 17px var(--font-display); color: var(--text-1); border-top: 2px solid var(--border-strong); padding-top: 12px; }
      .pct { font: 500 12px var(--font-body); color: var(--text-3); margin-left: 6px; } }
    .note { display: flex; gap: 6px; align-items: center; font-size: 12.5px; color: var(--text-3); margin: 16px 0 0; }
    .split-bar { display: flex; gap: 2px; height: 14px; border-radius: 99px; overflow: hidden; margin-bottom: 16px;
      i { display: block; } .rcv { background: var(--series-1); } .crd { background: var(--series-2); } }
    .dot { display: inline-block; width: 9px; height: 9px; border-radius: 3px; margin-right: 8px; &.rcv { background: var(--series-1); } &.crd { background: var(--series-2); } }
    .liab { margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--border); }
    .muted { color: var(--text-3); font-size: 14px; margin: 0; } small.muted { font-size: 12.5px; }
    .pad { padding: 18px 20px 4px; }
    .print-only { display: none; }
    @media print { .print-only { display: block; } }
  `],
})
export class ReportsComponent {
  readonly ui = inject(Ui);
  readonly store = inject(Store);
  readonly periods: PeriodKey[] = ['today', 'thisMonth', 'lastMonth', 'last90', 'thisYear'];
  readonly period = signal<PeriodKey>('thisMonth');

  readonly f = computed(() => finance(this.store.sales(), this.store.expenses(), this.store.productById(), periodRange(this.period())));
  readonly recv = computed(() => receivables(this.store.sales()));
  readonly totalReceivable = computed(() => this.recv().reduce((a, r) => a + r.amount, 0));
  readonly owed = computed(() => payables(this.store.purchases()));
  readonly top = computed(() => {
    const list = this.f().topProducts.slice(0, 8);
    const max = Math.max(1, ...list.map((t) => t.revenue));
    return list.map((t) => ({ ...t, name: this.store.productById().get(t.productId)?.name ?? '—', pct: (t.revenue / max) * 100 }));
  });
  readonly expCats = computed(() => {
    const entries = [...this.f().expenseByCat.entries()].sort((a, b) => b[1] - a[1]);
    const max = Math.max(1, ...entries.map((e) => e[1]));
    return entries.map(([id, amount]) => ({ id, amount, name: this.store.expenseCategoryById().get(id)?.name ?? '—', pct: (amount / max) * 100 }));
  });

  pct(part: number, whole: number) { return whole ? `${Math.round((part / whole) * 100)}%` : ''; }
  age(iso: string) { return daysSince(iso); }
  print() { window.print(); }
}
