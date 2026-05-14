import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-branding',
  template: `
    <a class="branding" href="/">
      <img src="images/dymer_logo_d.png" class="branding-logo" alt="DYMER" />
      @if (showName) {
        <span class="branding-name">DYMER</span>
      }
    </a>
  `,
  styles: `
    .branding {
      display: flex;
      align-items: center;
      margin: 0 0.5rem;
      text-decoration: none;
      white-space: nowrap;
      color: inherit;
      border-radius: 50rem;
    }

    .branding-logo {
      width: 2.5rem;
      height: 2.5rem;
      
    }

    .branding-name {
      margin: 0 0.5rem;
      font-size: 1rem;
      font-weight: 500;
      color: #3d85c6;
    }
  `,
})
export class BrandingComponent {
  @Input() showName = true;
}
