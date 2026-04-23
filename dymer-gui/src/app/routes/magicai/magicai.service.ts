import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, switchMap, throwError } from 'rxjs';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root',
})
export class MagicaiService {
  private apiService = inject(ApiService);
  private baseContextPath = this.apiService.endpoints.ollama.ollamaws;
  constructor(private client: HttpClient) {}
  
   private apiUrl = this.apiService.endpoints.ollama.ollamaws; // URL del tuo microservizio Node.js

  public streamChat(message: string): Observable<string> {
     return new Observable<string>(subscriber => {
       let fullResponse = '';
       // Usiamo fetch() perché l'HttpClient di Angular non supporta nativamente lo streaming del body delle risposte.
       fetch(this.apiUrl, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ prompt: message })
       })
       .then(async response => {
         if (!response.ok || !response.body) {
           throw new Error('API Error');
         }
         // Ottieni un Reader per leggere il flusso di dati
         const reader = response.body.getReader();
         const decoder = new TextDecoder();
 
         // Funzione per leggere ricorsivamente i blocchi (chunks)
         while (true) {
           const { done, value } = await reader.read();
           if (done) {
             break;
           }
           const chunk = decoder.decode(value, { stream: true });
           try {
             const jsonResponse = JSON.parse(chunk);
             if (jsonResponse.generatedCode) {
               subscriber.next(jsonResponse.generatedCode); // Invia il chunk
             }
           } catch (e) {
             // Se il chunk non è un JSON valido, potresti voler gestire l'errore o ignorarlo
           }
         }
         subscriber.complete(); // Segnala la fine dello streaming
       })
       .catch(err => subscriber.error(err));
     });
  }
  
}
