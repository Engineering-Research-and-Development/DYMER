import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StyleManagerService {
  private styleElement: HTMLStyleElement | null = null;

  init(doc: Document): void {
    this.styleElement = doc.getElementById('vvvebjs-styles') as HTMLStyleElement;
    if (!this.styleElement) {
      this.styleElement = doc.createElement('style');
      this.styleElement.id = 'vvvebjs-styles';
      doc.head.appendChild(this.styleElement);
    }
  }

  setCss(css: string): void {
    if (this.styleElement) this.styleElement.innerHTML = css;
  }

  getCss(): string {
    return this.styleElement?.innerHTML ?? '';
  }
}
