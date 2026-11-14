import { Component, inject } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouterOutlet, provideRouter, withComponentInputBinding, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { routes } from './app/app.routes';
import { ThemeService } from './app/core/theme';

/**
 * Prototype build: there is no API yet. All data lives in the in-browser Store (src/app/core/store.ts),
 * which enforces the same tenancy, permission and integrity rules the NestJS API will.
 */
@Component({
  selector: 'tbms-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent {
  private theme = inject(ThemeService);
}

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'top' }), withViewTransitions())],
}).catch((err) => console.error(err));
