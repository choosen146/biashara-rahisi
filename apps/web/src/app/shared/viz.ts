import {
  ChangeDetectionStrategy, Component, OnDestroy, computed, effect, inject, input, signal, untracked,
} from '@angular/core';
import { Ui } from '../core/ui';

const reduceMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
let gradSeq = 0;

/** Counts up to `value` with an ease-out curve whenever the value changes. */
@Component({
  selector: 'tbms-count',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ text() }}`,
  host: { style: 'font-variant-numeric: tabular-nums' },
})
export class CountComponent implements OnDestroy {
  private ui = inject(Ui);
  value = input.required<number>();
  kind = input<'money' | 'num'>('num');
  duration = input(900);
  private shown = signal(0);
  private raf = 0;
  readonly text = computed(() => {
    this.ui.i18n.lang();
    const v = Math.round(this.shown());
    return this.kind() === 'money' ? this.ui.money(v) : this.ui.num(v);
  });

  constructor() {
    effect(() => {
      const target = this.value();
      untracked(() => this.animate(target));
    });
  }

  private animate(target: number) {
    cancelAnimationFrame(this.raf);
    const from = this.shown();
    if (reduceMotion() || from === target) { this.shown.set(target); return; }
    const start = performance.now();
    const d = this.duration();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / d);
      const e = 1 - Math.pow(1 - p, 3);
      this.shown.set(from + (target - from) * e);
      if (p < 1) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  ngOnDestroy() { cancelAnimationFrame(this.raf); }
}

/** Tiny smooth area chart; decorative (values are shown as text beside it). */
@Component({
  selector: 'tbms-spark',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 120 40" preserveAspectRatio="none">
      <defs>
        <linearGradient [attr.id]="gid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" [attr.stop-color]="color()" stop-opacity=".35" />
          <stop offset="100%" [attr.stop-color]="color()" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path class="area" [attr.d]="paths().area" [attr.fill]="'url(#' + gid + ')'" />
      <path class="line" [attr.d]="paths().line" [attr.stroke]="color()" pathLength="1" />
    </svg>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 40px; }
    svg { width: 100%; height: 100%; overflow: visible; display: block; }
    .line { fill: none; stroke-width: 2; vector-effect: non-scaling-stroke; stroke-linecap: round;
      stroke-dasharray: 1; stroke-dashoffset: 1; animation: spark-draw 1.2s cubic-bezier(.2,.8,.2,1) .3s forwards; }
    .area { opacity: 0; animation: spark-fade .8s ease .7s forwards; }
    @keyframes spark-draw { to { stroke-dashoffset: 0; } }
    @keyframes spark-fade { to { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { .line { stroke-dashoffset: 0; animation: none; } .area { opacity: 1; animation: none; } }
  `],
})
export class SparkComponent {
  values = input.required<number[]>();
  color = input('#6246ea');
  readonly gid = `spk${gradSeq++}`;
  readonly paths = computed(() => {
    const v = this.values();
    if (v.length < 2) return { line: '', area: '' };
    const max = Math.max(...v), min = Math.min(0, ...v);
    const pts = v.map((y, i) => [(i / (v.length - 1)) * 120, 36 - ((y - min) / Math.max(1, max - min)) * 32] as const);
    const line = smooth(pts);
    return { line, area: `${line} L120 40 L0 40 Z` };
  });
}

/** Progress ring with an animated sweep. */
@Component({
  selector: 'tbms-ring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 44 44">
      <defs>
        <linearGradient [attr.id]="gid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" [attr.stop-color]="from()" /><stop offset="100%" [attr.stop-color]="to()" />
        </linearGradient>
      </defs>
      <circle cx="22" cy="22" r="18" class="track" />
      <circle cx="22" cy="22" r="18" class="arc" [attr.stroke]="'url(#' + gid + ')'" pathLength="100"
        [style.stroke-dashoffset]="100 - pct()" />
    </svg>
    <span>{{ pct() }}%</span>
  `,
  styles: [`
    :host { position: relative; display: inline-grid; place-items: center; width: 52px; height: 52px; flex: none; }
    svg { position: absolute; inset: 0; transform: rotate(-90deg); }
    circle { fill: none; stroke-width: 5; }
    .track { stroke: var(--hover); }
    .arc { stroke-linecap: round; stroke-dasharray: 100; transition: stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1);
      animation: ring-in 1.1s cubic-bezier(.2,.8,.2,1); }
    @keyframes ring-in { from { stroke-dashoffset: 100; } }
    span { font-size: 11px; font-weight: 700; color: var(--text-1); font-variant-numeric: tabular-nums; }
  `],
})
export class RingComponent {
  value = input.required<number>(); // 0..1
  from = input('#8b5cf6');
  to = input('#d946ef');
  readonly gid = `rng${gradSeq++}`;
  readonly pct = computed(() => Math.round(Math.max(0, Math.min(1, this.value())) * 100));
}

/** Monotone-ish smoothing via Catmull-Rom → Bézier; keeps lines calm without overshooting much. */
export function smooth(pts: readonly (readonly [number, number])[]): string {
  if (!pts.length) return '';
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const t = 0.18;
    const c1x = p1[0] + (p2[0] - p0[0]) * t, c1y = p1[1] + (p2[1] - p0[1]) * t;
    const c2x = p2[0] - (p3[0] - p1[0]) * t, c2y = p2[1] - (p3[1] - p1[1]) * t;
    d += ` C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d;
}
