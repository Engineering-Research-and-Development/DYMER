import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '@core/services/api.service';
import { SettingsService } from '@core';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root' // Disponibile globalmente o fornito nel component
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiService = inject(ApiService);
  private settings = inject(SettingsService);

  private readonly getAllAgents = this.apiService.endpoints.agents.getAllAgents;
  // Shortcut per gli endpoint
  private get endpoints() {
    return this.apiService.endpoints.dashboard;
  }
 
  private get logendpoints() {
    return this.apiService.endpoints.logs;
  }
  uuid(): Observable<any> {
    return this.http.get<any>(this.endpoints.uuid, { withCredentials: true });
  }

  info(): Observable<{ version: string; updated: string }> {
    return this.http.get<{ version: string; updated: string }>(this.endpoints.info);
  }

  allStats(): Observable<any> {
    return this.http.get<any>(this.endpoints.allStats);
  }

  allForms(): Observable<any> {
    return this.http.get<any>(this.endpoints.allForms, { withCredentials: true });
  }

  allTemplates(): Observable<any> {
    return this.http.get<any>(this.endpoints.allTemplates);
  }

  allRelations(): Observable<any> {
    return this.http.get<any>(this.endpoints.allRelations);
  }

  getAiAgents(): Observable<any[]> {
    return this.http.get<any>(this.getAllAgents, { withCredentials: true }).pipe(
      map(res => res || [])
    );
  }

  getSystemLogs(service?: string): Observable<any[]> {
     
   // const url = `${this.settings.options.baseUrl}api/v1/logs${service ? '/' + service : ''}`;
    return this.http.get<any>(this.logendpoints.checkEntities, { withCredentials: true });
}

// getWebServerLogs(): Observable<any> {
//   return this.http.get(this.logendpoints.webservertailogs, { withCredentials: true });
// }

getWebServerLogs(type: string = 'info'): Observable<any> {
  return this.http.get(this.logendpoints.webservertailogs(type), { withCredentials: true });
}

getDServiceLogs(): Observable<any> {
  return this.http.get(this.logendpoints.dservicetailogs, { withCredentials: true });
}

getFormsLogs(): Observable<any> {
  return this.http.get(this.logendpoints.formstailogs, { withCredentials: true });
}

getTemplateLogs(): Observable<any> {
  return this.http.get(this.logendpoints.templatetailogs, { withCredentials: true });
}

  /**
   * Recupera le ultime entità con filtri specifici per la dashboard
   * @param sort Array di stringhe per l'ordinamento (es. ["properties.created:desc"])
   */
  latestEntities(sort: string[] = ["properties.created:desc"]): Observable<any> {
    const payload = {
      query: {
        query: {
          bool: {
            must_not: {
              match: { _index: 'entity_relation' }
            }
          }
        }
      },
      qoptions: {
        size: 10,
        sort: sort,
        fields: {
          include: ["title", "properties", "type"]
        }
      }
    };

    return this.http.post<any>(this.endpoints.entitiesSearch, payload, { withCredentials: true });
  }

  /**
   * MOCK FUNCTION: In un sistema a microservizi reale, questo chiamerebbe
   * un endpoint di Health Check (es. Actuator in Spring Boot o un middleware Node)
   */
  checkServicesHealth(): Observable<any> {
    // Qui potresti chiamare un endpoint dedicato che aggrega lo stato dei servizi
    // Per ora lo simuliamo per alimentare il widget Health Check
    return this.http.get<any>(`${this.endpoints.info}/health-status`).pipe(
      map(res => res.services || [])
    );
  }
}