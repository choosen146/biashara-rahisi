import { ChangeDetectionStrategy, Component, Injectable, inject, signal } from '@angular/core';
import { formatMoney, formatRelative } from './format';
import { I18n, I18nKey } from './i18n';
import { AuditEvent, Unit } from './models';
import { AppError, Store } from './store';
import { IconComponent } from '../shared/icon.component';

export interface Toast { id: number; kind: 'success' | 'error'; text: string }

const REASONS = ['damage', 'loss', 'count', 'expired', 'other'];

/** Formatting, toasts and error handling shared by every page. */
@Injectable({ providedIn: 'root' })
export class Ui {
  readonly i18n = inject(I18n);
  private store = inject(Store);
  readonly toasts = signal<Toast[]>([]);
  private seq = 0;

  t(key: I18nKey | string, params?: Record<string, string | number>) { return this.i18n.t(key, params); }

  money(v: number | null | undefined) { return formatMoney(v ?? 0, this.i18n.locale(), this.store.org()?.currency ?? 'TZS'); }
  num(v: number) { return new Intl.NumberFormat(this.i18n.locale(), { maximumFractionDigits: 3 }).format(v); }
  qty(v: number, unit?: Unit) { return unit ? `${this.num(v)} ${this.t('unit.' + unit)}` : this.num(v); }
  date(iso: string) {
    return new Intl.DateTimeFormat(this.i18n.locale(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Dar_es_Salaam' }).format(new Date(iso));
  }
  dateTime(iso: string) {
    return new Intl.DateTimeFormat(this.i18n.locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Dar_es_Salaam' }).format(new Date(iso));
  }
  rel(iso: string) { return formatRelative(iso, this.i18n.locale()); }
  userName(id: string) { return this.store.userById().get(id)?.name ?? '—'; }

  reason(r?: string) {
    if (!r) return '';
    const [code, ...rest] = r.split(': ');
    const label = REASONS.includes(code) ? this.t('inv.reason.' + code) : code;
    return rest.length ? `${label}: ${rest.join(': ')}` : label;
  }

  auditText(e: AuditEvent) {
    const p: Record<string, string | number> = { ...e.params };
    if (typeof p['amount'] === 'number') p['amount'] = this.money(p['amount']);
    if (typeof p['qty'] === 'number') p['qty'] = (p['qty'] > 0 ? '+' : '') + this.num(p['qty']);
    if (typeof p['role'] === 'string') p['role'] = this.t('role.' + p['role']);
    if (typeof p['reason'] === 'string') p['reason'] = this.reason(p['reason']);
    return this.t(e.action, p);
  }

  toast(text: string, kind: Toast['kind'] = 'success') {
    const id = ++this.seq;
    this.toasts.update((l) => [...l, { id, kind, text }]);
    setTimeout(() => this.dismiss(id), kind === 'error' ? 6000 : 3500);
  }
  dismiss(id: number) { this.toasts.update((l) => l.filter((x) => x.id !== id)); }

  /** Runs a store mutation; toasts success or the translated error. Returns whether it succeeded. */
  run(fn: () => unknown, success?: I18nKey | string, params?: Record<string, string | number>): boolean {
    try {
      fn();
      if (success) this.toast(this.t(success, params));
      return true;
    } catch (e) {
      this.toast(e instanceof AppError ? this.t(e.key, e.params) : this.t('err.generic'), 'error');
      return false;
    }
  }

  /** Same as run() but returns the error text instead of toasting — for inline form errors. */
  attempt<R>(fn: () => R): { ok: true; value: R } | { ok: false; error: string } {
    try { return { ok: true, value: fn() }; } catch (e) {
      return { ok: false, error: e instanceof AppError ? this.t(e.key, e.params) : this.t('err.generic') };
    }
  }

  newKey() { return `k_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`; }
}

@Component({
  selector: 'tbms-toasts',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="toasts" aria-live="polite">
    @for (t of ui.toasts(); track t.id) {
      <div class="toast" [class.error]="t.kind === 'error'" role="status">
        <tbms-icon [name]="t.kind === 'error' ? 'alert' : 'check'" [size]="17" [stroke]="2.2" />
        <span>{{ t.text }}</span>
        <button type="button" (click)="ui.dismiss(t.id)" aria-label="Dismiss"><tbms-icon name="x" [size]="15" /></button>
      </div>
    }
  </div>`,
})
export class ToastsComponent { readonly ui = inject(Ui); }
