import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '@core/services/api.service';
import { map, Observable, tap, throwError } from 'rxjs';
import { ModelFile, ModelPage } from './models.interface';

declare function html2json(html: string): any;

@Injectable({
  providedIn: 'root'
})


export class PageService {
  pages = signal<ModelPage[]>([]);
  currentPageId = signal<string | null>(null);
  private apiService = inject(ApiService);

  constructor(private http: HttpClient) {
    this.loadModels();
  }

  private loadModels() {
    const getModelsUrl = this.apiService.endpoints.models.getAllModels;
    const params = {
      query: JSON.stringify({ 'instance._index': { $ne: 'general' } }),
    };

    this.http.get<{ data: ModelPage[] }>(getModelsUrl, { params: params as any, withCredentials: true })
      .pipe(
        map(res => res.data.map(page => {

          const htmlFile = page.files?.find(f => f.contentType === 'text/html');
          const htmlContent = htmlFile?.data ?? '';

          return {
            ...page,
            htmlContent,
            files: page.files ?? []
          };
        }))
      )
      .subscribe({
        next: pages => this.pages.set(pages),
        error: err => console.error('Error loading pages', err)
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

  savePage(title: string, slug: string, description: string, htmlContent: string) {

    const fileName = slug.replace(/[^A-Za-z0-9\.\/]+/g, '-').toLowerCase();
    const formData = new FormData();

    formData.append('data[title]', title);
    formData.append('data[description]', description);
    formData.append('data[name]', fileName);
    formData.append('data[author]', 'Dymer Administrator');
    formData.append('data[posturl]', '');
    formData.append('data[instance][0][_index]', slug);

    const htmlBlob = new Blob([htmlContent], { type: 'text/html' });

    formData.append('file', htmlBlob, fileName + '.html');

    const createUrl = this.apiService.endpoints.models.createModel;

    this.http.post<any>(createUrl, formData, { withCredentials: true })
      .subscribe({
        next: res => {
          const createdItem = res.data[0];
          this.pages.update(pages => [...pages, createdItem]);
          /**/
          this.updateStructure(createdItem._id, htmlContent).subscribe({
            next: r => console.log('Structure created', r),
            error: e => console.error('Error creating structure', e)
          });
          /**/
        },
        error: err => console.error("Error saving page", err)
      });

  }
  /**********************************/
  // updatePage(id: string, htmlContent: string) {
  //     this.pages.update(pages => pages.map(p => p._id === id ? { ...p, htmlContent } : p));
  //     this.saveToStorage();
  //   }
  updatePage(id: string, htmlContent: string) {
    let res_: any;
    const page = this.pages().find(p => p._id === id);
    if (!page) return;

    // trova il file HTML
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

    const url = this.apiService.endpoints.models.updateAttachment;

    this.http.post(url, formData, { withCredentials: true })
      .subscribe({
        next: res => {
          console.log('HTML updated', res);
          /**/
          res_ = res;
          this.updateStructure(id, htmlContent).subscribe({
            next: r => console.log('Structure updated', r),
            error: e => console.error('Structure error', e)
          });
          /**/
          // aggiorna stato locale
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
        error: err => console.error('Error updating HTML', err)
      });
      return res_;
  }
  /**********************************/

  loadPage(id: string): string | undefined {
    const page = this.pages().find(p => p._id === id);
    if (page) {
      this.currentPageId.set(id);
      return page.files?.find(f => f.contentType === 'text/html')?.data;
    }
    return undefined;
  }

  deletePage(id: string) {
    const deleteUrl = this.apiService.endpoints.models.deleteModel(id)

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
  }


  getAttachments(pageId: string): ModelFile[] {
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



  getDefaultPage(): Observable<string> {
    return this.http.get(this.apiService.endpoints.models.defaultPagePath, { responseType: 'text' });
  }

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

    return this.http.post(this.apiService.endpoints.models.createAttachment, formData, { withCredentials: true })
      .pipe(
        tap((res: any) => {

          const newFile: ModelFile = {
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

  saveAttachmentToPage(pageId: string, file: ModelFile) {
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


  updateAttachment(pageId: string, attachmentId: string, content: string, fileName: string, type: 'css' | 'js') {
    const updateUrl = this.apiService.endpoints.models.updateAttachment;

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
    const deleteUrl = this.apiService.endpoints.models.deleteAttachment(pageId, attachmentId);

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

  // Sezione Structure
  generateStructure(html: string): any {
    let filteredHtml = '';
console.log('🧪 HTML IN INGRESSO:', html);
    $(html).find('[dymer-model-element]').each(function () {
      filteredHtml += this.outerHTML;
    });
console.log('🧪 HTML FILTRATO:', filteredHtml);
    return html2json(filteredHtml);
  }

  updateStructure(pageId: string, htmlContent: string) {

    const structure = this.generateStructure(htmlContent);

    const url = this.apiService.endpoints.models.updateStructure;

    const body = {
      data: {
        pageId,
        structure: JSON.stringify(structure)
      }
    };

    return this.http.post(url, body, { withCredentials: true });
  }

  updateModel(modalData: any): Observable<any> {
    const updateUrl = this.apiService.endpoints.models.updateModel;

    const entitytype = (modalData.modelType || '')
      .replace(/[^a-zA-Z]/g, '')
      .toLowerCase();

    const body = {
      data: {
        pageId: modalData.pageId,
        title: modalData.title,
        description: modalData.description,
        instance: [{ _index: entitytype }]
      }
    };

    return this.http.post<any>(updateUrl, body, { withCredentials: true }).pipe(
      tap(res => {

        const updated = res?.data?.[0];
        if (!updated) return;

        this.pages.update(pages =>
          pages.map(p =>
            p._id === modalData.pageId
              ? {
                ...p,
                title: updated.title,
                description: updated.description,
                instance: updated.instance?.[0]?._index || p.instance
              }
              : p
          )
        );
      })
    );
  }


}

