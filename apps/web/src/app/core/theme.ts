import { Injectable, signal } from '@angular/core';
import { readStorage, writeStorage } from './i18n';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.initial());

  constructor() { this.apply(); }

  toggle() {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
    writeStorage('tbms_theme', this.theme());
    this.apply();
  }

  private initial(): Theme {
    const saved = readStorage('tbms_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private apply() { document.documentElement.dataset['theme'] = this.theme(); }
}
