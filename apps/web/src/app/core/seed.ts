import { BusinessType, Contact, DB, Movement, PaymentMethod, Product, Unit } from './models';

/** Deterministic PRNG so every fresh prototype looks the same. */
function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(arr: readonly T[]) => arr[Math.floor(next() * arr.length)],
    chance: (p: number) => next() < p,
  };
}

let idCounter = 0;
// Short ids keep localStorage small; the per-load tag avoids clashes with ids saved in earlier sessions.
const LOAD_TAG = Date.now().toString(36).slice(-6);
export const uid = (prefix: string) => `${prefix}${LOAD_TAG}${(idCounter++).toString(36)}`;

const EAT = 3 * 3600e3;
/** A Date for `daysAgo` days before now at the given EAT hour/minute. */
function at(now: number, daysAgo: number, hour: number, minute: number): Date {
  const local = new Date(now + EAT);
  const d = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - daysAgo, hour, minute) - EAT;
  return new Date(d);
}

interface ProductSeed { sku: string; name: string; cat: string; unit: Unit; price: number; cost: number; reorder: number; weight: number }
interface OrgSeed {
  id: string; name: string; slug: string; type: BusinessType; region: string; address: string; phone: string; tin: string;
  days: number; salesPerDay: [number, number]; categories: string[]; products: ProductSeed[];
  customers: string[]; suppliers: string[]; expenses: { cat: string; amount: [number, number]; every: 'month' | 'week' | 'few'; day?: number }[];
  members: { userId: string; role: 'OWNER' | 'MANAGER' | 'CASHIER' | 'INVENTORY' | 'EMPLOYEE' }[];
  costRatio: number;
  seed: number;
}

const USERS = [
  { id: 'u_admin', name: 'TBMS Admin', email: 'admin@demo.tz', phone: '+255 700 000 000' },
  { id: 'u_amina', name: 'Amina Mushi', email: 'amina@demo.tz', phone: '+255 754 100 201' },
  { id: 'u_juma', name: 'Juma Kassim', email: 'juma@demo.tz', phone: '+255 713 220 410' },
  { id: 'u_rehema', name: 'Rehema Said', email: 'rehema@demo.tz', phone: '+255 685 310 552' },
  { id: 'u_baraka', name: 'Baraka Mwita', email: 'baraka@demo.tz', phone: '+255 767 418 093' },
  { id: 'u_neema', name: 'Neema Lyimo', email: 'neema@demo.tz', phone: '+255 744 902 117' },
  { id: 'u_hassan', name: 'Hassan Ally', email: 'hassan@demo.tz', phone: '+255 719 553 820' },
];
export const DEMO_PASSWORD = 'demo1234';

