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

export interface AllIndexResponse {
  data: {
    [index: string]: {
      mappings: {
        [type: string]: any;
      };
    };
  };
}

export interface AllFormsResponse {
  data: {
    instance: {
      _index: string;
    }[];
  }[];
}

export interface Hook {
  _id: string;
  _index: string;
  eventType: 'after_insert' | 'after_update' | 'after_delete';
  service: {
    serviceType: 'openness_search' | 'fwadapter' | 'sync' | 'eaggregation_hook' | 'workflow';
    [key: string]: any; // Per altre proprietà eventuali
  };
}

export interface HookServicePayload {
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class HooksService {
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

  getHooks(): Observable<any> {
    return this.client.get<any>(this.apiService.endpoints.hooks.getHooks, {
      withCredentials: true,
    });
  }

  createHook(hook: HookServicePayload): Observable<any> {
    return this.client.post<any>(this.apiService.endpoints.hooks.createHook, { data: hook }, {
      withCredentials: true,
    });
  }

  deleteHook(id: string): Observable<any> {
    return this.client.delete<any>(this.apiService.endpoints.hooks.deleteHook(id), {
      withCredentials: true,
    });
  }

  getAllIndex(): Observable<AllIndexResponse> {
    return this.client.get<AllIndexResponse>(this.apiService.endpoints.hooks.getAllIndexes, {
      withCredentials: true,
    });
  }

  getAllForms(): Observable<AllFormsResponse> {
    return this.client.get<AllFormsResponse>(this.apiService.endpoints.hooks.getAllForms, {
      withCredentials: true,
    });
  }
}
