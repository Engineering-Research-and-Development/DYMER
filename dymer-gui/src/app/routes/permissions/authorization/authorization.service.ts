import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { AuthorizationRules, JSONResponse } from './authorization.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthConfigService {
  private apiService = inject(ApiService);
  private listAuthConfig = this.apiService.endpoints.permissions.listAuthConfig;
  private createAuthConfig = this.apiService.endpoints.permissions.createAuthConfig;
  private updateAuthConfig = this.apiService.endpoints.permissions.updateAuthConfig;
  private removeAuthConfig = this.apiService.endpoints.permissions.removeAuthConfig;

  constructor(private client: HttpClient) {}

  loadAllConfig(): Observable<JSONResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = this.listAuthConfig;

    return this.client.get<any>(url, { headers, withCredentials: true }).pipe(
      catchError(error => {
        console.error('loadAllConfig Error:', error);
        return throwError(error);
      })
    );
  }

  saveConfigAuthentication(config: AuthorizationRules): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const urlCreate = this.createAuthConfig;
    const urlUpdate = this.updateAuthConfig;

    let method;
    let url;

    if (config._id) {
      method = 'PUT';
      url = urlUpdate(config._id);
    } else {
      method = 'POST';
      url = urlCreate;
    }

    const payload = { ...config };
    delete payload._id;

    console.log(method);
    console.log(method);

    return this.client.request(method, url, { headers, body: payload, withCredentials: true }).pipe(
      catchError(error => {
        console.error('saveConfigAuthentication Error', error);
        return throwError(error);
      })
    );
  }

  removeConfigAuthentication(id: string): any {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = this.removeAuthConfig(id);

    return this.client.delete(url, { headers, withCredentials: true }).pipe(
      catchError(error => {
        console.error('removeConfigAuthentication Error', error);
        return throwError(error);
      })
    );
  }
}