const ORGS: OrgSeed[] = [
  {
    id: 'org_duka', name: 'Duka la Amina', slug: 'duka-la-amina', type: 'retail', region: 'Morogoro',
    address: 'Mtaa wa Boma, Morogoro Mjini', phone: '+255 754 100 201', tin: '123-456-789',
    days: 168, salesPerDay: [4, 8], seed: 42, costRatio: 0.74,
    categories: ['Food', 'Drinks', 'Household', 'Personal care'],
    products: [
      { sku: 'SUK-1', name: 'Sukari 1kg', cat: 'Food', unit: 'kg', price: 3200, cost: 2750, reorder: 20, weight: 9 },
      { sku: 'MCH-1', name: 'Mchele 1kg', cat: 'Food', unit: 'kg', price: 2800, cost: 2300, reorder: 25, weight: 9 },
      { sku: 'UNG-2', name: 'Unga wa sembe 2kg', cat: 'Food', unit: 'pack', price: 4000, cost: 3350, reorder: 15, weight: 8 },
      { sku: 'MAF-1', name: 'Mafuta ya kupikia 1L', cat: 'Food', unit: 'bottle', price: 6500, cost: 5600, reorder: 10, weight: 6 },
      { sku: 'MAH-1', name: 'Maharage 1kg', cat: 'Food', unit: 'kg', price: 3500, cost: 2900, reorder: 12, weight: 5 },
      { sku: 'CHU-1', name: 'Chumvi 1kg', cat: 'Food', unit: 'pack', price: 1000, cost: 700, reorder: 10, weight: 4 },
      { sku: 'CHA-100', name: 'Majani ya chai 100g', cat: 'Food', unit: 'pack', price: 1500, cost: 1100, reorder: 10, weight: 4 },
      { sku: 'MAY-30', name: 'Mayai (trei 30)', cat: 'Food', unit: 'tray', price: 12000, cost: 10200, reorder: 4, weight: 3 },
      { sku: 'MKT-1', name: 'Mkate', cat: 'Food', unit: 'piece', price: 2000, cost: 1600, reorder: 8, weight: 6 },
      { sku: 'MAJ-15', name: 'Maji 1.5L', cat: 'Drinks', unit: 'bottle', price: 1000, cost: 650, reorder: 24, weight: 8 },
      { sku: 'SOD-500', name: 'Soda 500ml', cat: 'Drinks', unit: 'bottle', price: 1000, cost: 750, reorder: 24, weight: 7 },
      { sku: 'MAZ-500', name: 'Maziwa 500ml', cat: 'Drinks', unit: 'pack', price: 1500, cost: 1150, reorder: 12, weight: 5 },
      { sku: 'SAB-800', name: 'Sabuni ya unga 800g', cat: 'Household', unit: 'pack', price: 4500, cost: 3800, reorder: 8, weight: 4 },
      { sku: 'SAB-MCH', name: 'Sabuni ya mche', cat: 'Household', unit: 'piece', price: 1200, cost: 900, reorder: 12, weight: 4 },
      { sku: 'KIB-10', name: 'Kiberiti (pakiti 10)', cat: 'Household', unit: 'pack', price: 1000, cost: 700, reorder: 6, weight: 2 },
      { sku: 'MSH-1', name: 'Mshumaa', cat: 'Household', unit: 'piece', price: 500, cost: 300, reorder: 10, weight: 2 },
      { sku: 'DAW-MN', name: 'Dawa ya meno', cat: 'Personal care', unit: 'piece', price: 2500, cost: 1900, reorder: 6, weight: 2 },
      { sku: 'LOT-200', name: 'Mafuta ya kujipaka 200ml', cat: 'Personal care', unit: 'bottle', price: 3500, cost: 2700, reorder: 5, weight: 1 },
    ],
    customers: ['Juma Hassan', 'Neema Stores', 'Mama Zawadi', 'Hoteli ya Upendo', 'Shule ya Msingi Kilakala', 'Baraka Mwakyusa', 'Fatuma Omari', 'Mgahawa wa Furaha'],
    suppliers: ['Uhuru Wholesalers', 'Morogoro Distributors', 'Pwani Beverages', 'Kilimo Bora Traders'],
    expenses: [
      { cat: 'Rent', amount: [350000, 350000], every: 'month', day: 1 },
      { cat: 'Electricity', amount: [60000, 95000], every: 'month', day: 6 },
      { cat: 'Salaries', amount: [500000, 500000], every: 'month', day: 28 },
      { cat: 'Transport', amount: [15000, 45000], every: 'week' },
      { cat: 'Airtime & internet', amount: [10000, 25000], every: 'month', day: 3 },
      { cat: 'Levies & licences', amount: [30000, 30000], every: 'month', day: 15 },
      { cat: 'Other', amount: [5000, 30000], every: 'few' },
    ],
    members: [
      { userId: 'u_amina', role: 'OWNER' }, { userId: 'u_admin', role: 'OWNER' }, { userId: 'u_juma', role: 'MANAGER' },
      { userId: 'u_rehema', role: 'CASHIER' }, { userId: 'u_baraka', role: 'INVENTORY' },
    ],
  },
  {
    id: 'org_hardware', name: 'Neema Hardware', slug: 'neema-hardware', type: 'wholesale', region: 'Dar es Salaam',
    address: 'Barabara ya Mandela, Tabata', phone: '+255 744 902 117', tin: '987-654-321',
    days: 160, salesPerDay: [2, 5], seed: 7, costRatio: 0.76,
    categories: ['Building', 'Plumbing', 'Electrical', 'Paint'],
    products: [
      { sku: 'SAR-50', name: 'Saruji 50kg', cat: 'Building', unit: 'bag', price: 18000, cost: 15500, reorder: 40, weight: 9 },
      { sku: 'BAT-30', name: 'Bati geji 30', cat: 'Building', unit: 'piece', price: 32000, cost: 27500, reorder: 20, weight: 6 },
      { sku: 'MSU-1', name: 'Misumari 1kg', cat: 'Building', unit: 'kg', price: 5000, cost: 3900, reorder: 25, weight: 7 },
      { sku: 'NON-12', name: 'Nondo 12mm', cat: 'Building', unit: 'piece', price: 24000, cost: 20500, reorder: 30, weight: 5 },
      { sku: 'PVC-1', name: 'Bomba PVC inchi 1', cat: 'Plumbing', unit: 'piece', price: 12000, cost: 9500, reorder: 15, weight: 4 },
      { sku: 'TAP-1', name: 'Koki ya maji', cat: 'Plumbing', unit: 'piece', price: 8500, cost: 6200, reorder: 10, weight: 3 },
      { sku: 'WAY-25', name: 'Waya wa umeme 2.5mm (roli)', cat: 'Electrical', unit: 'box', price: 85000, cost: 72000, reorder: 5, weight: 3 },
      { sku: 'SWI-1', name: 'Swichi ya umeme', cat: 'Electrical', unit: 'piece', price: 3500, cost: 2400, reorder: 20, weight: 4 },
      { sku: 'RAN-4', name: 'Rangi ya maji 4L', cat: 'Paint', unit: 'bottle', price: 28000, cost: 23000, reorder: 10, weight: 4 },
      { sku: 'BRA-3', name: 'Brashi ya rangi inchi 3', cat: 'Paint', unit: 'piece', price: 4000, cost: 2800, reorder: 10, weight: 3 },
    ],
    customers: ['Mjenzi Bora Ltd', 'Fundi Salum', 'Kanisa la Tabata', 'Ally Construction', 'Mama Grace'],
    suppliers: ['Dar Steel Supplies', 'Pwani Cement Agents', 'Kariakoo Electricals'],
    expenses: [
      { cat: 'Rent', amount: [900000, 900000], every: 'month', day: 1 },
      { cat: 'Electricity', amount: [80000, 120000], every: 'month', day: 6 },
      { cat: 'Salaries', amount: [1200000, 1200000], every: 'month', day: 28 },
      { cat: 'Transport', amount: [40000, 120000], every: 'week' },
      { cat: 'Levies & licences', amount: [50000, 50000], every: 'month', day: 15 },
    ],
    members: [{ userId: 'u_neema', role: 'OWNER' }, { userId: 'u_admin', role: 'OWNER' }, { userId: 'u_juma', role: 'MANAGER' }, { userId: 'u_hassan', role: 'CASHIER' }],
  },
];

