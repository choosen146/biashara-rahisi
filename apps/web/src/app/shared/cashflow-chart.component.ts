import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, computed, inject, input, signal, viewChild,
} from '@angular/core';
import { I18n } from '../core/i18n';
import { formatCompact, formatMoney, formatMonth, toNumber } from '../core/format';
import { smooth } from './viz';

export interface CashflowPoint { month: string; revenue: string; expenses: string }

const PAD = { top: 16, right: 12, bottom: 30, left: 48 };
const HEIGHT = 260;

function niceStep(max: number, ticks: number) {
  const raw = max / ticks;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  return (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
}

/**
 * Revenue vs expenses as smooth gradient areas on one shared axis. Lines draw in on load;
 * hover/focus shows a crosshair, 8px markers and a tooltip. Identity is never colour-alone:
 * legend above, labels in the tooltip, and the parent offers a table view.
 */
@Component({
  selector: 'tbms-cashflow-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="legend" aria-hidden="true">
      <span><i class="sw rev"></i>{{ i18n.t('dash.revenue') }}</span>
      <span><i class="sw exp"></i>{{ i18n.t('dash.expenses') }}</span>
    </div>
    <div class="wrap" #wrap (mouseleave)="active.set(null)" (mousemove)="onMove($event)">
      <svg [attr.width]="width()" [attr.height]="HEIGHT" role="img" [attr.aria-label]="i18n.t('dash.cashflowHint')">
        <defs>
          <linearGradient id="cf-rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style="stop-color:var(--series-1);stop-opacity:.32" /><stop offset="100%" style="stop-color:var(--series-1);stop-opacity:0" />
          </linearGradient>
          <linearGradient id="cf-exp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style="stop-color:var(--series-2);stop-opacity:.22" /><stop offset="100%" style="stop-color:var(--series-2);stop-opacity:0" />
          </linearGradient>
        </defs>
        @for (t of ticks(); track t.value) {
          <line class="grid" [attr.x1]="PAD.left" [attr.x2]="width() - PAD.right" [attr.y1]="t.y" [attr.y2]="t.y" />
          <text class="axis" [attr.x]="PAD.left - 10" [attr.y]="t.y + 4" text-anchor="end">{{ t.label }}</text>
        }
        @for (p of points(); track p.month) {
          <text class="axis" [attr.x]="p.x" [attr.y]="HEIGHT - 8" text-anchor="middle" [class.on]="active() === $index">{{ p.label }}</text>
        }
        <path class="area" [attr.d]="paths().expArea" fill="url(#cf-exp)" />
        <path class="area" [attr.d]="paths().revArea" fill="url(#cf-rev)" />
        <path class="line exp" [attr.d]="paths().exp" pathLength="1" />
        <path class="line rev" [attr.d]="paths().rev" pathLength="1" />
        @if (paths().revTail) {
          <path class="tail exp" [attr.d]="paths().expTail" />
          <path class="tail rev" [attr.d]="paths().revTail" />
        }
        @if (active() !== null) {
          <line class="cross" [attr.x1]="points()[active()!].x" [attr.x2]="points()[active()!].x" [attr.y1]="PAD.top" [attr.y2]="baseY()" />
          <circle class="dot exp" [attr.cx]="points()[active()!].x" [attr.cy]="points()[active()!].ye" r="5" />
          <circle class="dot rev" [attr.cx]="points()[active()!].x" [attr.cy]="points()[active()!].yr" r="5" />
        }
        @for (p of points(); track p.month; let i = $index) {
          <rect class="hit" [attr.x]="p.x - colW() / 2" [attr.y]="PAD.top" [attr.width]="colW()" [attr.height]="plotH()"
            tabindex="0" [attr.aria-label]="p.aria" (focus)="active.set(i)" (blur)="active.set(null)" />
        }
      </svg>
      @if (tip(); as t) {
        <div class="tip" [style.left.px]="t.x" [class.flip]="t.flip">
          <b>{{ t.title }}</b>
          <div><i class="sw rev"></i>{{ i18n.t('dash.revenue') }}<span>{{ t.revenue }}</span></div>
          <div><i class="sw exp"></i>{{ i18n.t('dash.expenses') }}<span>{{ t.expenses }}</span></div>
          <div class="net">{{ i18n.t('dash.netShort') }}<span>{{ t.net }}</span></div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host{display:block}
    .legend{display:flex;gap:18px;font-size:12.5px;color:var(--text-2);margin-bottom:6px}
    .legend span{display:inline-flex;align-items:center;gap:7px}
    .sw{width:10px;height:10px;border-radius:3px;display:inline-block;flex:none}
    .sw.rev{background:var(--series-1)} .sw.exp{background:var(--series-2)}
    .wrap{position:relative;width:100%}
    svg{display:block;overflow:visible}
    .grid{stroke:var(--grid);stroke-width:1}
    .axis{fill:var(--text-3);font-size:11px;font-variant-numeric:tabular-nums;transition:fill .2s}
    .axis.on{fill:var(--text-1);font-weight:600}
    .line{fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;
      animation:cf-draw 1.4s cubic-bezier(.2,.8,.2,1) .15s forwards}
    .line.rev{stroke:var(--series-1)} .line.exp{stroke:var(--series-2);animation-delay:.35s}
    .area{opacity:0;animation:cf-fade .9s ease .8s forwards}
    .tail{fill:none;stroke-width:2.5;stroke-dasharray:5 5;stroke-linecap:round;opacity:0;animation:cf-fade .5s ease 1.4s forwards}
    .tail.rev{stroke:var(--series-1)} .tail.exp{stroke:var(--series-2)}
    @media (prefers-reduced-motion: reduce){.tail{opacity:1;animation:none}}
    .cross{stroke:var(--axis);stroke-width:1;stroke-dasharray:3 3}
    .dot{stroke:var(--surface);stroke-width:2.5} .dot.rev{fill:var(--series-1)} .dot.exp{fill:var(--series-2)}
    .hit{fill:transparent;outline:none;cursor:crosshair}
    .hit:focus-visible{stroke:var(--focus);stroke-width:2}
    @keyframes cf-draw{to{stroke-dashoffset:0}}
    @keyframes cf-fade{to{opacity:1}}
    @media (prefers-reduced-motion: reduce){.line{stroke-dashoffset:0;animation:none}.area{opacity:1;animation:none}}
    .tip{position:absolute;top:4px;transform:translateX(14px);pointer-events:none;background:var(--surface-raised);
      border:1px solid var(--border);border-radius:12px;padding:10px 12px;box-shadow:var(--shadow-lg);min-width:190px;font-size:12.5px;z-index:2;
      animation:tip-in .15s ease-out}
    .tip.flip{transform:translateX(calc(-100% - 14px))}
    @keyframes tip-in{from{opacity:0}}
    .tip b{display:block;font-weight:600;margin-bottom:6px;color:var(--text-1)}
    .tip div{display:flex;align-items:center;gap:7px;color:var(--text-2);padding:2px 0}
    .tip span{margin-left:auto;color:var(--text-1);font-variant-numeric:tabular-nums;font-weight:500}
    .tip .net{border-top:1px solid var(--border);margin-top:4px;padding-top:6px}
  `],
})
export class CashflowChartComponent implements AfterViewInit, OnDestroy {
  readonly i18n = inject(I18n);
  readonly PAD = PAD;
  readonly HEIGHT = HEIGHT;

  data = input.required<CashflowPoint[]>();
  currency = input('TZS');
  /** Last point is month-to-date: draw the final segment dashed so a partial month never reads as a collapse. */
  partialLast = input(false);

  private wrap = viewChild.required<ElementRef<HTMLDivElement>>('wrap');
  private observer?: ResizeObserver;
  readonly width = signal(640);
  readonly active = signal<number | null>(null);

  readonly plotH = computed(() => HEIGHT - PAD.top - PAD.bottom);
  readonly baseY = computed(() => PAD.top + this.plotH());
  readonly colW = computed(() => (this.width() - PAD.left - PAD.right) / Math.max(1, this.data().length - 1));

  private scale = computed(() => {
    const max = Math.max(1, ...this.data().flatMap((d) => [toNumber(d.revenue), toNumber(d.expenses)]));
    const step = niceStep(max, 4);
    return { step, top: Math.ceil(max / step) * step };
  });
  private y(v: number) { return PAD.top + this.plotH() * (1 - v / this.scale().top); }

  readonly ticks = computed(() => {
    const { step, top } = this.scale();
    const out: { value: number; y: number; label: string }[] = [];
    for (let v = 0; v <= top + step / 2; v += step) out.push({ value: v, y: this.y(v), label: formatCompact(v, this.i18n.locale()) });
    return out;
  });

  readonly points = computed(() => {
    const data = this.data();
    const locale = this.i18n.locale();
    const plotW = this.width() - PAD.left - PAD.right;
    const fmt = (n: number) => formatMoney(n, locale, this.currency());
    return data.map((d, i) => {
      const rv = toNumber(d.revenue), ex = toNumber(d.expenses);
      return {
        month: d.month, label: formatMonth(d.month, locale), x: PAD.left + (data.length > 1 ? (i / (data.length - 1)) * plotW : plotW / 2),
        yr: this.y(rv), ye: this.y(ex),
        aria: `${formatMonth(d.month, locale, 'long')}: ${this.i18n.t('dash.revenue')} ${fmt(rv)}, ${this.i18n.t('dash.expenses')} ${fmt(ex)}`,
      };
    });
  });

  readonly paths = computed(() => {
    const p = this.points();
    const base = this.baseY();
    const partial = this.partialLast() && p.length > 2;
    const solid = partial ? p.slice(0, -1) : p;
    const rev = smooth(solid.map((q) => [q.x, q.yr] as const));
    const exp = smooth(solid.map((q) => [q.x, q.ye] as const));
    const last = solid[solid.length - 1];
    const close = solid.length ? ` L${last.x} ${base} L${solid[0].x} ${base} Z` : '';
    const a = p[p.length - 2], b = p[p.length - 1];
    return {
      rev, exp, revArea: rev + close, expArea: exp + close,
      revTail: partial ? `M${a.x} ${a.yr} L${b.x} ${b.yr}` : '',
      expTail: partial ? `M${a.x} ${a.ye} L${b.x} ${b.ye}` : '',
    };
  });

  readonly tip = computed(() => {
    const i = this.active();
    if (i === null) return null;
    const p = this.points()[i], d = this.data()[i];
    if (!p || !d) return null;
    const locale = this.i18n.locale();
    const fmt = (n: number) => formatMoney(n, locale, this.currency());
    const rv = toNumber(d.revenue), ex = toNumber(d.expenses);
    return { x: p.x, flip: p.x > this.width() * 0.6, title: formatMonth(d.month, locale, 'long'), revenue: fmt(rv), expenses: fmt(ex), net: fmt(rv - ex) };
  });

  onMove(e: MouseEvent) {
    const rect = this.wrap().nativeElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pts = this.points();
    if (!pts.length) return;
    let best = 0;
    for (let i = 1; i < pts.length; i++) if (Math.abs(pts[i].x - x) < Math.abs(pts[best].x - x)) best = i;
    this.active.set(best);
  }

  ngAfterViewInit() {
    const el = this.wrap().nativeElement;
    this.width.set(el.clientWidth || 640);
    this.observer = new ResizeObserver(([entry]) => this.width.set(Math.max(280, Math.floor(entry.contentRect.width))));
    this.observer.observe(el);
  }
  ngOnDestroy() { this.observer?.disconnect(); }
}
