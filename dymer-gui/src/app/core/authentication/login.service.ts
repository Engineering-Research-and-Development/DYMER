import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, lastValueFrom, map, Observable, of, tap, throwError } from 'rxjs';

import { Menu } from '@core';
import { Token, User } from './interface';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private apiService = inject(ApiService);

  protected readonly http = inject(HttpClient);

  protected readonly authURL = this.apiService.endpoints.login.login;
  //protected readonly authRefreshURL = this.apiService.endpoints.login.refresh;
  protected readonly userURL = this.apiService.endpoints.login.userInfo;
  
  login(username: string, password: string) {
    //return this.http.post<Token>('/auth/login', { username, password, rememberMe });
    return this.http.post<Token>(this.authURL, { username, password });
  }

  //TODO build auth/refresh in BE
  /*refresh(params: Record<string, any>) {
    //return this.http.post<Token>('/auth/refresh', params);
    return this.http.post<Token>(this.authRefreshURL, params);
  }*/

  logout() {
    //return this.http.post<any>('/auth/logout', {});
    return of({});
  }

  user(): Observable<User> {
    return this.http.get<{ data: any[] }>(this.userURL, { withCredentials: true }).pipe(
      map(response => {
        //console.log("user response: ", response);
        if (!Array.isArray(response.data) || response.data.length === 0) {
          throw new Error('No permission');
        }
        const user = response.data[0];
        return {
          id: user.id,
          name: user.username,
          email: user.email,
          avatar: 'images/admin-avatar.png',
        } as User;
      })
    );
  }

  menu() {
    //return this.http.get<{ menu: Menu[] }>('/user/menu').pipe(map(res => res.menu));
    return this.http
      .get<{ menu: Menu[] }>('data/menu.json?_t=' + Date.now())
      .pipe(
        map(res => res.menu),
        catchError(error => {
          console.error('Error while getting menu:', error);
          return of([]);
        })
      );
  }
 
}