export const DEFAULT_CATEGORIES = ['General'];
export const DEFAULT_EXPENSE_CATEGORIES = ['Rent', 'Electricity', 'Water', 'Salaries', 'Transport', 'Airtime & internet', 'Levies & licences', 'Other'];

export function createSeed(now = Date.now()): DB {
  const db: DB = {
    version: 1, orgs: [], users: [], memberships: [], categories: [], expenseCategories: [],
    products: [], customers: [], suppliers: [], sales: [], purchases: [], expenses: [], movements: [], audit: [], counters: {},
  };
  const created = new Date(now - 200 * 86400e3).toISOString();
  for (const u of USERS) db.users.push({ ...u, password: DEMO_PASSWORD, createdAt: created });

  for (const o of ORGS) seedOrg(db, o, now);

  // newest first everywhere, like the API would return
  const desc = (a: { createdAt?: string; at?: string }, b: { createdAt?: string; at?: string }) =>
    (b.createdAt ?? b.at ?? '').localeCompare(a.createdAt ?? a.at ?? '');
  db.sales.sort(desc); db.purchases.sort(desc); db.expenses.sort(desc); db.movements.sort(desc); db.audit.sort(desc);
  // Keep the generated audit trail to the last 60 days so the prototype fits comfortably in localStorage.
  const auditFrom = new Date(now - 60 * 86400e3).toISOString();
  db.audit = db.audit.filter((e) => e.at >= auditFrom || e.action === 'a.org.create');
  return db;
}

