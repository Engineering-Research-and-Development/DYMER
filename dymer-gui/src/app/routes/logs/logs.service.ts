import { catchError, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import { JSONResponse } from './logs.interface';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class LogsService {
  private apiService = inject(ApiService);

  constructor(private client: HttpClient) {}

  logTypes(): Observable<JSONResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = this.apiService.endpoints.logs.logTypes;

    return this.client.get(url, { headers, withCredentials: true }) as Observable<JSONResponse>;
  }

  checkService(): Observable<JSONResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = this.apiService.endpoints.logs.checkGeneralService;

    return this.client.get(url, { headers, withCredentials: true }) as Observable<JSONResponse>;
  }

  checkEntitiesService(): Observable<JSONResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = this.apiService.endpoints.logs.checkEntities;

    return this.client.get(url, { headers, withCredentials: true }) as Observable<JSONResponse>;
  }

  getEntitiesUUID(): Observable<JSONResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = this.apiService.endpoints.dashboard.uuid;

    return this.client.get(url, { headers, withCredentials: true }) as Observable<JSONResponse>;
  }
  mongoEntitiesState(): Observable<JSONResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = this.apiService.endpoints.logs.mongoEntitiesState;

    return this.client.get(url, { headers, withCredentials: true }) as Observable<JSONResponse>;
  }

  elasticEntitiesState(): Observable<JSONResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = this.apiService.endpoints.logs.elasticEntitiesState;

    return this.client.get(url, { headers, withCredentials: true }) as Observable<JSONResponse>;
  }

  redisEntitiesState(): Observable<JSONResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = this.apiService.endpoints.logs.redisEntitiesState;

    return this.client.get(url, { headers, withCredentials: true }) as Observable<JSONResponse>;
  }

  checkServices(): Observable<JSONResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = this.apiService.endpoints.logs.checkServices;

    return this.client.get(url, { headers, withCredentials: true }) as Observable<JSONResponse>;
  }

  mongoServicesState(): Observable<JSONResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = this.apiService.endpoints.logs.mongoServicesState;

    return this.client.get(url, { headers, withCredentials: true }) as Observable<JSONResponse>;
  }

  checkFormsService(): Observable<JSONResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = this.apiService.endpoints.logs.checkForms;

    return this.client.get(url, { headers, withCredentials: true }) as Observable<JSONResponse>;
  }

  mongoFormsService(): Observable<JSONResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = this.apiService.endpoints.logs.mongoFormsState;

    return this.client.get(url, { headers, withCredentials: true }) as Observable<JSONResponse>;
  }

  checkTemplatesService(): Observable<JSONResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = this.apiService.endpoints.logs.checkTemplates;

    return this.client.get(url, { headers, withCredentials: true }) as Observable<JSONResponse>;
  }

  mongoTemplatesState(): Observable<JSONResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = this.apiService.endpoints.logs.mongoTemplatesState;

    return this.client.get(url, { headers, withCredentials: true }) as Observable<JSONResponse>;
  }

  getPathOpLog(pathOpLog: string): Observable<any> {

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const baseUrl = `${environment.backend.baseUrl}` + `${environment.backend.contextPath}`;
    const url = baseUrl + pathOpLog;

    return this.client.get(url, { headers, withCredentials: true, responseType: 'text' });
  }

  saveConfigLog(opnconf: any): Observable<{ message: string }> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = this.apiService.endpoints.logs.setLogConfig

    return this.client.post<{ message: string }>(url, { data: opnconf, withCredentials: true }).pipe(
      catchError(error => {
        console.error('saveConfigRules Error:', error);
        return throwError(error);
      })
    );
  }

  /* AC Multitenancy start */

  multitenancyState(): Observable<JSONResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = this.apiService.endpoints.logs.multitenancyState;
    return this.client.get(url, { headers, withCredentials: true }) as Observable<JSONResponse>;
  }
  /* AC Multitenancy end */
}
