import { Injectable, computed, signal } from '@angular/core';
import {
  BusinessType, Contact, DB, Expense, Movement, Org, PaymentMethod, Perm, Product, Purchase, ROLE_PERMS, Role, Sale, Unit,
} from './models';
import { DEFAULT_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES, DEMO_PASSWORD, createSeed, uid } from './seed';

const DB_KEY = 'tbms_proto_db_v4';
const SESSION_KEY = 'tbms_proto_session_v1';

/** A user-facing failure; `key` is an i18n key. */
export class AppError extends Error {
  constructor(public key: string, public params: Record<string, string | number> = {}) { super(key); }
}

interface Session { userId: string; orgId: string }
interface Ctx { orgId: string; userId: string; now: string; org: Org }

function safeRead<T>(key: string): T | null {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : null; } catch { return null; }
}
function safeWrite(key: string, value: unknown) {
  try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value)); } catch { /* full or blocked */ }
}

export const saleBalance = (s: Sale) => s.total - s.payments.reduce((a, p) => a + p.amount, 0);
export const salePaid = (s: Sale) => s.payments.reduce((a, p) => a + p.amount, 0);
export const paymentStatus = (s: Sale): 'PAID' | 'PARTIAL' | 'UNPAID' => {
  const paid = salePaid(s);
  return paid >= s.total ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID';
};

/**
 * In-browser stand-in for the TBMS API. It enforces the same rules the server must:
 * tenant scoping on every read/write, role permissions, all-or-nothing mutations,
 * idempotency keys, no silent overwrites (void instead), and an audit event for every change.
 */
@Injectable({ providedIn: 'root' })
export class Store {
  readonly db = signal<DB>(safeRead<DB>(DB_KEY) ?? createSeed());
  readonly session = signal<Session | null>(safeRead<Session>(SESSION_KEY));

  readonly user = computed(() => this.db().users.find((u) => u.id === this.session()?.userId) ?? null);
  readonly membership = computed(() => {
    const s = this.session();
    return s ? this.db().memberships.find((m) => m.userId === s.userId && m.orgId === s.orgId) ?? null : null;
  });
  readonly org = computed(() => (this.membership() ? this.db().orgs.find((o) => o.id === this.membership()!.orgId) ?? null : null));
  readonly role = computed<Role | null>(() => this.membership()?.role ?? null);
  readonly myOrgs = computed(() => {
    const uidv = this.session()?.userId;
    const d = this.db();
    return d.memberships.filter((m) => m.userId === uidv)
      .map((m) => ({ org: d.orgs.find((o) => o.id === m.orgId)!, role: m.role }))
      .filter((x) => !!x.org);
  });
  readonly inventoryOn = computed(() => this.org()?.inventoryEnabled ?? true);

  can(p: Perm): boolean {
    const r = this.role();
    return !!r && ROLE_PERMS[r].has(p);
  }

  // ---------- tenant-scoped reads ----------
  private scoped<T extends { orgId: string }>(pick: (d: DB) => T[]) {
    return computed(() => {
      const org = this.membership()?.orgId;
      return org ? pick(this.db()).filter((x) => x.orgId === org) : [];
    });
  }
  readonly products = this.scoped((d) => d.products);
  readonly categories = this.scoped((d) => d.categories);
  readonly expenseCategories = this.scoped((d) => d.expenseCategories);
  readonly customers = this.scoped((d) => d.customers);
  readonly suppliers = this.scoped((d) => d.suppliers);
  readonly sales = this.scoped((d) => d.sales);
  readonly purchases = this.scoped((d) => d.purchases);
  readonly expenses = this.scoped((d) => d.expenses);
  readonly movements = this.scoped((d) => d.movements);
  readonly audit = this.scoped((d) => d.audit);
  readonly members = computed(() => {
    const org = this.membership()?.orgId;
    const d = this.db();
    return d.memberships.filter((m) => m.orgId === org).map((m) => ({ ...m, user: d.users.find((u) => u.id === m.userId)! }));
  });

