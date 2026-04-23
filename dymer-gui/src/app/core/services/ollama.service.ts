import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OllamaService {
  constructor(private http: HttpClient) {}

  // endpoint configurabile tramite environment. Restituisce testo semplice.
  sendPrompt(prompt: string, model = 'llama2') : Observable<string> {
   // const url = `${environment.ollamaUrl}/api/generate`; // configura environment.ollamaUrl
    const body = { model, prompt };
    const url = ` `; // configura environment.ollamaUrl
    return this.http.post<any>(url, body).pipe(
      map(res => {
        // adattare secondo il formato di risposta di Ollama in uso
        if (typeof res === 'string') return res;
        if (res?.result) return String(res.result);
        if (res?.text) return String(res.text);
        return JSON.stringify(res);
      }),
      catchError(err => {
        console.error('Ollama error', err);
        return of('Errore nella richiesta al modello.');
      })
    );
  }
}