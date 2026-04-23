import { Injectable, signal } from '@angular/core';

export interface Page {
  id: string;
  name: string;
  slug: string;
  description: string;
  htmlContent: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PageService {
  pages = signal<Page[]>([]);
  currentPageId = signal<string | null>(null);

  constructor() {
    this.loadFromStorage();
    if (this.pages().length === 0) {
      // Seed with default data if empty
      this.pages.set([
        { 
          id: '1', 
          name: 'Home Page', 
          slug: 'index',
          description: 'The main landing page',
          htmlContent: '<div class="container mx-auto p-4"><h1>Home Page</h1><p>Welcome!</p></div>', 
          createdAt: new Date() 
        },
        { 
          id: '2', 
          name: 'About Us', 
          slug: 'about',
          description: 'Company information',
          htmlContent: '<div class="container mx-auto p-4"><h1>About Us</h1><p>We are a great team.</p></div>', 
          createdAt: new Date() 
        }
      ]);
      this.saveToStorage();
    }
  }

  private loadFromStorage() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('vvvebjs-lite-pages');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Convert date strings back to Date objects
          this.pages.set(parsed.map((p: Page) => ({ ...p, createdAt: new Date(p.createdAt) })));
        } catch (e) {
          console.error('Failed to load pages from storage', e);
        }
      }
    }
  }

  private saveToStorage() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('vvvebjs-lite-pages', JSON.stringify(this.pages()));
    }
  }

  getPages() {
    return this.pages();
  }

  savePage(name: string, slug: string, description: string, htmlContent: string) {
    const newPage: Page = {
      id: Date.now().toString(),
      name,
      slug,
      description,
      htmlContent,
      createdAt: new Date()
    };
    this.pages.update(pages => [...pages, newPage]);
    this.saveToStorage();
  }

  updatePage(id: string, htmlContent: string) {
    this.pages.update(pages => pages.map(p => p.id === id ? { ...p, htmlContent } : p));
    this.saveToStorage();
  }

  loadPage(id: string): string | undefined {
    const page = this.pages().find(p => p.id === id);
    if (page) {
      this.currentPageId.set(id);
      return page.htmlContent;
    }
    return undefined;
  }
  
  deletePage(id: string) {
    this.pages.update(pages => pages.filter(p => p.id !== id));
    if (this.currentPageId() === id) {
      this.currentPageId.set(null);
    }
    this.saveToStorage();
  }

  attachFile(pageId: string, fileData: { type: 'js' | 'css', name: string, content?: string, file?: File }) {
    console.log('Mock REST call to save file to Mongo:', { pageId, ...fileData });
    // In a real app, this would be:
    // return this.http.post(`/api/pages/${pageId}/assets`, fileData);
    return Promise.resolve({ success: true });
  }
}
