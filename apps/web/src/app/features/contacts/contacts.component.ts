import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Contact } from '../../core/models';
import { Store, paymentStatus, saleBalance } from '../../core/store';
import { Ui } from '../../core/ui';
import { IconComponent } from '../../shared/icon.component';
import { ModalComponent } from '../../shared/modal.component';

interface Row { c: Contact; total: number; owed: number; count: number; last: string | null }
interface HistoryItem { id: string; number: string; at: string; total: number; status: string; balance: number }

/** Customers and suppliers share one screen; route data `kind` picks which. */
@Component({
  selector: 'tbms-contacts',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div><h1>{{ ui.t(k + '.title') }}</h1><p>{{ ui.t(k + '.subtitle') }}</p></div>
      @if (canManage()) {
        <div class="head-actions"><button type="button" class="btn primary" (click)="openForm()"><tbms-icon name="userPlus" [size]="18" />{{ ui.t(k + '.new') }}</button></div>
      }
    </header>

    <section class="card table-card">
      <div class="toolbar">
        <label class="search"><tbms-icon name="search" [size]="16" /><input type="search" [placeholder]="ui.t('common.search')" [ngModel]="q()" (ngModelChange)="q.set($event)" /></label>
        @if (isCustomers()) {
          <div class="seg">
            <button type="button" [class.on]="!owingOnly()" (click)="owingOnly.set(false)">{{ ui.t('common.all') }}</button>
            <button type="button" [class.on]="owingOnly()" (click)="owingOnly.set(true)">{{ ui.t('sales.filter.owing') }}</button>
          </div>
        }
        <span class="count">{{ filtered().length }}</span>
      </div>
      @if (filtered().length) {
        <table class="table">
          <thead><tr><th>{{ ui.t('common.name') }}</th><th>{{ ui.t('common.phone') }}</th><th class="num">{{ ui.t(k + '.totalBought') }}</th>
            <th class="num">{{ isCustomers() ? ui.t('cus.owes') : ui.t('sup.owed') }}</th><th>{{ ui.t(k + '.last') }}</th></tr></thead>
          <tbody>
            @for (r of filtered(); track r.c.id) {
              <tr class="click" (click)="detailId.set(r.c.id)" tabindex="0" (keydown.enter)="detailId.set(r.c.id)">
                <td class="lead"><span class="strong">{{ r.c.name }}</span><span class="sub">{{ r.count }} · {{ ui.t(isCustomers() ? 'nav.sales' : 'nav.purchases') }}</span></td>
                <td [attr.data-label]="ui.t('common.phone')">{{ r.c.phone || '—' }}</td>
                <td class="num" [attr.data-label]="ui.t(k + '.totalBought')">{{ ui.money(r.total) }}</td>
                <td class="num" [attr.data-label]="isCustomers() ? ui.t('cus.owes') : ui.t('sup.owed')" [class.neg]="r.owed > 0">{{ r.owed > 0 ? ui.money(r.owed) : '—' }}</td>
                <td [attr.data-label]="ui.t(k + '.last')" class="muted">{{ r.last ? ui.rel(r.last) : '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <div class="empty"><span class="empty-ic"><tbms-icon [name]="isCustomers() ? 'customers' : 'suppliers'" [size]="26" /></span>
          <p>{{ list().length ? ui.t('common.noResults') : ui.t(k + '.empty') }}</p></div>
      }
    </section>

    <tbms-modal [open]="!!detail()" variant="drawer" [title]="detail()?.c?.name ?? ''" (closed)="detailId.set(null)">
      @if (detail(); as r) {
        <dl class="kv">
          <dt>{{ ui.t('common.phone') }}</dt><dd>{{ r.c.phone || '—' }}</dd>
          <dt>{{ ui.t('common.email') }}</dt><dd>{{ r.c.email || '—' }}</dd>
          <dt>{{ ui.t(k + '.totalBought') }}</dt><dd>{{ ui.money(r.total) }}</dd>
          <dt>{{ isCustomers() ? ui.t('cus.owes') : ui.t('sup.owed') }}</dt><dd [class.neg]="r.owed > 0">{{ ui.money(r.owed) }}</dd>
        </dl>
        @if (r.c.notes) { <div class="hint mt">{{ r.c.notes }}</div> }
        @if (canManage()) { <button type="button" class="btn secondary mt" (click)="openForm(r.c)"><tbms-icon name="edit" [size]="15" />{{ ui.t('common.edit') }}</button> }
        <h3 class="section-title">{{ ui.t('contact.history') }}</h3>
        <ul class="lines">
          @for (h of history(); track h.id) {
            <li>
              <span>
                @if (isCustomers()) { <a class="ref" [routerLink]="['/sales']" [queryParams]="{ id: h.id }">{{ h.number }}</a> } @else { {{ h.number }} }
                <small>{{ ui.date(h.at) }}</small>
              </span>
              <span class="hr"><span>{{ ui.money(h.total) }}</span><span class="badge" [attr.data-s]="h.status">{{ statusLabel(h.status) }}</span></span>
            </li>
          } @empty { <li class="muted">{{ ui.t('contact.noHistory') }}</li> }
        </ul>
      }
    </tbms-modal>

    <tbms-modal [open]="formOpen()" [title]="draft.id ? ui.t(k + '.edit') : ui.t(k + '.new')" (closed)="formOpen.set(false)">
      <form class="form" id="contactForm" (ngSubmit)="save()">
        <label class="field">{{ ui.t('common.name') }}<input [(ngModel)]="draft.name" name="name" required /></label>
        <div class="grid-2">
          <label class="field">{{ ui.t('common.phone') }} <span class="opt">({{ ui.t('common.optional') }})</span><input type="tel" [(ngModel)]="draft.phone" name="phone" placeholder="+255 7__ ___ ___" /></label>
          <label class="field">{{ ui.t('common.email') }} <span class="opt">({{ ui.t('common.optional') }})</span><input type="email" [(ngModel)]="draft.email" name="email" /></label>
        </div>
        <label class="field">{{ ui.t('common.notes') }} <span class="opt">({{ ui.t('common.optional') }})</span><textarea [(ngModel)]="draft.notes" name="notes" rows="2"></textarea></label>
        @if (error()) { <div class="form-error" role="alert"><tbms-icon name="alert" [size]="16" />{{ error() }}</div> }
      </form>
      <div footer>
        <button type="button" class="btn secondary" (click)="formOpen.set(false)">{{ ui.t('common.cancel') }}</button>
        <button type="submit" form="contactForm" class="btn primary">{{ ui.t('common.save') }}</button>
      </div>
    </tbms-modal>
  `,
  styles: [`.muted { color: var(--text-3); } .ref { color: var(--brand); font-weight: 600; text-decoration: none; }
    .hr { display: inline-flex; gap: 8px; align-items: center; }`],
})
export class ContactsComponent {
  readonly ui = inject(Ui);
  readonly store = inject(Store);
  kind = input<'customers' | 'suppliers'>('customers');
  readonly isCustomers = computed(() => this.kind() === 'customers');
  get k() { return this.isCustomers() ? 'cus' : 'sup'; }
  readonly canManage = computed(() => this.store.can(this.isCustomers() ? 'customers.manage' : 'suppliers.manage'));

  readonly q = signal('');
  readonly owingOnly = signal(false);
  readonly list = computed(() => (this.isCustomers() ? this.store.customers() : this.store.suppliers()));

  readonly rows = computed<Row[]>(() => {
    const stats = new Map<string, { total: number; owed: number; count: number; last: string | null }>();
    const bump = (id: string | null, total: number, owed: number, at: string) => {
      if (!id) return;
      const s = stats.get(id) ?? { total: 0, owed: 0, count: 0, last: null };
      s.total += total; s.owed += owed; s.count++; if (!s.last || at > s.last) s.last = at;
      stats.set(id, s);
    };
    if (this.isCustomers()) for (const s of this.store.sales()) { if (s.status === 'COMPLETED') bump(s.customerId, s.total, saleBalance(s), s.createdAt); }
    else for (const p of this.store.purchases()) { if (p.status === 'COMPLETED') bump(p.supplierId, p.total, p.paid ? 0 : p.total, p.createdAt); }
    return this.list().map((c) => ({ c, ...(stats.get(c.id) ?? { total: 0, owed: 0, count: 0, last: null }) }));
  });
  readonly filtered = computed(() => {
    const q = this.q().trim().toLowerCase();
    return this.rows()
      .filter((r) => (!this.owingOnly() || r.owed > 0) && (!q || r.c.name.toLowerCase().includes(q) || (r.c.phone ?? '').includes(q)))
      .sort((a, b) => b.owed - a.owed || (b.last ?? '').localeCompare(a.last ?? ''));
  });

  readonly detailId = signal<string | null>(null);
  readonly detail = computed(() => this.rows().find((r) => r.c.id === this.detailId()) ?? null);
  readonly history = computed<HistoryItem[]>(() => {
    const id = this.detailId();
    if (!id) return [];
    if (this.isCustomers()) {
      return this.store.sales().filter((s) => s.customerId === id).slice(0, 30).map((s) => ({
        id: s.id, number: s.number, at: s.createdAt, total: s.total, balance: saleBalance(s),
        status: s.status === 'VOIDED' ? 'VOIDED' : paymentStatus(s),
      }));
    }
    return this.store.purchases().filter((p) => p.supplierId === id).slice(0, 30).map((p) => ({
      id: p.id, number: p.number, at: p.createdAt, total: p.total, balance: p.paid ? 0 : p.total,
      status: p.status === 'VOIDED' ? 'VOIDED' : p.paid ? 'PAID' : 'UNPAID',
    }));
  });
  statusLabel(s: string) { return this.ui.t('status.' + s); }

  readonly formOpen = signal(false);
  readonly error = signal<string | null>(null);
  draft: Partial<Contact> & { name: string } = { name: '' };
  openForm(c?: Contact) {
    this.draft = c ? { ...c } : { name: '' };
    this.error.set(null);
    this.formOpen.set(true);
  }
  save() {
    const r = this.ui.attempt(() => this.store.saveContact(this.kind(), this.draft));
    if (!r.ok) { this.error.set(r.error); return; }
    this.formOpen.set(false);
    this.ui.toast(this.ui.t(this.k + '.saved'));
  }
}
