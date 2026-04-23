import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '@core/authentication';

export function csrfInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const tokenService = inject(TokenService);
  const csrfToken = tokenService.getCsrfToken();

  if (csrfToken && (req.method === 'GET' || req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE')) {
    //TODO exclude GET when build auth/refresh in BE
    /*
    console.log(">>>csrfToken: ", csrfToken);
    console.log(">>>METHOD: ", req.method);
    console.log(">>>endpoint: ", req.url);
    

    if (req.url.includes('/auth/refresh')) {
      return next(req);
    }
    */
    
    const clonedRequest = req.clone({
      setHeaders: {
        'X-XSRF-TOKEN': csrfToken
      }
    });

    return next(clonedRequest);
  }

  return next(req);
}
