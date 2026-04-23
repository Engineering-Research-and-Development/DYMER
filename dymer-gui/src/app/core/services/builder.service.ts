import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BuilderService {
  private iframe!: HTMLIFrameElement;
  private frameDocument!: Document;

  init(url: string, callback?: () => void): void {
    this.iframe = document.querySelector('#iframe-wrapper iframe')!;
    this.iframe.src = `${url}?r=${Math.random()}`;
    this.iframe.onload = () => {
      this.frameDocument = this.iframe.contentDocument!;
      callback?.();
    };
  }

  getHtml(): string {
    return this.frameDocument.documentElement.innerHTML;
  }

  setHtml(html: string): void {
    this.frameDocument.documentElement.innerHTML = html;
  }

  getBody(): string {
    return this.frameDocument.body.innerHTML;
  }

  scrollToTop(): void {
    this.iframe.contentWindow?.scrollTo(0, 0);
  }
}