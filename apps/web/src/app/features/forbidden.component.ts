import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '../core/store';
import { Ui } from '../core/ui';
import { IconComponent } from '../shared/icon.component';

@Component({
  selector: 'tbms-forbidden',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card empty">
      <span class="empty-ic"><tbms-icon name="lock" [size]="26" /></span>
      <h1 class="t">{{ ui.t('forbidden.title') }}</h1>
      <p>{{ ui.t('forbidden.body', { role: ui.t('role.' + store.role()) }) }}</p>
      <a routerLink="/" class="btn secondary"><tbms-icon name="arrowLeft" [size]="16" />{{ ui.t('nav.overview') }}</a>
    </section>
  `,
  styles: [`.t { font: 700 22px var(--font-display); margin: 0; color: var(--text-1); }`],
})
export class ForbiddenComponent {
  readonly ui = inject(Ui);
  readonly store = inject(Store);
}
