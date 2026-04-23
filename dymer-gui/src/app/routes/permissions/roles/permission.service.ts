import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, switchMap, throwError } from 'rxjs';
import { Permissions } from './permission.interface';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private apiService = inject(ApiService);
  private permissionList = this.apiService.endpoints.permissions.list
  private availableEntities = this.apiService.endpoints.permissions.form
  constructor(private client: HttpClient) {}

  getPermissions(): Observable<any> {
    return this.client.get<Permissions[]>(this.permissionList).pipe(
      catchError(error => {
        console.error('getPermissions Error:', error);
        return throwError(error);
      })
    );
  }

  getAvailableEntities(): Observable<any> {
    const params = new HttpParams().set(
      'query',
      JSON.stringify({ 'instance._index': { $ne: 'general' } })
    );
    return this.client
      .get<any>(this.availableEntities, { params, withCredentials: true })
      .pipe(
        catchError(error => {
          console.error('getAvailableEntities Error:', error);
          return throwError(error);
        })
      );
  }

  getProcessedPermissions(baseroleform: Permissions): Observable<Permissions[]> {
    return this.getPermissions().pipe(
      switchMap(permissions =>
        this.getAvailableEntities().pipe(
          map(availableEntities => {
            const entities = availableEntities.data.map((value: any) => value.instance[0]._index);
            return permissions.data.map((perm: any) => ({
              ...perm,
              entities,
              elements: entities.map((entity: string) => ({
                entity,
                functions: Object.entries(baseroleform.perms.entities).map(([key, operations]) => ({
                  operations: key, // Usa la chiave come "operations"
                  checked: perm.perms.entities[key]?.includes(entity) ?? false,
                })),
              })),
            }));
          })
        )
      ),
      catchError(error => {
        console.error('getProcessedPermissions Error:', error);
        return throwError(error);
      })
    );
  }

  saveConfigRules(formData: Permissions): Observable<{ message: string }> {
    return this.client.post<{ message: string }>(this.permissionList, { data: formData}, {withCredentials: true }).pipe(
      catchError(error => {
        console.error('saveConfigRules Error:', error);
        return throwError(error);
      })
    );
  }

  removeRole(roleId: string): Observable<{ message: string }> {
    return this.client.delete<{ message: string }>(`${this.permissionList}${roleId}`, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('removeRole Error:', error);
        return throwError(error);
      })
    );
  }

  saveRole(role: Permissions): Observable<{ message: string }> {
    return this.client.post<{ message: string }>(`${this.permissionList}${role._id ?? ''}`, {
      data: role }, {withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('saveRole Error:', error);
        return throwError(error);
      })
    );
  }
}
