import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, switchMap, throwError } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { AiAgent } from '../../routes/services/models/ai-agent.model';

@Injectable({
  providedIn: 'root',
})
export class CustomizerService {
  private apiService = inject(ApiService);
  private baseContextPath = this.apiService.endpoints.ollama.ollamaws;
  constructor(private client: HttpClient) {}
  
   private apiUrl = this.apiService.endpoints.ollama.ollamaws;
   private baseUrl = this.apiService.endpoints.ollama.ollamaws.replace('/generate-code', '');
   private stream = this.apiService.endpoints.agents.stream;

   checkStatus(): Observable<any> {
    return this.client.get(`${this.baseUrl}/status`);
  }

  getModels(): Observable<any> {
    return this.client.get(`${this.baseUrl}/models`);
  }

  pullModel(modelName: string): Observable<any> {
    return new Observable(subscriber => {
      fetch(`${this.baseUrl}/pull-model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelName })
      }).then(async response => {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(l => l.trim());
          lines.forEach(line => subscriber.next(JSON.parse(line)));
        }
        subscriber.complete();
      }).catch(err => subscriber.error(err));
    });
  }

  public streamChat(message: string, agent: AiAgent): Observable<string> {
     return new Observable<string>(subscriber => {
       let fullResponse = '';
       // Usiamo fetch() perché l'HttpClient di Angular non supporta nativamente lo streaming del body delle risposte.
       fetch(this.stream, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ 
              prompt: message,
              agentId: agent._id,
              model: agent.model,
              systemPrompt: agent.systemPrompt
         })
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
