import { Injectable, OnDestroy, inject } from '@angular/core';
import { BehaviorSubject, Subject, Subscription, share, timer } from 'rxjs';

import { LocalStorageService } from '@shared';
import { currentTimestamp, filterObject } from './helpers';
import { Token } from './interface';
import { BaseToken } from './token';
import { TokenFactory } from './token-factory.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class TokenService implements OnDestroy {
  private readonly key = 'dmr';

 private readonly store = inject(LocalStorageService);
  private readonly factory = inject(TokenFactory);

  private readonly change$ = new BehaviorSubject<BaseToken | undefined>(undefined);
  private readonly refresh$ = new Subject<BaseToken | undefined>();

  private timer$?: Subscription;

  private _token?: BaseToken;

   /*private get token(): BaseToken | undefined {
    if (!this._token) {
      this._token = this.factory.create(this.store.get(this.key));
    }

    return this._token;
  } 
*/
  constructor(private router: Router) {}

  private get token(): BaseToken | undefined {
    if (!this._token) {
      this._token = this.factory.create();
    }
  
    return this._token;
  }
  
  change() {
    return this.change$.pipe(share());
  }

  refresh() {
    this.buildRefresh();

    return this.refresh$.pipe(share());
  }

  set(token?: Token) {
    this.save(token);

    return this;
  }

  clear() {
    this.save();
  }

  valid() {
    return this.token?.valid() ?? false;
  }

  getBearerToken() {
    return this.token?.getBearerToken() ?? '';
  }

  getCsrfToken() {
    return this.token?.getCSRFToken();
  }

  //TODO build auth/refresh in BE
  /*getRefreshToken() {
    return this.token?.refresh_token;
  }*/

  ngOnDestroy(): void {
    this.clearRefresh();
  }

  removeCookies() {
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const cookieName = cookie.split('=')[0].trim(); 
      document.cookie = `${cookieName}=; Max-Age=-1; path=/;`;
    });
  }

  private save(token?: Token) {
    this._token = undefined;
  
    if (!token) {
      this.store.remove('access_token');
      this.store.remove('token_type');
      //this.store.remove('refresh_token');//TODO build auth/refresh in BE
      this.store.remove('csrfToken');
      this.store.remove('DYMisi');
      this.store.remove('d_lp');
      this.store.remove('d_rl');
      this.store.remove('dym-settings');
      this.removeCookies();
    } else {
      const tokenProperties: any = {};
      tokenProperties.access_token = localStorage.getItem('access_token') || '';
      tokenProperties.token_type = localStorage.getItem('token_type') || 'Bearer';
      tokenProperties.expires_in = localStorage.getItem('expires_in') || null;
      tokenProperties.exp = localStorage.getItem('exp') || null;
      //tokenProperties.refresh_token = localStorage.getItem('refresh_token') || null;//TODO build auth/refresh in BE
      tokenProperties.csrf_token = localStorage.getItem('csrf_token') || null;
      const value = Object.assign({}, tokenProperties, {
        exp: tokenProperties.exp ? currentTimestamp() + parseInt(tokenProperties.exp) : null,
      });

      this.store.set(this.key, filterObject(value));
    }
  
    this.change$.next(this.token);
    this.buildRefresh();
  }

  /* TODO build auth/refresh in BE
  private buildRefresh() {
    this.clearRefresh();
    if (this.token?.needRefresh()) {
      this.timer$ = timer(this.token.getRefreshTime() * 1000).subscribe(() => {
        this.refresh$.next(this.token);
      });
    }
  }*/

  private buildRefresh() {
    this.clearRefresh();
  
    if (this.token?.needRefresh()) {
      this.timer$ = timer(this.token.getRefreshTime() * 1000).subscribe(() => {
        console.warn('Session expired...');
        this.clear();
        this.router.navigateByUrl('/auth/login');
      });
    }
  }

  private clearRefresh() {
    if (this.timer$ && !this.timer$.closed) {
      this.timer$.unsubscribe();
    }
  }
}
