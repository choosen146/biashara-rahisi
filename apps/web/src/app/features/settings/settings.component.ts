import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BUSINESS_TYPES, BusinessType } from '../../core/models';
import { Store } from '../../core/store';
import { Ui } from '../../core/ui';
import { IconComponent } from '../../shared/icon.component';
import { ModalComponent } from '../../shared/modal.component';

const REGIONS = ['Arusha', 'Dar es Salaam', 'Dodoma', 'Geita', 'Iringa', 'Kagera', 'Katavi', 'Kigoma', 'Kilimanjaro', 'Lindi', 'Manyara',
  'Mara', 'Mbeya', 'Morogoro', 'Mtwara', 'Mwanza', 'Njombe', 'Pwani', 'Rukwa', 'Ruvuma', 'Shinyanga', 'Simiyu', 'Singida', 'Songwe',
  'Tabora', 'Tanga', 'Zanzibar'];

@Component({
  selector: 'tbms-settings',
  standalone: true,
  imports: [FormsModule, IconComponent, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head"><div><h1>{{ ui.t('set.title') }}</h1><p>{{ ui.t('set.subtitle') }}</p></div></header>
    @if (!canEdit) { <div class="hint bottom"><tbms-icon name="lock" [size]="16" />{{ ui.t('set.readOnly') }}</div> }

    <div class="cols-2">
      <section class="card panel">
        <div class="panel-head"><div><h2>{{ ui.t('set.profile') }}</h2></div></div>
        <form class="form" (ngSubmit)="save()">
          <fieldset [disabled]="!canEdit">
            <label class="field">{{ ui.t('set.name') }}<input [(ngModel)]="d.name" name="name" required /></label>
            <label class="field">{{ ui.t('set.type') }}
              <select [(ngModel)]="d.businessType" name="bt">@for (b of types; track b) { <option [value]="b">{{ ui.t('bt.' + b) }}</option> }</select>
            </label>
            <div class="grid-2">
              <label class="field">{{ ui.t('common.phone') }}<input type="tel" [(ngModel)]="d.phone" name="phone" /></label>
              <label class="field">{{ ui.t('common.email') }}<input type="email" [(ngModel)]="d.email" name="email" /></label>
            </div>
            <div class="grid-2">
              <label class="field">{{ ui.t('set.region') }}
                <select [(ngModel)]="d.region" name="region"><option value="">—</option>@for (r of regions; track r) { <option [value]="r">{{ r }}</option> }</select>
              </label>
              <label class="field">{{ ui.t('set.tin') }}<input [(ngModel)]="d.tin" name="tin" placeholder="123-456-789" /></label>
            </div>
            <label class="field">{{ ui.t('set.address') }}<input [(ngModel)]="d.address" name="addr" /></label>
          </fieldset>
          @if (canEdit) { <button type="submit" class="btn primary save">{{ ui.t('common.save') }}</button> }
        </form>
      </section>

      <div class="side">
        <section class="card panel">
          <div class="panel-head"><div><h2>{{ ui.t('set.features') }}</h2></div></div>
          <div class="switch-row">
            <div><b>{{ ui.t('set.inventory') }}</b><p class="small">{{ ui.t('set.inventoryHint') }}</p></div>
            <label class="toggle"><input type="checkbox" [ngModel]="store.inventoryOn()" (ngModelChange)="toggleInventory($event)" [disabled]="!canEdit" [attr.aria-label]="ui.t('set.inventory')" /><i></i></label>
          </div>
        </section>
        <section class="card panel">
          <div class="panel-head"><div><h2>{{ ui.t('set.demo') }}</h2><p>{{ ui.t('set.demoHint') }}</p></div></div>
          <button type="button" class="btn secondary" (click)="confirmReset.set(true)"><tbms-icon name="refresh" [size]="16" />{{ ui.t('set.reset') }}</button>
        </section>
      </div>
    </div>

    <tbms-modal [open]="confirmReset()" [title]="ui.t('set.reset')" (closed)="confirmReset.set(false)">
      <p class="small">{{ ui.t('set.resetConfirm') }}</p>
      <div footer>
        <button type="button" class="btn secondary" (click)="confirmReset.set(false)">{{ ui.t('common.cancel') }}</button>
        <button type="button" class="btn danger" (click)="reset()">{{ ui.t('set.reset') }}</button>
      </div>
    </tbms-modal>
  `,
  styles: [`
    fieldset { border: 0; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px; min-width: 0; }
    .save { align-self: flex-start; }
    .side { display: flex; flex-direction: column; gap: 16px; }
    .small { color: var(--text-2); font-size: 13.5px; margin: 4px 0 0; }
    .bottom { margin-bottom: 16px; }
  `],
})
export class SettingsComponent {
  readonly ui = inject(Ui);
  readonly store = inject(Store);
  private router = inject(Router);
  readonly types = BUSINESS_TYPES;
  readonly regions = REGIONS;
  readonly canEdit = this.store.can('settings.manage');
  readonly confirmReset = signal(false);
  d: { name: string; businessType: BusinessType; phone: string; email: string; region: string; tin: string; address: string };

  constructor() {
    const o = this.store.org()!;
    this.d = { name: o.name, businessType: o.businessType, phone: o.phone ?? '', email: o.email ?? '', region: o.region ?? '', tin: o.tin ?? '', address: o.address ?? '' };
  }
  save() { this.ui.run(() => this.store.updateOrg(this.d), 'set.saved'); }
  toggleInventory(on: boolean) { this.ui.run(() => this.store.updateOrg({ inventoryEnabled: on }), 'set.saved'); }
  reset() {
    this.store.resetDemo();
    this.router.navigateByUrl('/login');
  }
}
