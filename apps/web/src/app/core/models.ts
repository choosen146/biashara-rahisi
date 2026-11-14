// Prototype domain model. Mirrors the Prisma schema closely so the UI can later swap to the real API.
// Money is integer shillings (TZS minor-unit handling is a backend concern); quantities may be fractional.

export type Role = 'OWNER' | 'MANAGER' | 'CASHIER' | 'INVENTORY' | 'EMPLOYEE';
export type PaymentMethod = 'CASH' | 'MOBILE' | 'BANK' | 'CARD';
export type MovementType = 'OPENING' | 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'VOID';
export type BusinessType = 'retail' | 'wholesale' | 'hospitality' | 'services' | 'personal' | 'other';
export type Unit = 'piece' | 'kg' | 'litre' | 'pack' | 'box' | 'tray' | 'bottle' | 'bag' | 'metre';

export interface Org {
  id: string; name: string; slug: string; currency: 'TZS'; businessType: BusinessType;
  phone?: string; email?: string; region?: string; address?: string; tin?: string;
  inventoryEnabled: boolean; createdAt: string;
}
/** Prototype only: the real API stores an argon2 hash, never a password. */
export interface User { id: string; name: string; email: string; password: string; phone?: string; createdAt: string }
export interface Membership { id: string; userId: string; orgId: string; role: Role; createdAt: string }

export interface Category { id: string; orgId: string; name: string }
export interface ExpenseCategory { id: string; orgId: string; name: string }

export interface Product {
  id: string; orgId: string; sku: string; name: string; categoryId: string | null; unit: Unit;
  price: number; cost: number; reorderLevel: number; trackStock: boolean; active: boolean;
  createdAt: string; updatedAt: string;
}
export interface Contact {
  id: string; orgId: string; name: string; phone?: string; email?: string; notes?: string;
  createdAt: string; updatedAt: string;
}

export interface SaleLine { productId: string; quantity: number; unitPrice: number }
export interface PurchaseLine { productId: string; quantity: number; unitCost: number }
export interface Payment { id: string; amount: number; method: PaymentMethod; at: string; by: string }

export interface Sale {
  id: string; orgId: string; number: string; key: string; customerId: string | null; lines: SaleLine[];
  total: number; payments: Payment[]; status: 'COMPLETED' | 'VOIDED'; voidReason?: string;
  createdAt: string; createdBy: string;
}
export interface Purchase {
  id: string; orgId: string; number: string; key: string; supplierId: string | null; lines: PurchaseLine[];
  total: number; paid: boolean; status: 'COMPLETED' | 'VOIDED'; voidReason?: string;
  createdAt: string; createdBy: string;
}
export interface Expense {
  id: string; orgId: string; number: string; key: string; categoryId: string; amount: number; method: PaymentMethod;
  note?: string; date: string; status: 'POSTED' | 'VOIDED'; voidReason?: string; createdAt: string; createdBy: string;
}
export interface Movement {
  id: string; orgId: string; productId: string; type: MovementType; quantity: number;
  reason?: string; sourceId?: string; createdAt: string; createdBy: string;
}
export interface AuditEvent {
  id: string; orgId: string; actorId: string; action: string; params: Record<string, string | number>; at: string;
}

export interface DB {
  version: 1;
  orgs: Org[]; users: User[]; memberships: Membership[];
  categories: Category[]; expenseCategories: ExpenseCategory[];
  products: Product[]; customers: Contact[]; suppliers: Contact[];
  sales: Sale[]; purchases: Purchase[]; expenses: Expense[]; movements: Movement[];
  audit: AuditEvent[]; counters: Record<string, number>;
}

export const UNITS: Unit[] = ['piece', 'kg', 'litre', 'pack', 'box', 'tray', 'bottle', 'bag', 'metre'];
export const METHODS: PaymentMethod[] = ['CASH', 'MOBILE', 'BANK', 'CARD'];
export const ROLES: Role[] = ['OWNER', 'MANAGER', 'CASHIER', 'INVENTORY', 'EMPLOYEE'];
export const BUSINESS_TYPES: BusinessType[] = ['retail', 'wholesale', 'hospitality', 'services', 'personal', 'other'];

export type Perm =
  | 'dashboard.finance' | 'sales.view' | 'sales.create' | 'sales.void' | 'payments.record'
  | 'purchases.view' | 'purchases.create' | 'purchases.void'
  | 'products.view' | 'products.manage' | 'inventory.view' | 'inventory.adjust'
  | 'customers.view' | 'customers.manage' | 'suppliers.view' | 'suppliers.manage'
  | 'expenses.view' | 'expenses.create' | 'expenses.void'
  | 'reports.view' | 'team.view' | 'team.manage' | 'audit.view' | 'settings.manage';

const ALL: Perm[] = [
  'dashboard.finance', 'sales.view', 'sales.create', 'sales.void', 'payments.record',
  'purchases.view', 'purchases.create', 'purchases.void', 'products.view', 'products.manage',
  'inventory.view', 'inventory.adjust', 'customers.view', 'customers.manage', 'suppliers.view', 'suppliers.manage',
  'expenses.view', 'expenses.create', 'expenses.void', 'reports.view', 'team.view', 'team.manage', 'audit.view', 'settings.manage',
];

/** Draft role-permission matrix (SRS §14 lists the final matrix as an open decision). */
export const ROLE_PERMS: Record<Role, ReadonlySet<Perm>> = {
  OWNER: new Set(ALL),
  MANAGER: new Set(ALL.filter((p) => p !== 'team.manage' && p !== 'settings.manage')),
  CASHIER: new Set<Perm>(['sales.view', 'sales.create', 'payments.record', 'products.view', 'inventory.view', 'customers.view', 'customers.manage']),
  INVENTORY: new Set<Perm>(['sales.view', 'products.view', 'products.manage', 'inventory.view', 'inventory.adjust',
    'purchases.view', 'purchases.create', 'suppliers.view', 'suppliers.manage']),
  EMPLOYEE: new Set<Perm>(['sales.view', 'products.view', 'customers.view']),
};
