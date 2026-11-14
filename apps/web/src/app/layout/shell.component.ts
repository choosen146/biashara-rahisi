import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { I18n, I18nKey } from '../core/i18n';
import { Perm } from '../core/models';
import { Store } from '../core/store';
import { ThemeService } from '../core/theme';
import { ToastsComponent } from '../core/ui';
import { IconComponent, IconName } from '../shared/icon.component';

interface NavItem { path: string; icon: IconName; label: I18nKey; perm?: Perm; exact?: boolean; needsInventory?: boolean }
interface NavSection { label: I18nKey | null; items: NavItem[] }

const SECTIONS: NavSection[] = [
  { label: null, items: [{ path: '/', icon: 'overview', label: 'nav.overview', exact: true }] },
  { label: 'nav.sec.daily', items: [
    { path: '/sales', icon: 'sales', label: 'nav.sales', perm: 'sales.view' },
    { path: '/purchases', icon: 'purchases', label: 'nav.purchases', perm: 'purchases.view' },
    { path: '/expenses', icon: 'expenses', label: 'nav.expenses', perm: 'expenses.view' },
  ] },
  { label: 'nav.sec.records', items: [
    { path: '/products', icon: 'products', label: 'nav.products', perm: 'products.view' },
    { path: '/inventory', icon: 'inventory', label: 'nav.inventory', perm: 'inventory.view', needsInventory: true },
    { path: '/customers', icon: 'customers', label: 'nav.customers', perm: 'customers.view' },
    { path: '/suppliers', icon: 'suppliers', label: 'nav.suppliers', perm: 'suppliers.view' },
  ] },
  { label: 'nav.sec.insights', items: [
    { path: '/reports', icon: 'reports', label: 'nav.reports', perm: 'reports.view' },
    { path: '/audit', icon: 'audit', label: 'nav.audit', perm: 'audit.view' },
  ] },
  { label: 'nav.sec.business', items: [
    { path: '/team', icon: 'team', label: 'nav.team', perm: 'team.view' },
    { path: '/settings', icon: 'settings', label: 'nav.settings', perm: 'team.view' },
  ] },
];

