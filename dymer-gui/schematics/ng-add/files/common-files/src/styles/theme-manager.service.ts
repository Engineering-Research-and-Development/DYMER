import { Injectable, RendererFactory2, inject, signal, effect } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type ThemeOption = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root',
})
export class ThemeManager {
  private _document = inject(DOCUMENT);
  private _renderer = inject(RendererFactory2).createRenderer(null, null);
  private _query = window.matchMedia('(prefers-color-scheme: dark)');

  readonly currentTheme = signal<ThemeOption>('auto');

  constructor() {
    const saved = localStorage.getItem('theme-option') as ThemeOption;
    if (saved) {
      this.currentTheme.set(saved);
    }

    effect(() => {
      const theme = this.currentTheme();
      localStorage.setItem('theme-option', theme);
      this._updateTheme(theme);
    });

    this._query.addEventListener('change', () => {
      if (this.currentTheme() === 'auto') {
        this._updateTheme('auto');
      }
    });
  }

  setTheme(theme: ThemeOption) {
    this.currentTheme.set(theme);
  }

  private _updateTheme(theme: ThemeOption) {
    const isDark = theme === 'dark' || (theme === 'auto' && this._query.matches);
    if (isDark) {
      this._renderer.addClass(this._document.documentElement, 'theme-dark');
    } else {
      this._renderer.removeClass(this._document.documentElement, 'theme-dark');
    }
  }
}