  readonly stock = computed(() => {
    const map = new Map<string, number>();
    for (const m of this.movements()) map.set(m.productId, (map.get(m.productId) ?? 0) + m.quantity);
    return map;
  });
  readonly productById = computed(() => new Map(this.products().map((p) => [p.id, p])));
  readonly customerById = computed(() => new Map(this.customers().map((c) => [c.id, c])));
  readonly supplierById = computed(() => new Map(this.suppliers().map((c) => [c.id, c])));
  readonly categoryById = computed(() => new Map(this.categories().map((c) => [c.id, c])));
  readonly expenseCategoryById = computed(() => new Map(this.expenseCategories().map((c) => [c.id, c])));
  readonly userById = computed(() => new Map(this.db().users.map((u) => [u.id, u])));
  readonly lowStock = computed(() => {
    if (!this.inventoryOn()) return [];
    const s = this.stock();
    return this.products().filter((p) => p.active && p.trackStock && (s.get(p.id) ?? 0) <= p.reorderLevel)
      .map((p) => ({ product: p, qty: s.get(p.id) ?? 0 }))
      .sort((a, b) => a.qty / Math.max(1, a.product.reorderLevel) - b.qty / Math.max(1, b.product.reorderLevel));
  });

  constructor() {
    // A stale session (e.g. after a reset) must not grant access.
    if (this.session() && !this.membership()) this.setSession(null);
  }

