import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, switchMap } from 'rxjs';
import { ApiService } from '@core/services/api.service';

export interface SocialStat {
  _id: string;
  type: string;
  title: string;
  email: string;
  act: string;
  timestamps: string[];
  [key: string]: any;
}

export interface FileUploadResponse {
  success: boolean;
  data: string;
}

/** Interfaccia generica per le risposte standard dell'API */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface SocialStatsResponse {
  success: boolean;
  data: [SocialStat[]];
}

export interface SetConfigResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    servicetype: 'insert' | 'update' | 'delete' | 'get';
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class SocialStatisticsService {
  private apiService = inject(ApiService);
  constructor(private client: HttpClient) {}

  getSocialStats(): Observable<SocialStat[]> {
    return this.client.get<SocialStatsResponse>(this.apiService.endpoints.socialStatistics.getAll, { withCredentials: true }).pipe(
      map(response => response.data[0] || [])
    );
  }

  deleteStatistic(id: string): Observable<any> {
    const url = this.apiService.endpoints.socialStatistics.deleteStatById(id);
    return this.client.delete<any>(url, { withCredentials: true });
  }

  deleteAllStatistics(): Observable<any> {
    const url = this.apiService.endpoints.socialStatistics.deleteAllStats;
    return this.client.delete<any>(url, { withCredentials: true });
  }
}