function seedOrg(db: DB, o: OrgSeed, now: number) {
  const r = rng(o.seed);
  const startIso = at(now, o.days + 1, 7, 30).toISOString();
  const owner = o.members[0].userId;
  db.orgs.push({
    id: o.id, name: o.name, slug: o.slug, currency: 'TZS', businessType: o.type, region: o.region,
    address: o.address, phone: o.phone, email: `info@${o.slug}.demo.tz`, tin: o.tin, inventoryEnabled: true, createdAt: startIso,
  });
  o.members.forEach((m, i) => db.memberships.push({ id: `m_${o.id}_${i}`, orgId: o.id, userId: m.userId, role: m.role, createdAt: startIso }));
  db.audit.push({ id: uid('a'), orgId: o.id, actorId: owner, action: 'a.org.create', params: { ref: o.name }, at: startIso });

  const catIds = new Map<string, string>();
  o.categories.forEach((c, i) => { const id = `cat_${o.id}_${i}`; catIds.set(c, id); db.categories.push({ id, orgId: o.id, name: c }); });
  const expCatIds = new Map<string, string>();
  [...new Set([...DEFAULT_EXPENSE_CATEGORIES, ...o.expenses.map((e) => e.cat)])].forEach((c, i) => {
    const id = `ecat_${o.id}_${i}`; expCatIds.set(c, id); db.expenseCategories.push({ id, orgId: o.id, name: c });
  });

  const products: Product[] = o.products.map((p, i) => ({
    id: `p_${o.id}_${i}`, orgId: o.id, sku: p.sku, name: p.name, categoryId: catIds.get(p.cat) ?? null, unit: p.unit,
    price: p.price, cost: Math.round((p.price * o.costRatio) / 50) * 50, reorderLevel: p.reorder * 2, trackStock: true, active: true, createdAt: startIso, updatedAt: startIso,
  }));
  db.products.push(...products);
  const contact = (name: string, i: number, kind: string): Contact => ({
    id: `${kind}_${o.id}_${i}`, orgId: o.id, name, phone: `+255 7${r.int(10, 89)} ${r.int(100, 999)} ${r.int(100, 999)}`,
    createdAt: startIso, updatedAt: startIso,
  });
  const customers = o.customers.map((n, i) => contact(n, i, 'c'));
  const suppliers = o.suppliers.map((n, i) => contact(n, i, 's'));
  db.customers.push(...customers);
  db.suppliers.push(...suppliers);

  const stock = new Map<string, number>();
  const counter = (k: string) => (db.counters[`${o.id}:${k}`] = (db.counters[`${o.id}:${k}`] ?? 0) + 1);
  const num = (k: string) => `${k}-${String(counter(k)).padStart(5, '0')}`;
  const sellers = o.members.filter((m) => m.role !== 'INVENTORY' && m.userId !== 'u_admin').map((m) => m.userId);
  const stockKeeper = o.members.find((m) => m.role === 'INVENTORY')?.userId ?? owner;
  const mv = (productId: string, type: Movement['type'], quantity: number, createdAt: string, by: string, sourceId?: string, reason?: string) =>
    db.movements.push({ id: uid('mv'), orgId: o.id, productId, type, quantity, sourceId, reason, createdAt, createdBy: by });

  // Opening stock
  for (const p of products) {
    const q = p.reorderLevel * r.int(4, 7);
    stock.set(p.id, q);
    mv(p.id, 'OPENING', q, startIso, owner);
  }

  const weights = o.products.map((p) => p.weight);
  const totalW = weights.reduce((a, b) => a + b, 0);
  const pickProduct = () => {
    let x = r.next() * totalW;
    for (let i = 0; i < products.length; i++) { x -= weights[i]; if (x <= 0) return products[i]; }
    return products[products.length - 1];
  };
  const methods: PaymentMethod[] = ['CASH', 'CASH', 'CASH', 'MOBILE', 'MOBILE', 'BANK'];

  for (let d = o.days; d >= 0; d--) {
    const growth = 1 + (o.days - d) / o.days * 0.6; // business grows ~60% over the period
    const localNow = new Date(now + EAT);
    const dayDate = at(now, d, 12, 0);
    const dom = new Date(dayDate.getTime() + EAT).getUTCDate();
    const dow = new Date(dayDate.getTime() + EAT).getUTCDay();
    const maxHour = d === 0 ? Math.max(8, localNow.getUTCHours() - 1) : 20;

    // Restock on Mondays (and when anything is critically low)
    if (dow === 1 || dow === 4 || [...stock.values()].some((q) => q <= 0)) {
      const lines = products
        .filter((p) => (stock.get(p.id) ?? 0) < p.reorderLevel * 3)
        .map((p) => ({ productId: p.id, quantity: p.reorderLevel * r.int(3, 5), unitCost: p.cost }));
      if (lines.length && d > 2) {
        const createdAt = at(now, d, 8, r.int(0, 50)).toISOString();
        const total = lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);
        const id = uid('pur');
        const number = num('P');
        db.purchases.push({ id, orgId: o.id, number, key: id, supplierId: r.pick(suppliers).id, lines, total,
          paid: d > 14 || r.chance(0.5), status: 'COMPLETED', createdAt, createdBy: stockKeeper });
        for (const l of lines) { stock.set(l.productId, (stock.get(l.productId) ?? 0) + l.quantity); mv(l.productId, 'PURCHASE', l.quantity, createdAt, stockKeeper, id); }
        db.audit.push({ id: uid('a'), orgId: o.id, actorId: stockKeeper, action: 'a.purchase.create', params: { ref: number, amount: total }, at: createdAt });
      }
    }

    // Sales
    const n = Math.round(r.int(o.salesPerDay[0], o.salesPerDay[1]) * growth);
    const times = Array.from({ length: n }, () => [r.int(8, maxHour), r.int(0, 59)] as const).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    for (const [h, m] of times) {
      const createdAtDate = at(now, d, h, m);
      if (createdAtDate.getTime() > now) continue;
      const createdAt = createdAtDate.toISOString();
      const lineCount = r.int(1, 4);
      const lines: { productId: string; quantity: number; unitPrice: number }[] = [];
      for (let i = 0; i < lineCount; i++) {
        const p = pickProduct();
        if (lines.some((l) => l.productId === p.id)) continue;
        const qty = p.price > 20000 ? r.int(1, 3) : r.int(1, 6);
        if ((stock.get(p.id) ?? 0) < qty) continue;
        lines.push({ productId: p.id, quantity: qty, unitPrice: p.price });
      }
      if (!lines.length) continue;
      const total = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
      const by = r.pick(sellers);
      const roll = r.next();
      const credit = roll < 0.14;
      const customer = credit || r.chance(0.3) ? r.pick(customers) : null;
      const payments = [] as { id: string; amount: number; method: PaymentMethod; at: string; by: string }[];
      if (!credit) payments.push({ id: uid('pay'), amount: total, method: r.pick(methods), at: createdAt, by });
      else {
        const upfront = r.chance(0.5) ? Math.round((total * r.int(20, 60)) / 100 / 500) * 500 : 0;
        if (upfront > 0) payments.push({ id: uid('pay'), amount: upfront, method: 'CASH', at: createdAt, by });
        // older credit sales mostly settled later
        if (d > 10 && r.chance(0.8)) {
          const later = at(now, Math.max(0, d - r.int(3, 10)), r.int(9, 17), r.int(0, 59));
          if (later.getTime() < now) payments.push({ id: uid('pay'), amount: total - upfront, method: r.pick(methods), at: later.toISOString(), by });
        }
      }
      const id = uid('sale');
      const number = num('S');
      db.sales.push({ id, orgId: o.id, number, key: id, customerId: customer?.id ?? null, lines, total, payments, status: 'COMPLETED', createdAt, createdBy: by });
      for (const l of lines) { stock.set(l.productId, (stock.get(l.productId) ?? 0) - l.quantity); mv(l.productId, 'SALE', -l.quantity, createdAt, by, id); }
      db.audit.push({ id: uid('a'), orgId: o.id, actorId: by, action: 'a.sale.create', params: { ref: number, amount: total }, at: createdAt });
    }

    // Expenses
    for (const e of o.expenses) {
      const due = e.every === 'month' ? dom === e.day : e.every === 'week' ? dow === 3 : r.chance(0.12);
      if (!due) continue;
      const createdAtDate = at(now, d, r.int(9, 17), r.int(0, 59));
      if (createdAtDate.getTime() > now) continue;
      const createdAt = createdAtDate.toISOString();
      const amount = Math.round(r.int(e.amount[0], e.amount[1]) / 500) * 500;
      const id = uid('exp');
      const number = num('E');
      db.expenses.push({ id, orgId: o.id, number, key: id, categoryId: expCatIds.get(e.cat)!, amount,
        method: e.cat === 'Salaries' || e.cat === 'Rent' ? 'BANK' : r.pick(methods), date: createdAt, status: 'POSTED', createdAt, createdBy: owner,
        note: e.cat === 'Transport' ? 'Usafiri wa mzigo' : undefined });
      db.audit.push({ id: uid('a'), orgId: o.id, actorId: owner, action: 'a.expense.create', params: { ref: e.cat, amount }, at: createdAt });
    }
  }

  // Leave a couple of items low so the dashboard has something to flag
  const low = products.slice(3, 5);
  for (const p of low) {
    const q = stock.get(p.id) ?? 0;
    const target = Math.max(1, Math.floor(p.reorderLevel / 2));
    if (q > target) {
      const at1 = at(now, 1, 18, 10).toISOString();
      mv(p.id, 'ADJUSTMENT', target - q, at1, stockKeeper, undefined, 'count');
      db.audit.push({ id: uid('a'), orgId: o.id, actorId: stockKeeper, action: 'a.stock.adjust', params: { ref: p.name, qty: target - q, reason: 'count' }, at: at1 });
    }
  }
}
