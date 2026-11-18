import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AiAgent } from '../models/ai-agent.model';
import { ApiService } from '@core/services/api.service';

export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface McpServerInfo {
  id: string;
  name: string;
  url: string;
}

export interface McpToolsResponse {
  success: boolean;
  data: {
    server: McpServerInfo;
    tools: McpTool[];
  };
}

export interface McpAccess {
  serverId: string;
  enabled: boolean;
  allowedTools: string[];
}

@Injectable({ providedIn: 'root' })
export class AiAgentsService {
  private http = inject(HttpClient);
  private apiService = inject(ApiService);

  private readonly apiUrl = this.apiService.endpoints.agents.getAllAgents;
  private readonly createUrl = this.apiService.endpoints.agents.createAgent;
  private readonly testConnectionUrl = this.apiService.endpoints.agents.testConnection;
  private readonly mcpToolsUrl = '/api/dservice/api/v1/mcp/tools';

  getAll(): Observable<AiAgent[]> {
    return this.http.get<AiAgent[]>(this.apiUrl, { withCredentials: true });
  }

  create(agent: AiAgent): Observable<AiAgent> {
    return this.http.post<AiAgent>(this.createUrl, agent, { withCredentials: true });
  }

  update(id: string, agent: AiAgent): Observable<AiAgent> {
    return this.http.put<AiAgent>(
      this.apiService.endpoints.agents.updateAgent(id),
      agent,
      { withCredentials: true }
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(
      this.apiService.endpoints.agents.deleteAgent(id),
      { withCredentials: true }
    );
  }

  testConnection(config: Partial<AiAgent>): Observable<unknown> {
    return this.http.post(this.testConnectionUrl, config, { withCredentials: true });
  }

  checkStatus(id: string): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(
      this.apiService.endpoints.agents.checkStatus(id),
      { withCredentials: true }
    );
  }

  getMcpTools(): Observable<McpToolsResponse> {
    return this.http.get<McpToolsResponse>(this.mcpToolsUrl, {
      withCredentials: true
    });
  }
}
