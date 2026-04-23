import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiService } from '@core/services/api.service'; 
export interface RawEsEntity {
  _index: string;
  _type: string;
  _id: string;
  _score?: number;
  _source?: Record<string, any>;
  relations?: RawEsEntity[];
  [key: string]: any;
}
export interface GetAllEntitiesResponse {
  data: RawEsEntity[];
  success?: boolean; 
}
@Injectable({
  providedIn: 'root',
})
export class RelationsService {
  private apiService = inject(ApiService);
  private baseContextPath = this.apiService.endpoints;
  constructor(private client: HttpClient) {}
  /**
   * @param entities
   * @returns
   */
  getAllEntities(): Observable<GetAllEntitiesResponse> {
    const body = {
      query: {
        query: {
          bool: {
            must_not: {
              match: {
                _index: 'entity_relation',
              },
            },
          },
        },
      },
      qoptions: {
        relations: false,
        fields: { include: ['title'] },
      },
    };
    return this.client.post<GetAllEntitiesResponse>(this.apiService.endpoints.dashboard.entitiesSearch, body, {
      withCredentials: true,
    });
  }

  /**
   * Recupera tutte le entità di tipo relazione.
   * @returns Un Observable contenente le relazioni.
   */
  getRelations(): Observable<GetAllEntitiesResponse> {
    const body = {
      query: {
        query: {
          bool: {
            must: {
              match: {
                _index: 'entity_relation',
              },
            },
          },
        },
      },
      qoptions: {
        relations: false,
        sort: ['_index1.keyword:asc'],
      },
    };
    return this.client.post<GetAllEntitiesResponse>(this.apiService.endpoints.dashboard.entitiesSearch, body, {
      withCredentials: true,
    }).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Si è verificato un errore sconosciuto!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Errore: ${error.error.message}`;
    } else {
      errorMessage = `Codice Errore: ${error.status}\nMessaggio: ${error.message}`;
      if (error.error && typeof error.error === 'string') {
        errorMessage += `\nDettaglio: ${error.error}`;
      } else if (error.error && error.error.message) {
        errorMessage += `\nDettaglio: ${error.error.message}`;
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Aggiorna una singola relazione per un'entità specifica.
   * @param entityId Il ID dell'entità da aggiornare.
   * @param relationData I dati della relazione da aggiornare.
   * @returns Un Observable della risposta HTTP.
   */
  updateSingleRelation(entityId: string, relationData: any): Observable<any> {
    return this.client
      .put(`${this.apiService.endpoints.relations.singleRelation}/${entityId}`, relationData, {
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Elimina una singola relazione per un'entità specifica.
   * @param entityId L'ID dell'entità da cui eliminare la relazione.
   * @param relationData La relazione da eliminare.
   * @returns Un Observable della risposta HTTP.
   */
  deleteSingleRelationById(entityId: string, relationData: any): Observable<any> {
    return this.client.delete(`${this.apiService.endpoints.relations.singleRelation}/${entityId}`, {
      body: relationData,
      withCredentials: true,
    }).pipe(catchError(this.handleError));
  }
  
  /**
   * Crea una nuova singola relazione.
   * @param relationData I dati della relazione da creare.
   * @returns Un Observable della risposta HTTP.
   */
  createSingleRelation(relationData: any): Observable<any> {
    return this.client.post(`${this.apiService.endpoints.relations.singleRelation}`, relationData, {
      withCredentials: true,
    }).pipe(catchError(this.handleError));
  }
}
