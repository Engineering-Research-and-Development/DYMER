import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, map, of } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { TranslateService } from '@ngx-translate/core';

export interface RawEsEntity {
  _index: string;
  _type: string;
  _id: string;
  _score?: number;
  _source?: Record<string, any>;
  title?: string;
  instance?: {
    title?: string;
    [key: string]: any;
  };
  relations?: { relation_name: string; relation_index: string }[];
  [key: string]: any;
}

export interface GetModelsResponse {
  data: RawEsEntity[];
  success?: boolean;
}
@Injectable({
  providedIn: 'root',
})
export class AddEntityService {
  private apiService = inject(ApiService);
  private translate = inject(TranslateService);
  private baseContextPath = this.apiService.endpoints;
  constructor(private client: HttpClient) {}

  /**
   * Recupera i modelli di form, escludendo l'indice 'general'.
   * @returns Un Observable contenente le relazioni.
   */
  getModels(): Observable<GetModelsResponse> {
    const params = new HttpParams().set('query', JSON.stringify({ 'instance._index': { $ne: 'general' } }));
    return this.client
      .get<GetModelsResponse>(this.apiService.endpoints.addentity.getModels, {
        params,
        withCredentials: true,
      })
      .pipe(
        map(response => {
          if (response && response.data) {
            response.data = response.data.map((model: RawEsEntity) => ({ ...model, title: model.title ?? model.instance?.title ?? model._id }));
          }
          return response;
        }),
        catchError(error => this.handleError(error))
      );
  }

  getRelationships(index: string): Observable<any[]> {
    const queryBody = {
      instance: {
        index: index,
      },
      qoptions: {
        relations: false,
      },
    };

    // Utilizza l'endpoint corretto per la ricerca di entità
    return this.client
      .post<{ data: any[] }>(`${this.apiService.endpoints.dashboard.entitiesSearch}`, queryBody, {
        withCredentials: true,
      }).pipe(
        map(response => {
          if (response && Array.isArray(response.data)) {
            // Appiattisce i dati per renderli consistenti, estraendo _source
            return response.data.map(entity => {
              const newEntity = { ...entity };
              if (newEntity._source) {
                Object.assign(newEntity, newEntity._source);
                delete newEntity._source;
              }
              // Assicura che ci sia un titolo per la visualizzazione nella select
              newEntity.title = newEntity.title ?? newEntity._id;
              return newEntity;
            });
          }
          return [];
        }),
        catchError(error => {
          console.error(`Error loading relationships for index ${index}`, error);
          return of([]);
        })
      );
  }
  private handleError(error: HttpErrorResponse) {
    let errorMessage = this.translate.instant('errors.unknown');
    if (error.error instanceof ErrorEvent) {
      errorMessage = this.translate.instant('errors.generic', { message: error.error.message });
    } else {
      errorMessage = this.translate.instant('errors.http', { status: error.status, message: error.message });
      if (error.error && typeof error.error === 'string') {
        errorMessage += this.translate.instant('errors.detail', { detail: error.error });
      } else if (error.error && error.error.message) {
        errorMessage += this.translate.instant('errors.detail', { detail: error.error.message });
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Recupera l'HTML del form per un dato modello.
   * @param modelId L'ID del modello.
   * @returns Un Observable con l'HTML del form come stringa.
   */
  getModelHtml(modelId: string): Observable<string> {
    return this.client.get(this.apiService.endpoints.addentity.getModelHtml(modelId), {
      responseType: 'text',
      withCredentials: true,
    }).pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Creates a new entity using multipart/form-data.
   * @param entityPath The path for the entity creation endpoint (e.g., 'entity_type/sub_action').
   * @param formData The FormData object containing the entity data.
   * @returns An Observable of the HTTP response.
   */
  createEntity(entityPath: string, formData: FormData): Observable<any> {
    const pathParts = entityPath.split('/');
    const index = pathParts[pathParts.length - 1];
    const createUrl = this.baseContextPath.addentity.createEntity(index);
    return this.client.post(createUrl, formData, {
      withCredentials: true,
    }).pipe(catchError(error => this.handleError(error)));
  }
}
