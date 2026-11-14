import { Expense, Product, Purchase, Sale } from './models';
import { saleBalance, salePaid } from './store';

const EAT = 3 * 3600e3;

/** [from, to) in UTC ms for a calendar month in East Africa Time; offset 0 = this month. */
export function monthRange(offset = 0, now = Date.now()): [number, number] {
  const l = new Date(now + EAT);
  const from = Date.UTC(l.getUTCFullYear(), l.getUTCMonth() + offset, 1) - EAT;
  const to = Date.UTC(l.getUTCFullYear(), l.getUTCMonth() + offset + 1, 1) - EAT;
  return [from, to];
}
/** The same elapsed span of last month (e.g. 1–12 Oct when today is 12 Nov) — a fair comparison for month-to-date. */
export function lastMonthToDate(now = Date.now()): [number, number] {
  const [curFrom] = monthRange(0, now);
  const [prevFrom, prevTo] = monthRange(-1, now);
  return [prevFrom, Math.min(prevTo, prevFrom + (now - curFrom))];
}
export function dayRange(offset = 0, now = Date.now()): [number, number] {
  const l = new Date(now + EAT);
  const from = Date.UTC(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate() + offset) - EAT;
  return [from, from + 86400e3];
}
export function yearRange(now = Date.now()): [number, number] {
  const l = new Date(now + EAT);
  return [Date.UTC(l.getUTCFullYear(), 0, 1) - EAT, Date.UTC(l.getUTCFullYear() + 1, 0, 1) - EAT];
}
export type PeriodKey = 'today' | 'thisMonth' | 'lastMonth' | 'last90' | 'thisYear';
export function periodRange(p: PeriodKey, now = Date.now()): [number, number] {
  switch (p) {
    case 'today': return dayRange(0, now);
    case 'thisMonth': return monthRange(0, now);
    case 'lastMonth': return monthRange(-1, now);
    case 'last90': return [dayRange(-89, now)[0], dayRange(0, now)[1]];
    case 'thisYear': return yearRange(now);
  }
}
export const inRange = (iso: string, [from, to]: [number, number]) => { const t = Date.parse(iso); return t >= from && t < to; };
/** YYYY-MM in EAT */
export const monthKey = (iso: string) => new Date(Date.parse(iso) + EAT).toISOString().slice(0, 7);

export interface Finance {
  revenue: number; cogs: number; gross: number; expenses: number; net: number;
  received: number; creditOutstanding: number; saleCount: number; expenseByCat: Map<string, number>;
  topProducts: { productId: string; qty: number; revenue: number }[];
}

/**
 * Revenue (accrual), cash received, credit, expenses and profit are kept distinct (SRS business rule 5).
 * COGS uses each product's current cost price — an estimate until costing method is decided.
 */
export function finance(sales: Sale[], expenses: Expense[], products: Map<string, Product>, range: [number, number]): Finance {
  let revenue = 0, cogs = 0, received = 0, creditOutstanding = 0, saleCount = 0;
  const byProduct = new Map<string, { qty: number; revenue: number }>();
  for (const s of sales) {
    if (s.status !== 'COMPLETED' || !inRange(s.createdAt, range)) continue;
    saleCount++;
    revenue += s.total;
    received += salePaid(s);
    creditOutstanding += saleBalance(s);
    for (const l of s.lines) {
      cogs += Math.round(l.quantity * (products.get(l.productId)?.cost ?? 0));
      const e = byProduct.get(l.productId) ?? { qty: 0, revenue: 0 };
      e.qty += l.quantity; e.revenue += Math.round(l.quantity * l.unitPrice);
      byProduct.set(l.productId, e);
    }
  }
  let exp = 0;
  const expenseByCat = new Map<string, number>();
  for (const e of expenses) {
    if (e.status !== 'POSTED' || !inRange(e.date, range)) continue;
    exp += e.amount;
    expenseByCat.set(e.categoryId, (expenseByCat.get(e.categoryId) ?? 0) + e.amount);
  }
  const topProducts = [...byProduct.entries()].map(([productId, v]) => ({ productId, ...v })).sort((a, b) => b.revenue - a.revenue);
  return { revenue, cogs, gross: revenue - cogs, expenses: exp, net: revenue - cogs - exp, received, creditOutstanding, saleCount, expenseByCat, topProducts };
}

export interface Receivable { customerId: string; amount: number; sales: number; oldest: string }
export function receivables(sales: Sale[]): Receivable[] {
  const map = new Map<string, Receivable>();
  for (const s of sales) {
    if (s.status !== 'COMPLETED' || !s.customerId) continue;
    const b = saleBalance(s);
    if (b <= 0) continue;
    const r = map.get(s.customerId) ?? { customerId: s.customerId, amount: 0, sales: 0, oldest: s.createdAt };
    r.amount += b; r.sales++; if (s.createdAt < r.oldest) r.oldest = s.createdAt;
    map.set(s.customerId, r);
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount);
}

export const payables = (purchases: Purchase[]) =>
  purchases.filter((p) => p.status === 'COMPLETED' && !p.paid).reduce((a, p) => a + p.total, 0);

export function daysSince(iso: string) { return Math.floor((Date.now() - Date.parse(iso)) / 86400e3); }
