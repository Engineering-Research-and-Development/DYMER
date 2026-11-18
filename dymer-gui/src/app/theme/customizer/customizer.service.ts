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
      fetch(this.stream, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: message,
          agentId: agent._id
        })
      })
      .then(async response => {
        if (!response.ok) {
          const rawBody = await response.text();
          let errorMessage = `Errore HTTP ${response.status}`;

          if (rawBody) {
            try {
              const errorBody = JSON.parse(rawBody);
              errorMessage = errorBody?.message || errorBody?.error || errorMessage;
            } catch {
              errorMessage = rawBody;
            }
          }

          throw new Error(errorMessage);
        }

        if (!response.body) {
          throw new Error('La risposta dell agente non contiene dati.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
          if (done) break;
        }

        const payload = buffer.trim();
        if (!payload) throw new Error('La risposta dell agente è vuota.');

        try {
          const jsonResponse = JSON.parse(payload);

          if (jsonResponse.generatedCode) {
            subscriber.next(jsonResponse.generatedCode);
          } else if (jsonResponse.message) {
            throw new Error(jsonResponse.message);
          } else {
            throw new Error('Formato di risposta dell agente non riconosciuto.');
          }
        } catch (error) {
          if (error instanceof SyntaxError) {
            subscriber.next(payload);
          } else {
            throw error;
          }
        }

        subscriber.complete();
      })
      .catch(error => {
        subscriber.error(
          error instanceof Error
            ? error
            : new Error('Errore durante la comunicazione con l agente.')
        );
      });
    });
  }

}
