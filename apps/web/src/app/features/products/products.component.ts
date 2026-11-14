import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Product, UNITS, Unit } from '../../core/models';
import { Store } from '../../core/store';
import { Ui } from '../../core/ui';
import { IconComponent } from '../../shared/icon.component';
import { ModalComponent } from '../../shared/modal.component';

interface Draft {
  id?: string; name: string; sku: string; categoryId: string; unit: Unit; price: number; cost: number;
  reorderLevel: number; openingStock: number; trackStock: boolean; active: boolean;
}

@Component({
  selector: 'tbms-products',
  standalone: true,
  imports: [FormsModule, IconComponent, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div><h1>{{ ui.t('prod.title') }}</h1><p>{{ ui.t('prod.subtitle') }}</p></div>
      @if (store.can('products.manage')) {
        <div class="head-actions"><button type="button" class="btn primary" (click)="open()"><tbms-icon name="plus" [size]="18" [stroke]="2.2" />{{ ui.t('prod.new') }}</button></div>
      }
    </header>

    <section class="card table-card">
      <div class="toolbar">
        <label class="search"><tbms-icon name="search" [size]="16" /><input type="search" [placeholder]="ui.t('common.search')" [ngModel]="q()" (ngModelChange)="q.set($event)" /></label>
        <select [ngModel]="cat()" (ngModelChange)="cat.set($event)" [attr.aria-label]="ui.t('common.category')">
          <option value="">{{ ui.t('common.all') }}</option>
          @for (c of store.categories(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
        </select>
        <span class="count">{{ filtered().length }}</span>
      </div>
      @if (filtered().length) {
        <table class="table">
          <thead><tr>
            <th>{{ ui.t('common.product') }}</th><th>{{ ui.t('common.category') }}</th><th class="num">{{ ui.t('prod.priceSell') }}</th>
            <th class="num">{{ ui.t('prod.priceCost') }}</th><th class="num">{{ ui.t('prod.margin') }}</th>
            @if (store.inventoryOn()) { <th class="num">{{ ui.t('prod.stock') }}</th> }
          </tr></thead>
          <tbody>
            @for (p of filtered(); track p.id) {
              <tr [class.click]="store.can('products.manage')" [class.voided]="!p.active" (click)="store.can('products.manage') && open(p)">
                <td class="lead"><span class="strong">{{ p.name }}</span><span class="sub">{{ p.sku }} · {{ ui.t('unit.' + p.unit) }}@if (!p.active) { · {{ ui.t('prod.inactive') }} }</span></td>
                <td [attr.data-label]="ui.t('common.category')">{{ catName(p) }}</td>
                <td class="num strong" [attr.data-label]="ui.t('prod.priceSell')">{{ ui.money(p.price) }}</td>
                <td class="num" [attr.data-label]="ui.t('prod.priceCost')">{{ ui.money(p.cost) }}</td>
                <td class="num" [attr.data-label]="ui.t('prod.margin')">{{ margin(p) }}</td>
                @if (store.inventoryOn()) {
                  <td class="num" [attr.data-label]="ui.t('prod.stock')">
                    @if (p.trackStock) { <span class="badge" [attr.data-s]="level(p)">{{ ui.num(stockOf(p.id)) }}</span> } @else { — }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <div class="empty"><span class="empty-ic"><tbms-icon name="products" [size]="26" /></span><p>{{ store.products().length ? ui.t('common.noResults') : ui.t('prod.empty') }}</p>
          @if (!store.products().length && store.can('products.manage')) { <button type="button" class="btn primary" (click)="open()"><tbms-icon name="plus" [size]="16" />{{ ui.t('prod.new') }}</button> }
        </div>
      }
    </section>

    <tbms-modal [open]="formOpen()" [title]="d.id ? ui.t('prod.edit') : ui.t('prod.new')" (closed)="formOpen.set(false)">
      <form class="form" id="prodForm" (ngSubmit)="save()">
        <label class="field">{{ ui.t('common.name') }}<input [(ngModel)]="d.name" name="name" required (blur)="autoSku()" /></label>
        <div class="grid-2">
          <label class="field">{{ ui.t('prod.sku') }}<input [(ngModel)]="d.sku" name="sku" required /></label>
          <label class="field">{{ ui.t('common.unit') }}
            <select [(ngModel)]="d.unit" name="unit">@for (u of units; track u) { <option [value]="u">{{ ui.t('unit.' + u) }}</option> }</select>
          </label>
        </div>
        <label class="field">{{ ui.t('common.category') }}
          @if (!addingCat()) {
            <select [ngModel]="d.categoryId" (ngModelChange)="onCat($event)" name="cat">
              <option value="">{{ ui.t('prod.uncategorised') }}</option>
              @for (c of store.categories(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
              <option value="__new">+ {{ ui.t('prod.newCategory') }}</option>
            </select>
          } @else {
            <div class="inline">
              <input [(ngModel)]="newCat" name="newCat" [placeholder]="ui.t('prod.newCategory')" />
              <button type="button" class="btn secondary sm" (click)="addCat()">{{ ui.t('common.add') }}</button>
              <button type="button" class="icon-btn" (click)="addingCat.set(false)"><tbms-icon name="x" [size]="16" /></button>
            </div>
          }
        </label>
        <div class="grid-2">
          <label class="field">{{ ui.t('prod.priceSell') }} (TZS)<input type="number" min="0" step="50" [(ngModel)]="d.price" name="price" /></label>
          <label class="field">{{ ui.t('prod.priceCost') }} (TZS)<input type="number" min="0" step="50" [(ngModel)]="d.cost" name="cost" />
            @if (d.price > 0) { <small>{{ ui.t('prod.margin') }}: {{ marginOf(d.price, d.cost) }}</small> }
          </label>
        </div>
        @if (store.inventoryOn()) {
          <label class="check"><input type="checkbox" [(ngModel)]="d.trackStock" name="track" />{{ ui.t('prod.trackStock') }}</label>
          @if (d.trackStock) {
            <div class="grid-2">
              <label class="field">{{ ui.t('prod.reorder') }}<input type="number" min="0" [(ngModel)]="d.reorderLevel" name="reorder" /></label>
              @if (!d.id) { <label class="field">{{ ui.t('prod.openingStock') }}<input type="number" min="0" [(ngModel)]="d.openingStock" name="opening" /></label> }
            </div>
          }
        }
        @if (d.id) { <label class="check"><input type="checkbox" [(ngModel)]="d.active" name="active" />{{ ui.t('prod.active') }}</label> }
        @if (error()) { <div class="form-error" role="alert"><tbms-icon name="alert" [size]="16" />{{ error() }}</div> }
      </form>
      <div footer>
        <button type="button" class="btn secondary" (click)="formOpen.set(false)">{{ ui.t('common.cancel') }}</button>
        <button type="submit" form="prodForm" class="btn primary">{{ ui.t('common.save') }}</button>
      </div>
    </tbms-modal>
  `,
  styles: [`.inline { display: flex; gap: 8px; align-items: center; input { flex: 1; } }`],
})
export class ProductsComponent {
  readonly ui = inject(Ui);
  readonly store = inject(Store);
  readonly units = UNITS;
  readonly q = signal('');
  readonly cat = signal('');
  readonly filtered = computed(() => {
    const q = this.q().trim().toLowerCase();
    return this.store.products()
      .filter((p) => (!this.cat() || p.categoryId === this.cat()) && (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)))
      .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));
  });

  catName(p: Product) { return p.categoryId ? this.store.categoryById().get(p.categoryId)?.name ?? '—' : this.ui.t('prod.uncategorised'); }
  stockOf(id: string) { return this.store.stock().get(id) ?? 0; }
  level(p: Product) { const s = this.stockOf(p.id); return s <= 0 ? 'OUT' : s <= p.reorderLevel ? 'LOW' : 'OK'; }
  marginOf(price: number, cost: number) { return price > 0 ? `${Math.round(((price - cost) / price) * 100)}%` : '—'; }
  margin(p: Product) { return this.marginOf(p.price, p.cost); }

  readonly formOpen = signal(false);
  readonly error = signal<string | null>(null);
  readonly addingCat = signal(false);
  newCat = '';
  d: Draft = this.blank();

  constructor() {
    const router = inject(Router);
    inject(ActivatedRoute).queryParamMap.subscribe((p) => {
      if (p.get('new') && this.store.can('products.manage')) { this.open(); router.navigate([], { queryParams: {} }); }
    });
  }

  private blank(): Draft {
    return { name: '', sku: '', categoryId: '', unit: 'piece', price: 0, cost: 0, reorderLevel: 5, openingStock: 0, trackStock: true, active: true };
  }
  open(p?: Product) {
    this.d = p ? { ...p, categoryId: p.categoryId ?? '', openingStock: 0 } : this.blank();
    this.error.set(null);
    this.addingCat.set(false);
    this.formOpen.set(true);
  }
  autoSku() {
    if (this.d.id || this.d.sku || !this.d.name.trim()) return;
    const base = this.d.name.normalize('NFD').replace(/[^A-Za-z0-9 ]/g, '').trim().split(/\s+/).map((w) => w.slice(0, 3)).join('-').toUpperCase();
    this.d.sku = base.slice(0, 12);
  }
  onCat(v: string) { if (v === '__new') { this.addingCat.set(true); this.newCat = ''; } else this.d.categoryId = v; }
  addCat() {
    const r = this.ui.attempt(() => this.store.addCategory(this.newCat));
    if (r.ok) { this.d.categoryId = r.value.id; this.addingCat.set(false); this.ui.toast(this.ui.t('prod.categoryAdded')); }
    else this.error.set(r.error);
  }
  save() {
    const r = this.ui.attempt(() => this.store.saveProduct(this.d));
    if (!r.ok) { this.error.set(r.error); return; }
    this.formOpen.set(false);
    this.ui.toast(this.ui.t('prod.saved'));
  }
}
