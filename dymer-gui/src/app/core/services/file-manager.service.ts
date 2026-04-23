import { Injectable } from '@angular/core';

export interface PageModel {
  name: string;
  title: string;
  url: string;
  html: { id: string; name: string; content: string };
  assets: any[];
  instance?: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class FileManagerService {
  private pages: Record<string, PageModel> = {};
  private currentPage: string | null = null;

  addPage(name: string, data: PageModel): void {
    this.pages[name] = data;
  }

  deletePage(name: string): void {
    delete this.pages[name];
  }

  getPage(name: string): PageModel | undefined {
    return this.pages[name];
  }

  setCurrentPage(name: string): void {
    this.currentPage = name;
  }

  getCurrentPage(): string | null {
    return this.currentPage;
  }

  getAllPages(): PageModel[] {
    return Object.values(this.pages);
  }
}