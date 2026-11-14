import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Perm, ROLES, ROLE_PERMS, Role } from '../../core/models';
import { Store } from '../../core/store';
import { Ui } from '../../core/ui';
import { IconComponent } from '../../shared/icon.component';
import { ModalComponent } from '../../shared/modal.component';

const MATRIX: { label: string; perm: Perm }[] = [
  { label: 'perm.sales', perm: 'sales.create' }, { label: 'perm.payments', perm: 'payments.record' },
  { label: 'perm.void', perm: 'sales.void' }, { label: 'perm.purchases', perm: 'purchases.create' },
  { label: 'perm.products', perm: 'products.manage' }, { label: 'perm.inventory', perm: 'inventory.adjust' },
  { label: 'perm.customers', perm: 'customers.manage' }, { label: 'perm.suppliers', perm: 'suppliers.manage' },
  { label: 'perm.expenses', perm: 'expenses.create' }, { label: 'perm.reports', perm: 'reports.view' },
  { label: 'perm.audit', perm: 'audit.view' }, { label: 'perm.team', perm: 'team.manage' }, { label: 'perm.settings', perm: 'settings.manage' },
];

@Component({
  selector: 'tbms-team',
  standalone: true,
  imports: [FormsModule, IconComponent, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div><h1>{{ ui.t('team.title') }}</h1><p>{{ ui.t('team.subtitle') }}</p></div>
      @if (store.can('team.manage')) {
        <div class="head-actions"><button type="button" class="btn primary" (click)="openForm()"><tbms-icon name="userPlus" [size]="18" />{{ ui.t('team.invite') }}</button></div>
      }
    </header>

    <section class="card table-card">
      <table class="table">
        <thead><tr><th>{{ ui.t('common.name') }}</th><th>{{ ui.t('team.role') }}</th><th>{{ ui.t('team.since') }}</th><th></th></tr></thead>
        <tbody>
          @for (m of store.members(); track m.id) {
            <tr>
              <td class="lead">
                <span class="person"><span class="av">{{ initials(m.user.name) }}</span>
                  <span><span class="strong">{{ m.user.name }}</span>@if (m.userId === store.user()?.id) { <span class="badge brand you">{{ ui.t('team.you') }}</span> }<span class="sub">{{ m.user.email }}</span></span></span>
              </td>
              <td [attr.data-label]="ui.t('team.role')">
                @if (store.can('team.manage') && m.userId !== store.user()?.id) {
                  <select class="role-sel" [ngModel]="m.role" (ngModelChange)="changeRole(m.id, $event)" [attr.aria-label]="ui.t('team.role')">
                    @for (r of roles; track r) { <option [value]="r">{{ ui.t('role.' + r) }}</option> }
                  </select>
                } @else { <span class="badge">{{ ui.t('role.' + m.role) }}</span> }
              </td>
              <td [attr.data-label]="ui.t('team.since')" class="muted">{{ ui.date(m.createdAt) }}</td>
              <td class="num">
                @if (store.can('team.manage') && m.userId !== store.user()?.id) {
                  <button type="button" class="btn ghost-btn sm" (click)="removeTarget.set({ id: m.id, name: m.user.name })">{{ ui.t('team.remove') }}</button>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </section>

    <section class="card table-card mt">
      <div class="panel-head pad"><div><h2>{{ ui.t('team.matrix') }}</h2></div></div>
      <div class="matrix-wrap">
        <table class="matrix">
          <thead><tr><th></th>@for (r of roles; track r) { <th [class.mine]="r === store.role()">{{ ui.t('role.' + r) }}</th> }</tr></thead>
          <tbody>
            @for (row of matrix; track row.perm) {
              <tr><th scope="row">{{ ui.t(row.label) }}</th>
                @for (r of roles; track r) {
                  <td [class.mine]="r === store.role()">@if (has(r, row.perm)) { <tbms-icon name="check" [size]="16" [stroke]="2.6" class="yes" /><span class="sr">✓</span> } @else { <span class="no">—</span> }</td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>

    <tbms-modal [open]="formOpen()" [title]="ui.t('team.invite')" [subtitle]="ui.t('team.inviteHint')" (closed)="formOpen.set(false)">
      <form class="form" id="teamForm" (ngSubmit)="save()">
        <label class="field">{{ ui.t('common.name') }}<input [(ngModel)]="name" name="name" required /></label>
        <label class="field">{{ ui.t('common.email') }}<input type="email" [(ngModel)]="email" name="email" required /></label>
        <label class="field">{{ ui.t('team.role') }}
          <select [(ngModel)]="role" name="role">@for (r of roles; track r) { <option [value]="r">{{ ui.t('role.' + r) }}</option> }</select>
        </label>
        @if (error()) { <div class="form-error" role="alert"><tbms-icon name="alert" [size]="16" />{{ error() }}</div> }
      </form>
      <div footer>
        <button type="button" class="btn secondary" (click)="formOpen.set(false)">{{ ui.t('common.cancel') }}</button>
        <button type="submit" form="teamForm" class="btn primary">{{ ui.t('team.invite') }}</button>
      </div>
    </tbms-modal>

    <tbms-modal [open]="!!removeTarget()" [title]="ui.t('team.remove')" (closed)="removeTarget.set(null)">
      <p class="confirm">{{ ui.t('team.removeConfirm', { name: removeTarget()?.name ?? '' }) }}</p>
      <div footer>
        <button type="button" class="btn secondary" (click)="removeTarget.set(null)">{{ ui.t('common.cancel') }}</button>
        <button type="button" class="btn danger" (click)="remove()">{{ ui.t('team.remove') }}</button>
      </div>
    </tbms-modal>
  `,
  styles: [`
    .person { display: flex; align-items: center; gap: 12px; }
    .av { width: 36px; height: 36px; border-radius: 50%; background: var(--brand-soft); color: var(--brand-strong); display: grid; place-items: center; font-weight: 700; font-size: 13px; flex: none; }
    .you { margin-left: 8px; }
    .role-sel { width: auto; padding: 7px 32px 7px 10px; font-size: 13.5px; }
    .muted { color: var(--text-3); }
    .pad { padding: 18px 20px 4px; }
    .matrix-wrap { overflow-x: auto; padding: 0 8px 12px; }
    .matrix { width: 100%; border-collapse: collapse; font-size: 13.5px; min-width: 620px;
      th, td { padding: 9px 10px; text-align: center; border-bottom: 1px solid var(--border); }
      thead th { font-size: 12px; font-weight: 600; color: var(--text-2); }
      tbody th { text-align: left; font-weight: 500; color: var(--text-1); }
      .mine { background: var(--brand-soft); }
      tr:last-child th, tr:last-child td { border-bottom: 0; } }
    .yes { color: var(--good-fg); } .no { color: var(--text-3); }
    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    .confirm { margin: 0; font-size: 14.5px; }
  `],
})
export class TeamComponent {
  readonly ui = inject(Ui);
  readonly store = inject(Store);
  readonly roles = ROLES;
  readonly matrix = MATRIX;
  has(r: Role, p: Perm) { return ROLE_PERMS[r].has(p); }
  initials(n: string) { return n.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join(''); }

  changeRole(id: string, role: Role) {
    // On refusal, re-emit the data so the select snaps back to the stored role.
    if (!this.ui.run(() => this.store.changeRole(id, role), 'team.roleChanged')) this.store.db.set({ ...this.store.db() });
  }

  readonly removeTarget = signal<{ id: string; name: string } | null>(null);
  remove() {
    const t = this.removeTarget();
    if (t && this.ui.run(() => this.store.removeMember(t.id), 'team.removed')) this.removeTarget.set(null);
  }

  readonly formOpen = signal(false);
  readonly error = signal<string | null>(null);
  name = ''; email = ''; role: Role = 'CASHIER';
  openForm() { this.name = ''; this.email = ''; this.role = 'CASHIER'; this.error.set(null); this.formOpen.set(true); }
  save() {
    const r = this.ui.attempt(() => this.store.addMember({ name: this.name, email: this.email, role: this.role }));
    if (!r.ok) { this.error.set(r.error); return; }
    this.formOpen.set(false);
    this.ui.toast(this.ui.t('team.added'));
  }
}
