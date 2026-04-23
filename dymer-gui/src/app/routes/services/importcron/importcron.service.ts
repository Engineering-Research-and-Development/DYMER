import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';

export interface CronJobConfig {
  _id?: string;
  active?: boolean;
  title?: string;
  time?: string;
  sourcepath?: string;
  apisearchpath?: string;
  sourceindex?: string;
  targetindex?: string;
  targetprefix?: string;
  sameid?: boolean;
  importrelation?: boolean;
  typerelations?: string;
  importentities?: boolean;
  condition?: string;
  importmodel?: boolean;
  forceimportmodel?: boolean;
  importtemplates?: boolean;
  forceimporttemplates?: boolean;
  authtype?: string;
}

@Injectable({
  providedIn: 'root',
})
export class OpennessSearchService {
  private apiService = inject(ApiService);

  constructor(private client: HttpClient) {}

  getImportCron(): Observable<any> {
    return this.client.get<any>(this.apiService.endpoints.importcron.base, { withCredentials: true });
  }

  saveImportCron(config: CronJobConfig): Observable<any> {
    return this.client.post<any>(this.apiService.endpoints.importcron.save, config, { withCredentials: true });
  }

  updateImportCron(id: string, config: CronJobConfig): Observable<any> {
    return this.client.put<any>(this.apiService.endpoints.importcron.update(id), config, { withCredentials: true });
  }

  deleteImportCron(id: string): Observable<any> {
    return this.client.delete<any>(this.apiService.endpoints.importcron.delete(id), { withCredentials: true });
  }

  runImportCron(id: string): Observable<any> {
    return this.client.get<any>(this.apiService.endpoints.importcron.run(id), { withCredentials: true });
  }
}