@Component({
  selector: 'tbms-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, ToastsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="org-switch">
          <button type="button" class="org-btn" (click)="orgMenu.set(!orgMenu())" [attr.aria-expanded]="orgMenu()">
            <span class="mark">{{ orgInitial() }}</span>
            <span class="org-text"><strong>{{ store.org()?.name }}</strong><small>{{ i18n.t('role.' + store.role()) }}</small></span>
            @if (store.myOrgs().length > 1) { <tbms-icon name="chevronDown" [size]="16" class="chev" /> }
          </button>
          @if (orgMenu() && store.myOrgs().length > 1) {
            <div class="menu-backdrop" (click)="orgMenu.set(false)"></div>
            <div class="menu org-menu" role="menu">
              <div class="menu-label">{{ i18n.t('nav.yourBusinesses') }}</div>
              @for (o of store.myOrgs(); track o.org.id) {
                <button type="button" role="menuitem" (click)="switchOrg(o.org.id)" [class.current]="o.org.id === store.org()?.id">
                  <span class="mark sm">{{ o.org.name[0] }}</span>
                  <span class="grow"><b>{{ o.org.name }}</b><small>{{ i18n.t('role.' + o.role) }}</small></span>
                  @if (o.org.id === store.org()?.id) { <tbms-icon name="check" [size]="16" /> }
                </button>
              }
            </div>
          }
        </div>

        <nav aria-label="Main">
          @for (sec of sections(); track $index) {
            @if (sec.label) { <div class="sec-label">{{ i18n.t(sec.label) }}</div> }
            @for (item of sec.items; track item.path) {
              <a [routerLink]="item.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: !!item.exact }" [attr.title]="i18n.t(item.label)">
                <tbms-icon [name]="item.icon" [size]="19" /><span>{{ i18n.t(item.label) }}</span>
              </a>
            }
          }
        </nav>
        <div class="proto-note"><tbms-icon name="info" [size]="14" /><span>{{ i18n.t('common.prototype') }}</span></div>
      </aside>

      <div class="main-col">
        <header class="topbar">
          <button type="button" class="org-mobile" (click)="orgMenu.set(!orgMenu())">
            <span class="mark sm">{{ orgInitial() }}</span><span class="org-name">{{ store.org()?.name }}</span>
            @if (store.myOrgs().length > 1) { <tbms-icon name="chevronDown" [size]="15" /> }
          </button>
          <div class="spacer"></div>
          <div class="actions">
            <button type="button" class="ghost" (click)="i18n.toggle()" [attr.aria-label]="i18n.t('ui.lang')">
              <tbms-icon name="globe" [size]="16" /><span class="lang-label">{{ i18n.lang() === 'en' ? 'Kiswahili' : 'English' }}</span>
            </button>
            <button type="button" class="ghost icon-only" (click)="theme.toggle()" [attr.aria-label]="i18n.t('ui.theme')">
              <tbms-icon [name]="theme.theme() === 'dark' ? 'sun' : 'moon'" [size]="16" />
            </button>
            <div class="menu-wrap">
              <button type="button" class="avatar" (click)="userMenu.set(!userMenu())" [attr.aria-expanded]="userMenu()" aria-haspopup="menu">{{ initials() }}</button>
              @if (userMenu()) {
                <div class="menu-backdrop" (click)="userMenu.set(false)"></div>
                <div class="menu" role="menu">
                  <div class="who"><b>{{ store.user()?.name }}</b><small>{{ store.user()?.email }}</small>
                    <span class="role-chip">{{ i18n.t('role.' + store.role()) }} · {{ store.org()?.name }}</span></div>
                  @if (store.myOrgs().length > 1) {
                    <button type="button" role="menuitem" (click)="userMenu.set(false); orgMenu.set(true)"><tbms-icon name="swap" [size]="16" />{{ i18n.t('nav.switchOrg') }}</button>
                  }
                  <button type="button" role="menuitem" (click)="logout()"><tbms-icon name="logout" [size]="16" />{{ i18n.t('nav.signOut') }}</button>
                </div>
              }
            </div>
          </div>
        </header>
        <main id="content"><router-outlet /></main>
      </div>

      <nav class="tabbar" aria-label="Main">
        @for (item of tabs(); track item.path) {
          <a [routerLink]="item.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: !!item.exact }">
            <tbms-icon [name]="item.icon" [size]="22" /><span>{{ i18n.t(item.label) }}</span>
          </a>
        }
        <button type="button" [class.active]="moreOpen() || moreActive()" (click)="moreOpen.set(true)">
          <tbms-icon name="more" [size]="22" /><span>{{ i18n.t('nav.more') }}</span>
        </button>
      </nav>

      @if (moreOpen()) {
        <div class="modal-backdrop" (click)="moreOpen.set(false)"></div>
        <div class="sheet" role="dialog" [attr.aria-label]="i18n.t('nav.more')">
          <div class="sheet-grip"></div>
          <div class="sheet-grid">
            @for (item of moreItems(); track item.path) {
              <a [routerLink]="item.path" (click)="moreOpen.set(false)" routerLinkActive="active">
                <span class="sheet-ic"><tbms-icon [name]="item.icon" [size]="22" /></span>{{ i18n.t(item.label) }}
              </a>
            }
          </div>
          <button type="button" class="btn secondary block" (click)="logout()"><tbms-icon name="logout" [size]="16" />{{ i18n.t('nav.signOut') }}</button>
        </div>
      }

      @if (orgMenu() && store.myOrgs().length > 1) {
        <div class="modal-backdrop mobile-only" (click)="orgMenu.set(false)"></div>
        <div class="sheet mobile-only" role="menu">
          <div class="sheet-grip"></div>
          <div class="menu-label">{{ i18n.t('nav.yourBusinesses') }}</div>
          @for (o of store.myOrgs(); track o.org.id) {
            <button type="button" class="sheet-row" (click)="switchOrg(o.org.id)">
              <span class="mark sm">{{ o.org.name[0] }}</span>
              <span class="grow"><b>{{ o.org.name }}</b><small>{{ i18n.t('role.' + o.role) }}</small></span>
              @if (o.org.id === store.org()?.id) { <tbms-icon name="check" [size]="16" /> }
            </button>
          }
        </div>
      }
      <tbms-toasts />
    </div>
  `,
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  readonly i18n = inject(I18n);
  readonly theme = inject(ThemeService);
  readonly store = inject(Store);
  private router = inject(Router);

  readonly orgMenu = signal(false);
  readonly userMenu = signal(false);
  readonly moreOpen = signal(false);
  private url = signal(this.router.url);

  readonly sections = computed(() => {
    this.store.role();
    const inv = this.store.inventoryOn();
    return SECTIONS.map((s) => ({ ...s, items: s.items.filter((i) => (!i.perm || this.store.can(i.perm)) && (!i.needsInventory || inv)) }))
      .filter((s) => s.items.length);
  });
  private allItems = computed(() => this.sections().flatMap((s) => s.items));
  readonly tabs = computed(() => {
    const prefer = ['/', '/sales', '/products', '/expenses', '/purchases', '/customers'];
    return prefer.map((p) => this.allItems().find((i) => i.path === p)).filter((x): x is NavItem => !!x).slice(0, 4);
  });
  readonly moreItems = computed(() => this.allItems().filter((i) => !this.tabs().includes(i)));
  readonly moreActive = computed(() => this.moreItems().some((i) => this.url().startsWith(i.path) && i.path !== '/'));

  readonly orgInitial = computed(() => (this.store.org()?.name ?? 'T')[0].toUpperCase());
  readonly initials = computed(() =>
    (this.store.user()?.name ?? '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join(''),
  );

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => this.url.set((e as NavigationEnd).urlAfterRedirects));
  }

  switchOrg(id: string) {
    this.orgMenu.set(false);
    this.store.switchOrg(id);
    this.router.navigateByUrl('/');
  }

  logout() {
    this.userMenu.set(false);
    this.moreOpen.set(false);
    this.store.logout();
    this.router.navigateByUrl('/login');
  }
}
