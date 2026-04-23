import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatPseudoCheckbox } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { SettingsService } from '@core';
import { TranslatePipe } from '@ngx-translate/core';
import { ThemeManager } from './theme-manager.service';

@Component({
  selector: 'app-translate',
  template: `
    <button mat-icon-button [matMenuTriggerFor]="themeMenu">
      <mat-icon>
        @switch (themeManager.currentTheme()) {
          @case ('light') { light_mode }
          @case ('dark') { dark_mode }
          @default { brightness_auto }
        }
      </mat-icon>
    </button>

    <mat-menu #themeMenu="matMenu">
      <button mat-menu-item (click)="themeManager.setTheme('light')">
        <mat-icon>light_mode</mat-icon>
        <span>Light</span>
      </button>
      <button mat-menu-item (click)="themeManager.setTheme('dark')">
        <mat-icon>dark_mode</mat-icon>
        <span>Dark</span>
      </button>
      <button mat-menu-item (click)="themeManager.setTheme('auto')">
        <mat-icon>brightness_auto</mat-icon>
        <span>Auto</span>
      </button>
    </mat-menu>

    <button mat-icon-button [matMenuTriggerFor]="menu">
      <mat-icon>flag</mat-icon>
    </button>

    <mat-menu #menu="matMenu">
      @for (lang of langs; track lang.value) {
        <button mat-menu-item (click)="changeLang(lang.value)">
          <span class="d-flex justify-content-between gap-8">
            {{ lang.name | translate }}
            @if (lang.value === options.language) {
              <mat-pseudo-checkbox state="checked" appearance="minimal" />
            }
          </span>
        </button>
      }
    </mat-menu>
  `,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatPseudoCheckbox, TranslatePipe],
})
export class TranslateComponent {
  private settings = inject(SettingsService);
  themeManager = inject(ThemeManager);

  options = this.settings.options;

  langs = [
    { value: 'en-US', name: 'en_us' },
    // { value: 'zh-CN', name: 'zh_cn' },
    // { value: 'zh-TW', name: 'zh_tw' },
    // { value: 'auto', name: 'system' },
    { value: 'it-IT', name: 'it_it' },
  ];

  changeLang(lang: string) {
    this.settings.setLanguage(lang);
  }
}
