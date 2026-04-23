import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SectionTreeService {
  getSectionsFromDocument(doc: Document): HTMLElement[] {
    return Array.from(doc.body.querySelectorAll('section, header, footer, main, nav'));
  }

  getBreadcrumbTrail(element: HTMLElement): string[] {
    const trail: string[] = [];
    let current: HTMLElement | null = element;
    while (current && current.tagName !== 'BODY') {
      trail.push(current.tagName.toLowerCase());
      current = current.parentElement;
    }
    return trail.reverse();
  }
}