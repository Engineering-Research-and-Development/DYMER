import { Injectable } from '@angular/core';
import { Token } from './interface';
import { SimpleToken, JwtToken, BaseToken } from './token';

@Injectable({
  providedIn: 'root',
})
 /*export class TokenFactory {
  create(attributes: Token): BaseToken | undefined {
    if (!attributes.access_token) {
      return undefined;
    }

    if (JwtToken.is(attributes.access_token)) {
      return new JwtToken(attributes);
    }

    return new SimpleToken(attributes);
  }
} 
*/

 export class TokenFactory {
  create(): BaseToken | undefined {
    const access_token = localStorage.getItem('access_token') || '';
    const token_type = localStorage.getItem('token_type') || 'Bearer';
    const expires_in = localStorage.getItem('expires_in') ? parseInt(localStorage.getItem('expires_in')!) : undefined;
    const exp = localStorage.getItem('exp') ? parseInt(localStorage.getItem('exp')!) : undefined;
    //const refresh_token = localStorage.getItem('refresh_token') || '';//TODO build auth/refresh BE
    const csrf_token = localStorage.getItem('csrf_token') || '';

    if (!access_token) {
      return undefined;
    }

    const attributes: Token = {
      access_token,
      token_type,
      expires_in,
      exp,
      //refresh_token,
      csrf_token
    };

    if (JwtToken.is(access_token)) {
      return new JwtToken(attributes);
    }

    return new SimpleToken(attributes);
  }
}
 