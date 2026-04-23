import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, of, map } from 'rxjs';
import { ApiService } from '@core/services/api.service'; 

export interface Vocabulary {
  _id?: string;
  title: string;
  description: string;
  nodes?: any[];
  [key: string]: any;
}

export interface VocabularyResponse {
  data: Vocabulary | null;
  success?: boolean;
  message?: string;
}

export interface VocabulariesResponse {
  data: Vocabulary[];
  success?: boolean;
  message?: string;
}

export interface VocabularyUpdatePayload {
  id: string;
  data: any[];
}

@Injectable({
  providedIn: 'root',
})
export class TaxonomyService {
  private apiService = inject(ApiService);
  constructor(private client: HttpClient) {}

  getVocabularies(): Observable<VocabulariesResponse> {
    const params = new HttpParams().set(
      'query',
      JSON.stringify({ 'instance._index': { $eq: 'general' } })
    );
    return this.client
      .get<VocabulariesResponse>(this.apiService.endpoints.taxonomy.getVocabularies, { params, withCredentials: true })
      ;
  }

  getVocabularyByTitle(title: string): Observable<VocabularyResponse> {
    return this.client
      .get<VocabularyResponse>(`${this.apiService.endpoints.taxonomy.getVocabularyByTitle}${title}`, {
        withCredentials: true,
      })
      ;
  }

  deleteVocabulary(id: string): Observable<any> {
    return this.client
      .delete(this.apiService.endpoints.taxonomy.getVocabularyById(id), {
        withCredentials: true,
      });
  }

  getRemoteVocabularyByTitle(sourcePath: string, title: string): Observable<VocabularyResponse> {
    return this.client
      .get<VocabularyResponse>(`${sourcePath}`+this.apiService.endpoints.taxonomy.getRemoteVocabulary+`${title}`)
      ;
  }

  createVocabulary(vocabulary: { title: string; description: string }): Observable<VocabularyResponse> {
    return this.client
      .post<VocabularyResponse>(this.apiService.endpoints.taxonomy.updateVocabulary, vocabulary, {
        withCredentials: true,
      })
      ;
  }

  updateVocabularyNodes(payload: VocabularyUpdatePayload): Observable<any> {
    return this.client.put(this.apiService.endpoints.taxonomy.updateVocabulary, payload, { withCredentials: true });
  }

  uploadCsv(file: File): Observable<string[]> {
    const formData = new FormData();
    formData.append('file', file);

    return this.client.post<string[]>(this.apiService.endpoints.taxonomy.csvToJson, formData, {
        withCredentials: true,
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Service: uploadCsv failed with HTTP error:', error);
        return throwError(() => new Error(`CSV Upload Failed: ${error.status} - ${error.message}`));
      })
    );
  }
}
