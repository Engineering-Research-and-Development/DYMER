import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { DymerUser, JSONResponse } from './dymer-user.interface';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root',
})
export class DymerUserService {
  private apiService = inject(ApiService);
  private listUserUrl = this.apiService.endpoints.permissions.listUsers;
  private addUser = this.apiService.endpoints.permissions.addUser;
  private removeUser = this.apiService.endpoints.permissions.removeUser;
  private updateUser = this.apiService.endpoints.permissions.updateUser;

  constructor(private client: HttpClient) {}

  loadAllConfig(): Observable<JSONResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = this.listUserUrl;

    return this.client.get<JSONResponse>(url, { headers, withCredentials: true }).pipe(
      catchError(error => {
        console.error('loadAllConfig Error:', error);
        return throwError(error);
      })
    );
  }

  saveConfigDUser(dataPost: DymerUser): any {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = this.addUser;

    return this.client.post(url, dataPost, { headers, withCredentials: true }).pipe(
      catchError(error => {
        console.error('saveConfigDUser Error', error);
        return throwError(error);
      })
    );
  }

  removeConfigDUser(id: string): any {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = this.removeUser(id);

    return this.client.delete(url, { headers, withCredentials: true }).pipe(
      catchError(error => {
        console.error('removeConfigDUser Error', error);
        return throwError(error);
      })
    );
  }

  editConfigDUser(user: any): Observable<any> {
  const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  const url = this.updateUser(user._id);
  return this.client.put(url, user, { headers, withCredentials: true }).pipe(
    catchError(error => {
      console.error('editConfigDUser Error', error);
      return throwError(error);
    })
  );
}
}
