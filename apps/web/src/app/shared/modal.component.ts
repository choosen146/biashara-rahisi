import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';
import { IconComponent } from './icon.component';

/**
 * Dialog that becomes a bottom sheet on phones. `variant="drawer"` slides in from the right on desktop
 * (used for record details). Body content is projected; put action buttons in an element with [footer].
 */
@Component({
  selector: 'tbms-modal',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="modal-backdrop" (click)="closed.emit()"></div>
      <div class="modal" [class.drawer]="variant() === 'drawer'" [class.wide]="size() === 'wide'" role="dialog" aria-modal="true" [attr.aria-label]="title()">
        <header class="modal-head">
          <div>
            <h2>{{ title() }}</h2>
            @if (subtitle()) { <p>{{ subtitle() }}</p> }
          </div>
          <button type="button" class="icon-btn" (click)="closed.emit()" aria-label="Close"><tbms-icon name="x" [size]="18" /></button>
        </header>
        <div class="modal-body"><ng-content /></div>
        <footer class="modal-foot"><ng-content select="[footer]" /></footer>
      </div>
    }
  `,
})
export class ModalComponent {
  open = input(false);
  title = input('');
  subtitle = input('');
  variant = input<'dialog' | 'drawer'>('dialog');
  size = input<'normal' | 'wide'>('normal');
  closed = output<void>();

  @HostListener('document:keydown.escape') onEsc() { if (this.open()) this.closed.emit(); }
}
