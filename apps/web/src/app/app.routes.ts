import { Routes } from '@angular/router';
import { authGuard, guestGuard, permGuard } from './core/auth.service';
import { AuditComponent } from './features/audit/audit.component';
import { LoginComponent } from './features/auth/login.component';
import { ContactsComponent } from './features/contacts/contacts.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ExpensesComponent } from './features/expenses/expenses.component';
import { ForbiddenComponent } from './features/forbidden.component';
import { InventoryComponent } from './features/inventory/inventory.component';
import { ProductsComponent } from './features/products/products.component';
import { PurchasesComponent } from './features/purchases/purchases.component';
import { ReportsComponent } from './features/reports/reports.component';
import { SalesComponent } from './features/sales/sales.component';
import { SettingsComponent } from './features/settings/settings.component';
import { TeamComponent } from './features/team/team.component';
import { ShellComponent } from './layout/shell.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard], title: 'Sign in · TBMS' },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    canActivateChild: [permGuard],
    children: [
      { path: '', component: DashboardComponent, title: 'Overview · TBMS' },
      { path: 'sales', component: SalesComponent, data: { perm: 'sales.view' }, title: 'Sales · TBMS' },
      { path: 'purchases', component: PurchasesComponent, data: { perm: 'purchases.view' }, title: 'Purchases · TBMS' },
      { path: 'expenses', component: ExpensesComponent, data: { perm: 'expenses.view' }, title: 'Expenses · TBMS' },
      { path: 'products', component: ProductsComponent, data: { perm: 'products.view' }, title: 'Products · TBMS' },
      { path: 'inventory', component: InventoryComponent, data: { perm: 'inventory.view' }, title: 'Inventory · TBMS' },
      { path: 'customers', component: ContactsComponent, data: { perm: 'customers.view', kind: 'customers' }, title: 'Customers · TBMS' },
      { path: 'suppliers', component: ContactsComponent, data: { perm: 'suppliers.view', kind: 'suppliers' }, title: 'Suppliers · TBMS' },
      { path: 'reports', component: ReportsComponent, data: { perm: 'reports.view' }, title: 'Reports · TBMS' },
      { path: 'audit', component: AuditComponent, data: { perm: 'audit.view' }, title: 'Audit log · TBMS' },
      { path: 'team', component: TeamComponent, data: { perm: 'team.view' }, title: 'Team · TBMS' },
      { path: 'settings', component: SettingsComponent, data: { perm: 'team.view' }, title: 'Settings · TBMS' },
      { path: 'forbidden', component: ForbiddenComponent, title: 'No access · TBMS' },
    ],
  },
  { path: '**', redirectTo: '' },
];
