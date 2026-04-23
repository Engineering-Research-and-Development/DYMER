import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EditorService {
  private htmlEditor: HTMLTextAreaElement | null = null;
  private cssEditor: HTMLTextAreaElement | null = null;

  initHtmlEditor(selector: string): void {
    this.htmlEditor = document.querySelector(selector);
  }

  initCssEditor(selector: string): void {
    this.cssEditor = document.querySelector(selector);
  }

  setHtmlContent(content: string): void {
    if (this.htmlEditor) this.htmlEditor.value = content;
  }

  getHtmlContent(): string {
    return this.htmlEditor?.value ?? '';
  }

  setCssContent(content: string): void {
    if (this.cssEditor) this.cssEditor.value = content;
  }

  getCssContent(): string {
    return this.cssEditor?.value ?? '';
  }
}