import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '../../core/store';
import { Ui } from '../../core/ui';
import { IconComponent, IconName } from '../../shared/icon.component';

const ICON_BY_ENTITY: Record<string, IconName> = {
  sale: 'sales', purchase: 'purchases', expense: 'expenses', product: 'products', stock: 'inventory',
  customer: 'customers', supplier: 'suppliers', member: 'team', org: 'settings', category: 'products',
};

@Component({
  selector: 'tbms-audit',
  standalone: true,
  imports: [FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head"><div><h1>{{ ui.t('audit.title') }}</h1><p>{{ ui.t('audit.subtitle') }}</p></div></header>
    <section class="card table-card">
      <div class="toolbar">
        <label class="search"><tbms-icon name="search" [size]="16" /><input type="search" [placeholder]="ui.t('common.search')" [ngModel]="q()" (ngModelChange)="q.set($event)" /></label>
        <select [ngModel]="user()" (ngModelChange)="user.set($event)">
          <option value="">{{ ui.t('audit.filterUser') }}</option>
          @for (m of store.members(); track m.id) { <option [value]="m.userId">{{ m.user.name }}</option> }
        </select>
        <span class="count">{{ filtered().length }}</span>
      </div>
      @if (visible().length) {
        <ul class="feed">
          @for (e of visible(); track e.id) {
            <li>
              <span class="ic"><tbms-icon [name]="icon(e.action)" [size]="16" /></span>
              <span class="body"><span class="text">{{ ui.auditText(e) }}</span><span class="meta">{{ ui.userName(e.actorId) }} · {{ ui.dateTime(e.at) }}</span></span>
              <span class="when">{{ ui.rel(e.at) }}</span>
            </li>
          }
        </ul>
        @if (filtered().length > visible().length) {
          <div class="table-more"><button type="button" class="btn secondary sm" (click)="limit.set(limit() + 80)">{{ ui.t('dash.seeAll') }} ({{ filtered().length - visible().length }})</button></div>
        }
      } @else { <div class="empty"><span class="empty-ic"><tbms-icon name="audit" [size]="26" /></span><p>{{ ui.t('audit.empty') }}</p></div> }
    </section>
  `,
  styles: [`
    .feed { list-style: none; margin: 0; padding: 0; }
    .feed li { display: flex; gap: 12px; align-items: flex-start; padding: 12px 16px; border-bottom: 1px solid var(--border); }
    .feed li:last-child { border-bottom: 0; }
    .ic { width: 32px; height: 32px; border-radius: 9px; background: var(--hover); color: var(--text-2); display: grid; place-items: center; flex: none; }
    .body { flex: 1; min-width: 0; .text { display: block; font-size: 14px; color: var(--text-1); } .meta { display: block; font-size: 12.5px; color: var(--text-3); margin-top: 2px; } }
    .when { font-size: 12.5px; color: var(--text-3); white-space: nowrap; }
    @media (max-width: 560px) { .when { display: none; } }
  `],
})
export class AuditComponent {
  readonly ui = inject(Ui);
  readonly store = inject(Store);
  readonly q = signal('');
  readonly user = signal('');
  readonly limit = signal(80);
  readonly filtered = computed(() => {
    const q = this.q().trim().toLowerCase();
    return this.store.audit().filter((e) => (!this.user() || e.actorId === this.user()) && (!q || this.ui.auditText(e).toLowerCase().includes(q)));
  });
  readonly visible = computed(() => this.filtered().slice(0, this.limit()));
  icon(action: string): IconName { return ICON_BY_ENTITY[action.split('.')[1]] ?? 'audit'; }
}
