import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { OpnSearchConfigItem } from './opennesssearch.component';


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
  success: boolean;
  message: string;
}

export interface AllFormsResponse {
  data: {
    instance: {
      _index: string;
    }[];
  }[];
  success: boolean;
  message: string;
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

/** Interfaccia generica per le risposte standard dell'API */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface SetConfigResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    servicetype: 'insert' | 'update' | 'delete' | 'get';
  }[];
}

export interface GetConfigsResponse {
  success: boolean;
  message: string;
  data: (OpnSearchConfigItem & { _id: string })[];
}

export interface GetRulesResponse {
  success: boolean;
  message: string;
  data: any[]; // Using any[] as ListRule is in the component
}

export interface GetUsersResponse {
  success: boolean;
  message: string;
  data: any[]; // Using any[] as OpnUser is in the component
}


export interface BaseEntityConfig {
  properties: {
    owner: {
      uid: string | number;
      gid: string | number;
    };
    ipsource: string;
  };
}


@Injectable({
  providedIn: 'root',
})
export class OpennessSearchService {
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

  getEntitiesSearchEndpoint(): string {
    return this.apiService.endpoints.dashboard.entitiesSearch;
  }

  setConfig(config: OpnSearchConfigItem): Observable<SetConfigResponse> {
    return this.client.post<SetConfigResponse>(this.apiService.endpoints.opennessSearch.setConfig, { data: config }, { withCredentials: true });
  }

  createRule(rule: any): Observable<any> {
    return this.client.post<any>(this.apiService.endpoints.opennessSearch.addRule, { data: rule }, { withCredentials: true });
  }

  getConfigs(): Observable<GetConfigsResponse> {
    return this.client.get<GetConfigsResponse>(this.apiService.endpoints.opennessSearch.getConfigs, { withCredentials: true });
  }

  getRules(): Observable<GetRulesResponse> {
    return this.client.get<GetRulesResponse>(this.apiService.endpoints.opennessSearch.getRules, { withCredentials: true });
  }

  getUsers(): Observable<GetUsersResponse> {
    return this.client.get<GetUsersResponse>(this.apiService.endpoints.opennessSearch.getUsers, { withCredentials: true });
  }

  setUser(user: any): Observable<any> {
    return this.client.post<any>(this.apiService.endpoints.opennessSearch.setUser, { user: user }, { withCredentials: true });
  }

  deleteRule(id: string): Observable<any> {
    return this.client.delete<any>(this.apiService.endpoints.opennessSearch.deleteRule(id), { withCredentials: true });
  }

  runRule(id: string): Observable<any> {
    return this.client.get<any>(this.apiService.endpoints.opennessSearch.runRule(id), { withCredentials: true });
  }

  /**
   * Retrieves the base entity configuration including owner UID/GID and IP source.
   * This logic replaces the old JavaScript `getbaseEntityConfig` function.
   */
  getBaseEntityConfig(): BaseEntityConfig {
    const ipcall = window.location.protocol + "//" + window.location.host + "/";
    let ownerUid: string | number = 0;
    let ownerGid: string | number = 0;

    const d_uid_str = localStorage.getItem("d_uid");
    const d_gid_str = localStorage.getItem("d_gid");

    if (d_uid_str !== null) {
        ownerUid = d_uid_str;
    }
    if (d_gid_str !== null) {
        ownerGid = d_gid_str;
    }

    return {
      properties: { owner: { uid: ownerUid, gid: ownerGid }, ipsource: ipcall }
    };
  }

  async searchEntities(query: any): Promise<any> {
    const body = {
      query: {
        query: query,
      },
    };

    const url = this.getEntitiesSearchEndpoint();
    try {
      return await this.client.post(url, body, { withCredentials: true }).toPromise();
    } catch (error) {
      console.error('Entity search failed', error);
      return { success: false, message: 'Search failed', data: null };
    }
  }
  getrendRole(perm: any): string {
    if (!perm) return '';
    // La logica per il ruolo è già corretta e restituisce icone.
    // Sostituiamo le icone con Material Icons per testare.
    if (perm.isadmin) { return '<i class="material-icons" title="Admin">admin_panel_settings</i>'; }
    if (perm.isowner) { return '<i class="material-icons" title="Owner">vpn_key</i>'; }
    if (perm.owner) { return '<i class="material-icons" title="Co-Owner">person_add</i>'; }
    if (perm.group) { return '<i class="material-icons" title="Group Member">group</i>'; }
    if (perm.other) { return '<i class="material-icons" title="Public">public</i>'; }
    
    // Se non si ha nessun permesso specifico, si è un "Viewer".
    // La chiamata in dymer.querygen.js ha già un fallback, ma è bene averlo anche qui per coerenza.
    return '<i class="material-icons" title="Viewer">visibility</i>';
  }
}
