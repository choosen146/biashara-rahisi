/**
 * Money arrives from the API as decimal strings. Display rounding only — never do accounting with these numbers.
 */
export function toNumber(value: string | number | null | undefined): number {
  const n = typeof value === 'number' ? value : parseFloat(value ?? '0');
  return Number.isFinite(n) ? n : 0;
}

export function formatMoney(value: string | number | null | undefined, locale: string, currency = 'TZS'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: 'code', maximumFractionDigits: 0 })
    .format(toNumber(value))
    .replace(/ /g, ' ');
}

/** 1.2M, 340K — for chart axes and tight spaces. */
export function formatCompact(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function formatMonth(yyyyMm: string, locale: string, style: 'short' | 'long' = 'short'): string {
  const [y, m] = yyyyMm.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, { month: style, year: style === 'long' ? 'numeric' : undefined, timeZone: 'UTC' })
    .format(new Date(Date.UTC(y, m - 1, 1)));
}

export function formatRelative(iso: string, locale: string): string {
  const diffSec = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(Math.round(diffSec), 'second');
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 86400 * 7) return rtf.format(Math.round(diffSec / 86400), 'day');
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(iso));
}
