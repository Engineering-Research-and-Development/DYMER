import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, catchError, iif, lastValueFrom, map, merge, of, share, switchMap, tap } from 'rxjs';
import { filterObject, isEmptyObject } from './helpers';
import { Token, User } from './interface';
import { LoginService } from './login.service';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly loginService = inject(LoginService);
  private readonly tokenService = inject(TokenService);

  private user$ = new BehaviorSubject<User>({});
  private change$ = merge(
    this.tokenService.change(),
    this.tokenService.refresh().pipe(switchMap(() => this.refresh()))
  ).pipe(
    switchMap(() => this.assignUser()),
    share()
  );

  init() {
    return new Promise<void>(resolve => this.change$.subscribe(() => resolve()));
  }

  change() {
    return this.change$;
  }

  check() {
    return this.tokenService.valid();
  }

  /*login(username: string, password: string, rememberMe = false) {
    return this.loginService.login(username, password, rememberMe).pipe(
      tap(token => this.tokenService.set(token)),
      map(() => this.check())
    );
  }*/

  login(username: string, password: string,rememberMe = false) {
    return this.loginService.login(username, password).pipe(
      tap((token: Token) => {

        Object.entries(token).forEach(([key, value]) => {
          if (typeof value === 'string') {
            localStorage.setItem(key, value);
          } else {
            localStorage.setItem(key, JSON.stringify(value));
          }
        });
  
        this.tokenService.set(token);
      }),
      map(() => this.check()) 
    );
  }

  //TODO build auth/refresh in BE
  /*refresh() {
    return this.loginService
      .refresh(filterObject({ refresh_token: this.tokenService.getRefreshToken() }))
      .pipe(
        catchError(() => of(undefined)),
        tap(token => this.tokenService.set(token)),
        map(() => this.check())
      );
  }*/

  refresh() {
    return of(undefined).pipe(
      tap(() => this.tokenService.clear()),
      map(() => this.check())
    );
  }
         

  logout() {
    return this.loginService.logout().pipe(
      tap(() => this.tokenService.clear()),
      map(() => !this.check())
    );
  }

  user() {
    //return this.user$.pipe(share());
    return this.user$.asObservable();
  }  

  menu() {
    return iif(() => this.check(), this.loginService.menu(), of([]));
  }

  private async assignUser() {
    if (!this.check()) {
      return of({}).pipe(tap(user => this.user$.next(user)));
    }

    if (!isEmptyObject(this.user$.getValue())) {
      return of(this.user$.getValue());
    }

    return this.loginService.user().pipe(tap(user => {
      //console.log("user ", user);
      this.user$.next(user) 
    })
    ).subscribe();
  }
}