  // ---------- auth (prototype) ----------
  login(email: string, password: string) {
    const d = this.db();
    const user = d.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || user.password !== password) throw new AppError('auth.failed');
    const m = d.memberships.find((x) => x.userId === user.id);
    if (!m) throw new AppError('auth.noOrg');
    this.setSession({ userId: user.id, orgId: m.orgId });
  }

  register(input: { name: string; email: string; password: string; orgName: string; businessType: BusinessType }) {
    const email = input.email.trim().toLowerCase();
    if (this.db().users.some((u) => u.email.toLowerCase() === email)) throw new AppError('auth.taken');
    const now = new Date().toISOString();
    const d = { ...this.db() };
    const userId = uid('u');
    const orgId = uid('org');
    d.users = [...d.users, { id: userId, name: input.name.trim(), email, password: input.password, createdAt: now }];
    d.orgs = [...d.orgs, {
      id: orgId, name: input.orgName.trim(), slug: input.orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-'), currency: 'TZS',
      businessType: input.businessType, inventoryEnabled: !['services', 'personal'].includes(input.businessType), createdAt: now,
    }];
    d.memberships = [...d.memberships, { id: uid('m'), userId, orgId, role: 'OWNER', createdAt: now }];
    d.categories = [...d.categories, ...DEFAULT_CATEGORIES.map((name) => ({ id: uid('cat'), orgId, name }))];
    d.expenseCategories = [...d.expenseCategories, ...DEFAULT_EXPENSE_CATEGORIES.map((name) => ({ id: uid('ecat'), orgId, name }))];
    d.audit = [{ id: uid('a'), orgId, actorId: userId, action: 'a.org.create', params: { ref: input.orgName.trim() }, at: now }, ...d.audit];
    this.save(d);
    this.setSession({ userId, orgId });
  }

  switchOrg(orgId: string) {
    const s = this.session();
    if (!s) return;
    if (!this.db().memberships.some((m) => m.userId === s.userId && m.orgId === orgId)) throw new AppError('err.forbidden');
    this.setSession({ ...s, orgId });
  }

  logout() { this.setSession(null); }

  resetDemo() {
    this.save(createSeed());
    this.setSession(null);
  }

  // ---------- sales ----------
  createSale(input: { key: string; customerId: string | null; lines: { productId: string; quantity: number; unitPrice: number }[]; paid: number; method: PaymentMethod }) {
    return this.tx('sales.create', (d, c) => {
      const dup = d.sales.find((s) => s.orgId === c.orgId && s.key === input.key);
      if (dup) return { sale: dup, duplicate: true };
      const lines = input.lines
        .map((l) => ({ productId: l.productId, quantity: Number(l.quantity), unitPrice: Math.round(Number(l.unitPrice)) }))
        .filter((l) => l.productId);
      if (!lines.length) throw new AppError('sales.noLines');
      const products = new Map(d.products.filter((p) => p.orgId === c.orgId).map((p) => [p.id, p]));
      for (const l of lines) {
        if (!products.has(l.productId)) throw new AppError('err.forbidden');
        if (!(l.quantity > 0) || !(l.unitPrice >= 0)) throw new AppError('err.invalidLine');
      }
      if (input.customerId && !d.customers.some((x) => x.id === input.customerId && x.orgId === c.orgId)) throw new AppError('err.forbidden');
      const total = lines.reduce((s, l) => s + Math.round(l.quantity * l.unitPrice), 0);
      const paid = Math.max(0, Math.min(total, Math.round(Number(input.paid) || 0)));
      if (paid < total && !input.customerId) throw new AppError('sales.needCustomer');

      if (c.org.inventoryEnabled) {
        const stock = stockOf(d, c.orgId);
        const need = new Map<string, number>();
        for (const l of lines) need.set(l.productId, (need.get(l.productId) ?? 0) + l.quantity);
        for (const [pid, q] of need) {
          const p = products.get(pid)!;
          const have = stock.get(pid) ?? 0;
          if (p.trackStock && q > have) throw new AppError('sales.notEnough', { name: p.name, n: have });
        }
      }

      const sale: Sale = {
        id: uid('sale'), orgId: c.orgId, number: nextNumber(d, c.orgId, 'S'), key: input.key, customerId: input.customerId, lines, total,
        payments: paid > 0 ? [{ id: uid('pay'), amount: paid, method: input.method, at: c.now, by: c.userId }] : [],
        status: 'COMPLETED', createdAt: c.now, createdBy: c.userId,
      };
      d.sales = [sale, ...d.sales];
      if (c.org.inventoryEnabled) {
        const mvs = lines.filter((l) => products.get(l.productId)!.trackStock)
          .map((l) => movement(c, l.productId, 'SALE', -l.quantity, sale.id));
        d.movements = [...mvs, ...d.movements];
      }
      audit(d, c, 'a.sale.create', { ref: sale.number, amount: total });
      return { sale, duplicate: false };
    });
  }

  recordPayment(saleId: string, amount: number, method: PaymentMethod) {
    return this.tx('payments.record', (d, c) => {
      const sale = d.sales.find((s) => s.id === saleId && s.orgId === c.orgId);
      if (!sale || sale.status !== 'COMPLETED') throw new AppError('err.forbidden');
      const amt = Math.round(Number(amount));
      const bal = saleBalance(sale);
      if (!(amt > 0) || amt > bal) throw new AppError('sales.badPayment', { max: bal });
      const updated = { ...sale, payments: [...sale.payments, { id: uid('pay'), amount: amt, method, at: c.now, by: c.userId }] };
      d.sales = d.sales.map((s) => (s.id === saleId ? updated : s));
      audit(d, c, 'a.sale.payment', { ref: sale.number, amount: amt });
      return updated;
    });
  }

  voidSale(saleId: string, reason: string) {
    return this.tx('sales.void', (d, c) => {
      const sale = d.sales.find((s) => s.id === saleId && s.orgId === c.orgId);
      if (!sale || sale.status !== 'COMPLETED') throw new AppError('err.forbidden');
      if (!reason.trim()) throw new AppError('common.reasonRequired');
      d.sales = d.sales.map((s) => (s.id === saleId ? { ...s, status: 'VOIDED' as const, voidReason: reason.trim() } : s));
      const reversals = d.movements.filter((m) => m.sourceId === saleId && m.type === 'SALE')
        .map((m) => movement(c, m.productId, 'VOID', -m.quantity, saleId, reason.trim()));
      d.movements = [...reversals, ...d.movements];
      audit(d, c, 'a.sale.void', { ref: sale.number, amount: sale.total, reason: reason.trim() });
    });
  }

  // ---------- purchases ----------
  createPurchase(input: { key: string; supplierId: string | null; lines: { productId: string; quantity: number; unitCost: number }[]; paid: boolean; updateCost: boolean }) {
    return this.tx('purchases.create', (d, c) => {
      const dup = d.purchases.find((p) => p.orgId === c.orgId && p.key === input.key);
      if (dup) return { purchase: dup, duplicate: true };
      const lines = input.lines
        .map((l) => ({ productId: l.productId, quantity: Number(l.quantity), unitCost: Math.round(Number(l.unitCost)) }))
        .filter((l) => l.productId);
      if (!lines.length) throw new AppError('sales.noLines');
      const products = new Map(d.products.filter((p) => p.orgId === c.orgId).map((p) => [p.id, p]));
      for (const l of lines) {
        if (!products.has(l.productId)) throw new AppError('err.forbidden');
        if (!(l.quantity > 0) || !(l.unitCost >= 0)) throw new AppError('err.invalidLine');
      }
      if (input.supplierId && !d.suppliers.some((x) => x.id === input.supplierId && x.orgId === c.orgId)) throw new AppError('err.forbidden');
      const total = lines.reduce((s, l) => s + Math.round(l.quantity * l.unitCost), 0);
      const purchase: Purchase = {
        id: uid('pur'), orgId: c.orgId, number: nextNumber(d, c.orgId, 'P'), key: input.key, supplierId: input.supplierId,
        lines, total, paid: input.paid, status: 'COMPLETED', createdAt: c.now, createdBy: c.userId,
      };
      d.purchases = [purchase, ...d.purchases];
      if (c.org.inventoryEnabled) {
        d.movements = [...lines.filter((l) => products.get(l.productId)!.trackStock)
          .map((l) => movement(c, l.productId, 'PURCHASE', l.quantity, purchase.id)), ...d.movements];
      }
      if (input.updateCost) {
        const costs = new Map(lines.map((l) => [l.productId, l.unitCost]));
        d.products = d.products.map((p) => (costs.has(p.id) ? { ...p, cost: costs.get(p.id)!, updatedAt: c.now } : p));
      }
      audit(d, c, 'a.purchase.create', { ref: purchase.number, amount: total });
      return { purchase, duplicate: false };
    });
  }

  markPurchasePaid(id: string) {
    return this.tx('purchases.create', (d, c) => {
      const p = d.purchases.find((x) => x.id === id && x.orgId === c.orgId);
      if (!p || p.paid || p.status !== 'COMPLETED') throw new AppError('err.forbidden');
      d.purchases = d.purchases.map((x) => (x.id === id ? { ...x, paid: true } : x));
      audit(d, c, 'a.purchase.paid', { ref: p.number, amount: p.total });
    });
  }

  voidPurchase(id: string, reason: string) {
    return this.tx('purchases.void', (d, c) => {
      const p = d.purchases.find((x) => x.id === id && x.orgId === c.orgId);
      if (!p || p.status !== 'COMPLETED') throw new AppError('err.forbidden');
      if (!reason.trim()) throw new AppError('common.reasonRequired');
      const stock = stockOf(d, c.orgId);
      const ins = d.movements.filter((m) => m.sourceId === id && m.type === 'PURCHASE');
      for (const m of ins) if ((stock.get(m.productId) ?? 0) - m.quantity < 0) throw new AppError('pur.voidBlocked');
      d.purchases = d.purchases.map((x) => (x.id === id ? { ...x, status: 'VOIDED' as const, voidReason: reason.trim() } : x));
      d.movements = [...ins.map((m) => movement(c, m.productId, 'VOID', -m.quantity, id, reason.trim())), ...d.movements];
      audit(d, c, 'a.purchase.void', { ref: p.number, amount: p.total, reason: reason.trim() });
    });
  }

  // ---------- expenses ----------
  createExpense(input: { key: string; categoryId: string; amount: number; method: PaymentMethod; date: string; note?: string }) {
    return this.tx('expenses.create', (d, c) => {
      const dup = d.expenses.find((e) => e.orgId === c.orgId && e.key === input.key);
      if (dup) return { expense: dup, duplicate: true };
      const cat = d.expenseCategories.find((x) => x.id === input.categoryId && x.orgId === c.orgId);
      if (!cat) throw new AppError('common.required');
      const amount = Math.round(Number(input.amount));
      if (!(amount > 0)) throw new AppError('exp.badAmount');
      const expense: Expense = {
        id: uid('exp'), orgId: c.orgId, number: nextNumber(d, c.orgId, 'E'), key: input.key, categoryId: cat.id, amount,
        method: input.method, note: input.note?.trim() || undefined, date: input.date || c.now, status: 'POSTED', createdAt: c.now, createdBy: c.userId,
      };
      d.expenses = [expense, ...d.expenses];
      audit(d, c, 'a.expense.create', { ref: cat.name, amount });
      return { expense, duplicate: false };
    });
  }

  voidExpense(id: string, reason: string) {
    return this.tx('expenses.void', (d, c) => {
      const e = d.expenses.find((x) => x.id === id && x.orgId === c.orgId);
      if (!e || e.status !== 'POSTED') throw new AppError('err.forbidden');
      if (!reason.trim()) throw new AppError('common.reasonRequired');
      d.expenses = d.expenses.map((x) => (x.id === id ? { ...x, status: 'VOIDED' as const, voidReason: reason.trim() } : x));
      const cat = d.expenseCategories.find((x) => x.id === e.categoryId);
      audit(d, c, 'a.expense.void', { ref: cat?.name ?? e.number, amount: e.amount, reason: reason.trim() });
    });
  }

  addExpenseCategory(name: string) {
    return this.tx('expenses.create', (d, c) => {
      const n = name.trim();
      if (!n) throw new AppError('common.required');
      const existing = d.expenseCategories.find((x) => x.orgId === c.orgId && x.name.toLowerCase() === n.toLowerCase());
      if (existing) return existing;
      const cat = { id: uid('ecat'), orgId: c.orgId, name: n };
      d.expenseCategories = [...d.expenseCategories, cat];
      audit(d, c, 'a.category.create', { ref: n });
      return cat;
    });
  }

  // ---------- products & inventory ----------
  saveProduct(input: Partial<Product> & { name: string; sku: string; unit: Unit; price: number; cost: number; reorderLevel: number; openingStock?: number }) {
    return this.tx('products.manage', (d, c) => {
      const name = input.name.trim();
      const sku = input.sku.trim().toUpperCase();
      if (!name || !sku) throw new AppError('common.required');
      if (d.products.some((p) => p.orgId === c.orgId && p.sku.toUpperCase() === sku && p.id !== input.id)) throw new AppError('prod.skuTaken');
      if (input.categoryId && !d.categories.some((x) => x.id === input.categoryId && x.orgId === c.orgId)) throw new AppError('err.forbidden');
      const base = {
        name, sku, unit: input.unit, categoryId: input.categoryId || null, price: Math.round(Number(input.price) || 0),
        cost: Math.round(Number(input.cost) || 0), reorderLevel: Number(input.reorderLevel) || 0,
        trackStock: input.trackStock ?? true, active: input.active ?? true, updatedAt: c.now,
      };
      if (input.id) {
        const existing = d.products.find((p) => p.id === input.id && p.orgId === c.orgId);
        if (!existing) throw new AppError('err.forbidden');
        const updated = { ...existing, ...base };
        d.products = d.products.map((p) => (p.id === existing.id ? updated : p));
        audit(d, c, 'a.product.update', { ref: name });
        return updated;
      }
      const product: Product = { id: uid('p'), orgId: c.orgId, createdAt: c.now, ...base };
      d.products = [product, ...d.products];
      const opening = Number(input.openingStock) || 0;
      if (opening > 0 && c.org.inventoryEnabled && product.trackStock) d.movements = [movement(c, product.id, 'OPENING', opening), ...d.movements];
      audit(d, c, 'a.product.create', { ref: name });
      return product;
    });
  }

  addCategory(name: string) {
    return this.tx('products.manage', (d, c) => {
      const n = name.trim();
      if (!n) throw new AppError('common.required');
      const existing = d.categories.find((x) => x.orgId === c.orgId && x.name.toLowerCase() === n.toLowerCase());
      if (existing) return existing;
      const cat = { id: uid('cat'), orgId: c.orgId, name: n };
      d.categories = [...d.categories, cat];
      audit(d, c, 'a.category.create', { ref: n });
      return cat;
    });
  }

  adjustStock(productId: string, delta: number, reason: string, note?: string) {
    return this.tx('inventory.adjust', (d, c) => {
      const p = d.products.find((x) => x.id === productId && x.orgId === c.orgId);
      if (!p) throw new AppError('err.forbidden');
      const q = Number(delta);
      if (!q) throw new AppError('inv.zero');
      if (!reason) throw new AppError('common.reasonRequired');
      const have = stockOf(d, c.orgId).get(productId) ?? 0;
      if (have + q < 0) throw new AppError('inv.negative');
      const full = note?.trim() ? `${reason}: ${note.trim()}` : reason;
      d.movements = [movement(c, productId, 'ADJUSTMENT', q, undefined, full), ...d.movements];
      audit(d, c, 'a.stock.adjust', { ref: p.name, qty: q, reason: full });
    });
  }

  // ---------- contacts ----------
  saveContact(kind: 'customers' | 'suppliers', input: Partial<Contact> & { name: string }) {
    return this.tx(kind === 'customers' ? 'customers.manage' : 'suppliers.manage', (d, c) => {
      const name = input.name.trim();
      if (!name) throw new AppError('common.required');
      const list = d[kind];
      const clean = { name, phone: input.phone?.trim() || undefined, email: input.email?.trim() || undefined, notes: input.notes?.trim() || undefined, updatedAt: c.now };
      const entity = kind === 'customers' ? 'customer' : 'supplier';
      if (input.id) {
        const existing = list.find((x) => x.id === input.id && x.orgId === c.orgId);
        if (!existing) throw new AppError('err.forbidden');
        const updated = { ...existing, ...clean };
        d[kind] = list.map((x) => (x.id === existing.id ? updated : x));
        audit(d, c, `a.${entity}.update`, { ref: name });
        return updated;
      }
      const created: Contact = { id: uid(entity[0]), orgId: c.orgId, createdAt: c.now, ...clean };
      d[kind] = [created, ...list];
      audit(d, c, `a.${entity}.create`, { ref: name });
      return created;
    });
  }

  // ---------- team & settings ----------
  addMember(input: { name: string; email: string; role: Role }) {
    return this.tx('team.manage', (d, c) => {
      const email = input.email.trim().toLowerCase();
      if (!email || !input.name.trim()) throw new AppError('common.required');
      let user = d.users.find((u) => u.email.toLowerCase() === email);
      if (user && d.memberships.some((m) => m.userId === user!.id && m.orgId === c.orgId)) throw new AppError('team.exists');
      if (!user) {
        user = { id: uid('u'), name: input.name.trim(), email, password: DEMO_PASSWORD, createdAt: c.now };
        d.users = [...d.users, user];
      }
      d.memberships = [...d.memberships, { id: uid('m'), userId: user.id, orgId: c.orgId, role: input.role, createdAt: c.now }];
      audit(d, c, 'a.member.add', { ref: user.name, role: input.role });
    });
  }

  changeRole(membershipId: string, role: Role) {
    return this.tx('team.manage', (d, c) => {
      const m = d.memberships.find((x) => x.id === membershipId && x.orgId === c.orgId);
      if (!m) throw new AppError('err.forbidden');
      if (m.role === 'OWNER' && role !== 'OWNER' && d.memberships.filter((x) => x.orgId === c.orgId && x.role === 'OWNER').length === 1) {
        throw new AppError('team.lastOwner');
      }
      d.memberships = d.memberships.map((x) => (x.id === membershipId ? { ...x, role } : x));
      audit(d, c, 'a.member.role', { ref: d.users.find((u) => u.id === m.userId)?.name ?? '', role });
    });
  }

  removeMember(membershipId: string) {
    return this.tx('team.manage', (d, c) => {
      const m = d.memberships.find((x) => x.id === membershipId && x.orgId === c.orgId);
      if (!m) throw new AppError('err.forbidden');
      if (m.userId === c.userId) throw new AppError('team.notSelf');
      if (m.role === 'OWNER' && d.memberships.filter((x) => x.orgId === c.orgId && x.role === 'OWNER').length === 1) throw new AppError('team.lastOwner');
      d.memberships = d.memberships.filter((x) => x.id !== membershipId);
      audit(d, c, 'a.member.remove', { ref: d.users.find((u) => u.id === m.userId)?.name ?? '' });
    });
  }

  updateOrg(patch: Partial<Pick<Org, 'name' | 'businessType' | 'phone' | 'email' | 'region' | 'address' | 'tin' | 'inventoryEnabled'>>) {
    return this.tx('settings.manage', (d, c) => {
      if (patch.name !== undefined && !patch.name.trim()) throw new AppError('common.required');
      d.orgs = d.orgs.map((o) => (o.id === c.orgId ? { ...o, ...patch, name: (patch.name ?? o.name).trim() } : o));
      audit(d, c, 'a.org.update', { ref: patch.name ?? c.org.name });
    });
  }

  // ---------- plumbing ----------
  /** Runs a mutation against a copy and commits only if it completes: the prototype's "database transaction". */
  private tx<R>(perm: Perm, fn: (d: DB, c: Ctx) => R): R {
    const s = this.session();
    const m = this.membership();
    const org = this.org();
    if (!s || !m || !org) throw new AppError('err.session');
    if (!ROLE_PERMS[m.role].has(perm)) throw new AppError('err.forbidden');
    const draft: DB = { ...this.db(), counters: { ...this.db().counters } };
    const result = fn(draft, { orgId: m.orgId, userId: s.userId, now: new Date().toISOString(), org });
    this.save(draft);
    return result;
  }

  private save(d: DB) {
    this.db.set(d);
    safeWrite(DB_KEY, d);
  }

  private setSession(s: Session | null) {
    this.session.set(s);
    safeWrite(SESSION_KEY, s);
  }
}

function stockOf(d: DB, orgId: string) {
  const map = new Map<string, number>();
  for (const m of d.movements) if (m.orgId === orgId) map.set(m.productId, (map.get(m.productId) ?? 0) + m.quantity);
  return map;
}

function nextNumber(d: DB, orgId: string, prefix: string) {
  const k = `${orgId}:${prefix}`;
  d.counters[k] = (d.counters[k] ?? 0) + 1;
  return `${prefix}-${String(d.counters[k]).padStart(5, '0')}`;
}

function movement(c: Ctx, productId: string, type: Movement['type'], quantity: number, sourceId?: string, reason?: string): Movement {
  return { id: uid('mv'), orgId: c.orgId, productId, type, quantity, sourceId, reason, createdAt: c.now, createdBy: c.userId };
}

function audit(d: DB, c: Ctx, action: string, params: Record<string, string | number>) {
  d.audit = [{ id: uid('a'), orgId: c.orgId, actorId: c.userId, action, params, at: c.now }, ...d.audit];
}
