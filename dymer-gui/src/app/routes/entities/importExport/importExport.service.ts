import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service'; 


export interface IndexMappingResponse {
  data: {
    [index: string]: {
      mappings: {
        properties: { [key: string]: any };
      };
    };
  };
}

export interface AllStatsGlobalResponse {
  data: {
    indices: {
      index: string;
      [key: string]: any;
    }[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class ImportExportService {
  private apiService = inject(ApiService);
  constructor(private client: HttpClient) {}

  getIndexStructure(index: string): Observable<IndexMappingResponse> {
    const url = this.apiService.endpoints.importExport.getIndex(index);
    return this.client.get<IndexMappingResponse>(url, {
      withCredentials: true,
    });
  }

  getAllStatsGlobal(): Observable<AllStatsGlobalResponse> {
    const url = this.apiService.endpoints.dashboard.allStats;
    return this.client.get<AllStatsGlobalResponse>(url, {
      withCredentials: true,
    });
  }

  getStructure(index: string): Observable<string[]> {
    const url = this.apiService.endpoints.importExport.getStructure(index);
    return this.client.get<string[]>(url, {
      withCredentials: true,
    });
  }

  importFromCsv(data: any): Observable<any> {
    const url = this.apiService.endpoints.importExport.importFromCsv;
    return this.client.post(url, data, {
      withCredentials: true,
    });
  }

  importFromUrl(url: string): Observable<any> {
    return this.client.get(url, {
      withCredentials: true,
    });
  }

  importFromREST(url: string, method: 'GET' | 'POST', body?: any): Observable<any> {
    if (method === 'GET') {
      return this.client.get(url, { withCredentials: true });
    } else {
      return this.client.post(url, body, {
        withCredentials: true,
      });
    }
  }

  exportCSVFormat(index: string, exclude: string[]): Observable<Blob> {
    const url = this.apiService.endpoints.dashboard.exportCsvEntities;
    const payload = {
      index: index,
      exclude: exclude,
    };
    return this.client.post(url, payload, {
      responseType: 'blob',
      withCredentials: true,
    });
  }

  exportJSONFormat(index: string): Observable<Blob> {
    const url = this.apiService.endpoints.dashboard.exportJsonEntities;
    const payload = { index: index };
    return this.client.post(url, payload, {
      responseType: 'blob',
      withCredentials: true,
    });
  }
}
