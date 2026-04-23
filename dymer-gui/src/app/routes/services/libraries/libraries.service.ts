import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { ApiService } from '@core/services/api.service';

export interface Library {
  _id?: string;
  name: string;
  domtype: 'link' | 'script';
  useonload: boolean;
  filename: string;
  callback: string;
  group: string;
  loadtype: 'view' | 'map' | 'form';
  mandatory: boolean;
  type?: 'Javascript' | 'CSS';
  activated?: boolean;
  isPendingAction?: boolean;
}

export interface FileUploadResponse {
  success: boolean;
  data: string;
}

/** Interfaccia generica per le risposte standard dell'API */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface SetConfigResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    servicetype: 'insert' | 'update' | 'delete' | 'get';
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class LibrariesService {
  private apiService = inject(ApiService);
  constructor(private client: HttpClient) {}

  getCustomLibraries(): Observable<Library[]> {
    return this.client.get<Library[]>(this.apiService.endpoints.libraries.getAllLibraries, { withCredentials: true });
  }

  reloadLibraries(): Observable<any> {
    return this.client.post<any>(this.apiService.endpoints.libraries.reloadLibraries, {}, { withCredentials: true });
  }

  addLibrary(library: Library, file: File): Observable<any> {
    // Step 1: Upload the file
    const fileUploadData = new FormData();
    fileUploadData.append('file', file);
    fileUploadData.append('path', library.filename);

    return this.client.post<FileUploadResponse>(this.apiService.endpoints.libraries.uploadFile, fileUploadData, { withCredentials: true }).pipe(
      switchMap(uploadResponse => {
        if (uploadResponse && uploadResponse.data) {
          // Step 2: Create the library metadata with the updated filename
          const updatedLibrary = { ...library };
          updatedLibrary.filename += `/${uploadResponse.data}`;
          if (/^\s*$/.test(updatedLibrary.callback)) {
            updatedLibrary.callback = '';
          }
          return this.client.post<any>(this.apiService.endpoints.libraries.getAllLibraries, updatedLibrary, { withCredentials: true });
        } else {
          throw new Error('File upload failed: invalid response from server.');
        }
      })
    );
  }

  updateLibraryStatus(id: string, activated: boolean): Observable<any> {
    const url = this.apiService.endpoints.libraries.libraryById(id);
    return this.client.patch<any>(url, { activated }, { withCredentials: true });
  }

  deleteLibrary(id: string): Observable<any> {
    const url = this.apiService.endpoints.libraries.libraryById(id);
    return this.client.delete<any>(url, { withCredentials: true });
  }
}
