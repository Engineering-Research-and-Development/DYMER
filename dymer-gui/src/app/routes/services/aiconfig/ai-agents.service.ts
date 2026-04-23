import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AiAgent } from '../models/ai-agent.model';
import { environment } from '@env/environment';
import { ApiService } from '@core/services/api.service';

@Injectable({ providedIn: 'root' })
export class AiAgentsService {
  private http = inject(HttpClient);
  
 

  private apiService = inject(ApiService);
 
  private readonly apiUrl = this.apiService.endpoints.agents.getAllAgents;
  private readonly createUrl = this.apiService.endpoints.agents.createAgent;
  private readonly updateUrl = this.apiService.endpoints.agents.updateAgent;
  private readonly deleteUrl = this.apiService.endpoints.agents.deleteAgent;
  private readonly testConnectionUrl = this.apiService.endpoints.agents.testConnection;
  private readonly checkStatusUrl = this.apiService.endpoints.agents.checkStatus;

  getAll(): Observable<AiAgent[]> {
    return this.http.get<AiAgent[]>(this.apiUrl);
  }

  create(agent: AiAgent): Observable<AiAgent> {
    return this.http.post<AiAgent>(this.createUrl, agent);
  }

  update(id: string, agent: AiAgent): Observable<AiAgent> {
    return this.http.put<any>(this.apiService.endpoints.agents.updateAgent(id), agent, { withCredentials: true });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<any>(this.apiService.endpoints.agents.deleteAgent(id), { withCredentials: true });
  }

  testConnection(config: Partial<AiAgent>): Observable<any> {
    return this.http.post(`${this.testConnectionUrl}`, config);
  }
  checkStatus(id: string): Observable<{status: string}> {
    console.log(`Controllo stato agente con ID: ${id}`);
    console.log(this.checkStatusUrl);
    return this.http.get<{status: string}>(this.apiService.endpoints.agents.checkStatus(id), { withCredentials: true });
}
}
