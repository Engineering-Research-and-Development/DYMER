import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '@core/services/api.service';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import { PageTemplate, TemplateFile } from './templates.interface'

@Injectable({
  providedIn: 'root'
})

export class PageService {
  pages = signal<PageTemplate[]>([]);
  currentPageId = signal<string | null>(null);
  private apiService = inject(ApiService);

  constructor(private http: HttpClient) {
    this.loadTemplates();

  }

  private loadTemplates() {
    const getTemplatesUrl = this.apiService.endpoints.templates.getAllTemplates;

    this.http.get<{ data: PageTemplate[] }>(getTemplatesUrl, { withCredentials: true })
      .pipe(
        map(res => res.data)
      )
      .subscribe({
        next: templates => this.pages.set(templates),
        error: err => console.error('Error loading templates:', err)
      });
  }

  private saveToStorage() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('vvvebjs-lite-pages', JSON.stringify(this.pages()));
    }
  }
  getPages() {
    return this.pages();
  }


  savePage(
    title: string,
    slug: string,
    description: string,
    htmlContent: string,
    viewtype: string = 'standard',
    model: string
  ) {

    const fileName = slug.replace(/[^A-Za-z0-9\.\/]+/g, '-').toLowerCase();

    const formData = new FormData();

    formData.append('data[title]', title);
    formData.append('data[description]', description);
    formData.append('data[name]', fileName);
    formData.append('data[author]', 'Dymer Administrator');
    formData.append('data[posturl]', '');
    formData.append('data[instance][0][_index]', model);
    formData.append('data[viewtype][0][rendertype]', viewtype);

    const htmlBlob = new Blob([htmlContent], { type: 'text/html' });

    formData.append('file', htmlBlob, fileName + '.html');

    const createUrl = this.apiService.endpoints.templates.createTemplate;

    this.http.post<any>(createUrl, formData, { withCredentials: true })
      .subscribe({
        next: (res) => {
          const createdTemplate: PageTemplate = res?.data?.[0];

          if (!createdTemplate) {
            console.warn("No template returned from backend");
            return;
          }
          this.pages.update(pages => [...pages, createdTemplate]);
        },
        error: (err) => {
          console.error("Error saving template", err);
        }
      });

  }

    getAttachments(pageId: string): TemplateFile[] {
      const page = this.pages().find(p => p._id === pageId);
      if (!page) return [];
  
      console.groupEnd()
      const filtered = page.files?.filter(f =>
        f.contentType === 'text/css' ||
        f.contentType === 'text/javascript' ||
        f.contentType === 'application/javascript' ||
        f.contentType === 'css' ||
        f.contentType === 'js'
      ) ?? [];
  
      return filtered;
    }

  getViewTypeTemplate(viewtype: string, model: string, autogen: boolean = false): Observable<string> {
    const typeTemplate = (viewtype || '').trim().toLowerCase();

    if (typeTemplate === 'fullcontent' && autogen) {
      const url = this.apiService.endpoints.templates.fullAutoGenOPath(model);
      return this.http.get(url, { responseType: 'text' });
    }

    const pathMap: Record<string, string> = {
      fullcontent: this.apiService.endpoints.templates.fullContentPagePath,
      teaser: this.apiService.endpoints.templates.teaserPagePath,
      teaserlist: this.apiService.endpoints.templates.teaserListPagePath,
      teasermap: this.apiService.endpoints.templates.teaserMapPagePath
    };

    const url = pathMap[typeTemplate] ?? this.apiService.endpoints.templates.fullContentPagePath;

    return this.http.get(url, { responseType: 'text' });
  }


  // updatePage(id: string, htmlContent: string) {
  //   this.pages.update(pages => pages.map(p => p._id === id ? { ...p, htmlContent } : p));
  //   this.saveToStorage();
  // }
  updatePage(id: string, htmlContent: string) {

  const page = this.pages().find(p => p._id === id);
  if (!page) return;

  console.log("PAGE => ", page)
  const htmlFile = page.files.find(f => f.contentType === 'text/html');

  if (!htmlFile) {
    console.error('HTML file not found');
    return;
  }

  const formData = new FormData();

  const file = new File(
    [new Blob([htmlContent])],
    htmlFile.filename,
    { type: htmlFile.contentType }
  );

  formData.append('data[file]', file);
  formData.append('data[pageId]', id);
  formData.append('data[assetId]', htmlFile._id);

  const url = this.apiService.endpoints.templates.updateAttachment;

  this.http.post(url, formData, { withCredentials: true })
    .subscribe({
      next: res => {
        console.log('Template HTML updated', res);

        this.pages.update(pages =>
          pages.map(p =>
            p._id === id
              ? {
                  ...p,
                  files: p.files.map(f =>
                    f._id === htmlFile._id
                      ? { ...f, data: htmlContent }
                      : f
                  )
                }
              : p
          )
        );
      },
      error: err => console.error('Error updating template', err)
    });
}

  loadPage(id: string): string | undefined {
    const page = this.pages().find(p => p._id === id);
    if (page) {
      this.currentPageId.set(id);
      return page.files?.find(f => f.contentType === 'text/html')?.data;
      // return page.htmlContent;
    }
    return undefined;
  }

  deletePage(id: string) {
    const deleteUrl = this.apiService.endpoints.templates.deleteTemplate(id)

    this.http.delete(deleteUrl, { withCredentials: true }).subscribe({
      next: () => {
        this.pages.update(pages => pages.filter(p => p._id !== id));

        if (this.currentPageId() === id) {
          this.currentPageId.set(null);
        }
      },
      error: (err) => {
        console.error("Error deleting page", err);
      }
    });
    // this.saveToStorage();
  }

  // attachFile(pageId: string, fileData: { type: 'js' | 'css', name: string, content?: string, file?: File }) {
  //   console.log('Mock REST call to save file to Mongo:', { pageId, ...fileData });
  //   // In a real app, this would be:
  //   // return this.http.post(`/api/pages/${pageId}/assets`, fileData);
  //   return Promise.resolve({ success: true });
  // }
  attachFile(pageId: string, fileData: { type: 'js' | 'css', name: string, content?: string, file?: File }, actionType: 'create' | 'upload') {
      const formData = new FormData();
  
      formData.append('data[pageId]', pageId);
      formData.append('data[ctype]', fileData.type);
      formData.append('data[filename]', fileData.name);
  
      if (actionType === 'upload' && fileData.file) {
        // caso Upload
        formData.append('data[file]', fileData.file, fileData.name);
      } else if (actionType === 'create' && fileData.content !== undefined) {
        // caso Create
        const mimeType = fileData.type === 'css' ? 'text/css' : 'application/javascript';
        const blob = new Blob([fileData.content], { type: mimeType });
  
        formData.append('data[file]', blob, fileData.name);
      }
  
      return this.http.post(this.apiService.endpoints.templates.createAttachment, formData, { withCredentials: true })
        .pipe(
          tap((res: any) => {
  
            const newFile: TemplateFile = {
              _id: res.files,
              filename: fileData.name,
              contentType: fileData.type === 'css' ? 'text/css' : 'application/javascript',
              data: fileData.content || '',
              md5: '',
              length: fileData.content?.length || fileData.file?.size || 0,
              uploadDate: new Date().toISOString()
            };
  
            this.saveAttachmentToPage(pageId, newFile);
          })
        );
    }

      saveAttachmentToPage(pageId: string, file: TemplateFile) {
        this.pages.update(pages => pages.map(p => {
          if (p._id === pageId) {
            return {
              ...p,
              files: [...(p.files || []), file]
            };
          }
          return p;
        }));
    
        this.saveToStorage();
      }

  getMergedModels(): Observable<string[]> {
    return this.http.get<any>(this.apiService.endpoints.models.getAllModels, {
      params: {
        query: JSON.stringify({ 'instance._index': { $ne: 'entity_relation' } })
      },
      withCredentials: true
    }).pipe(

      switchMap(formRes => {

        const indexWithModel = formRes.data;
        const listIndex: string[] = [];

        indexWithModel.forEach((element: any) => {
          element.instance.forEach((el: any) => {
            if (el._index !== 'general' && el._index !== 'entity_relation') {
              listIndex.push(el._index);
            }
          });
        });

        return this.http.get<any>(this.apiService.endpoints.templates.getAllIndexes, { withCredentials: true }).pipe(

          map(entityRes => {

            const allindex = entityRes.data;

            for (const [key] of Object.entries(allindex)) {
              if (!listIndex.includes(key) && key !== 'general' && key !== 'entity_relation') {
                listIndex.push(key);
              }
            }

            return listIndex;
          })
        );

      }),

      catchError(err => {
        console.error('Error loading merged models:', err);
        return of([]);
      })
    );
  }

  updateAttachment(pageId: string, attachmentId: string, content: string, fileName: string, type: 'css' | 'js') {
    const updateUrl = this.apiService.endpoints.templates.updateAttachment;

    const formData = new FormData();

    const mimeType = type === 'css' ? 'text/css' : 'application/javascript';

    const blob = new Blob([content], { type: mimeType });
    const file = new File([blob], fileName, { type: mimeType });

    formData.append('data[file]', file);
    formData.append('data[pageId]', pageId);
    formData.append('data[assetId]', attachmentId);

    return this.http.post(updateUrl, formData, { withCredentials: true })
      .pipe(
        tap(() => {
          this.pages.update(pages => pages.map(p => {
            if (p._id === pageId) {
              return {
                ...p,
                files: (p.files || []).map(f =>
                  f._id === attachmentId
                    ? { ...f, data: content }
                    : f
                )
              };
            }
            return p;
          }));
        })
      );
  }

  deleteAttachment(pageId: string, attachmentId: string) {
    const deleteUrl = this.apiService.endpoints.templates.deleteAttachment(pageId, attachmentId);

    return this.http.delete(deleteUrl, { withCredentials: true }).pipe(
      tap(() => {
        this.pages.update(pages => pages.map(p => {
          if (p._id === pageId) {
            return {
              ...p,
              files: (p.files || []).filter(f => f._id !== attachmentId)
            };
          }
          return p;
        }));

        this.saveToStorage();
      })
    );
  }

  /**/
  updateTemplate(modalData: any): Observable<any> {
  const updateUrl = this.apiService.endpoints.templates.updateTemplate;

  const entitytype = (modalData.modelType || '')
    .replace(/[^a-zA-Z]/g, '')
    .toLowerCase();

  const body = {
    data: {
      pageId: modalData.pageId,
      title: modalData.title,
      description: modalData.description,

      // 🔥 template-specific
      instance: [{ _index: entitytype }],
      viewtype: [{ rendertype: modalData.viewtype }]
    }
  };

  return this.http.post<any>(updateUrl, body, { withCredentials: true });
}
  /**/

}
