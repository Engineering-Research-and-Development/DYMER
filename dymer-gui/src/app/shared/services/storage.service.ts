import { inject, Injectable } from '@angular/core';
import { base64 } from '@core';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {

  constructor(private cookieService: CookieService) {}

  get(key: string) {
    console.log(">>> storage.service.ts | get key ", key);
    console.log(">>> storage.service.ts | get value ", localStorage.getItem(key));
    return JSON.parse(localStorage.getItem(key) || '{}') || {};
  }

  set(key: string, value: any): boolean {
    //localStorage.setItem(key, JSON.stringify(value));

    //if (key === "dmr"){
      Object.entries(value).forEach(([innerKey, innerValue]) => {
        localStorage.setItem(innerKey, innerValue as string);
     
        //VL workaround if dymer backend creates a jwt token using with sameSite Strict instead of None  
        if (innerKey === 'access_token'){
          let jwtToken = innerValue as string;
          const [_header, _payload, _signature] = jwtToken.split('.');
                    if (!_header || !_payload || !_signature){
            throw new Error("Invalid token");
          }
          const payload = JSON.parse(base64.decode(_payload));
          const expirationDate = new Date(payload.exp * 1000);
          //const expirationDate = new Date();
          //expirationDate.setHours(expirationDate.getHours() + 1);
          this.cookieService.set('token', innerValue as string, {
            expires: expirationDate, 
            path: '/'  
            //secure: true,
            //sameSite: 'Lax'
          });
        }
      });
    //}
    
    return true;
  }

  has(key: string): boolean {
    return !!localStorage.getItem(key);
  }

  remove(key: string) {
    localStorage.removeItem(key);
  }

  clear() {
    localStorage.clear();
  }
}

export class MemoryStorageService {
  private store: Record<string, string> = {};

  get(key: string) {
    return JSON.parse(this.store[key] || '{}') || {};
  }

  set(key: string, value: any): boolean {
    this.store[key] = JSON.stringify(value);
    return true;
  }

  has(key: string): boolean {
    return !!this.store[key];
  }

  remove(key: string) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}
