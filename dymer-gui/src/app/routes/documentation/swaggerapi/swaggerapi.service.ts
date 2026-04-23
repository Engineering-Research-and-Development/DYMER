import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';

@Injectable()
export class SwaggerApiService {

  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) { }

  public getSwaggerDocUrl(): Observable<any> {
    const endpoint = this.apiService.endpoints.documentation.swagger;
    return this.http.get(endpoint, { withCredentials: true });
  }
}