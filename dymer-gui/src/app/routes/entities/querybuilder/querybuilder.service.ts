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
export class QueryBuilderService {
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

  flattenEsArray(data: any): { arr: any[], total: number } {
    const flattenedArray: any[] = [];

    if (!data) {
      return { arr: [], total: 0 };
    }

    // Funzione helper per appiattire un singolo elemento
    const flattenElement = (el: any) => {
      if (!el) return null;
      // Se l'elemento ha _source, lo appiattiamo. Altrimenti, usiamo l'oggetto così com'è.
      const source = el._source ? { ...el._source } : { ...el };
      delete source._source; // Rimuove _source se presente
      return {
        ...source,
        _id: el._id,
        _index: el._index
      };
    };

    // Aggiungi l'oggetto principale (se ha un _source) e tutti gli elementi in 'relations'
    [data, ...(data.relations || [])].forEach(item => {
      const flattened = flattenElement(item);
      if (flattened) {
        flattenedArray.push(flattened);
      }
    });

    return { arr: flattenedArray, total: flattenedArray.length };
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

  // --- Funzioni di utility per i permessi ---

  checkStatus(properties: any, options: string): string {
    const opts = JSON.parse(options);
    if (!properties || !properties.status) {
      return '';
    }
    const status = properties.status;
    if (opts.style === 'text') {
      if (status.published) return 'Published';
      if (status.draft) return 'Draft';
      return 'Not Published';
    }
    // Implementazione per lo stile con icone se necessario
    return '';
  }

  checkVisibility(properties: any, options: string): string {
    let opts: any = {};
    try {
      opts = JSON.parse(options);
    } catch (e) {
      // Ignora l'errore se le opzioni non sono un JSON valido, usa l'oggetto vuoto.
    }
    if (!properties || properties.visibility === undefined) {
      return '';
    }
    const visibility = String(properties.visibility);
    
    // Se lo stile è 'text', restituisce il testo come prima.
    if (opts.style === 'text') {
        switch (String(visibility)) {
            case '0': return 'Public';
            case '1': return 'Private';
            case '2': return 'Restricted';
            default: return '';
        }
    }

    // Altrimenti, restituisce le icone.
    switch (String(properties.visibility)) {
        case '0': return '<i class="material-icons" title="Public">public</i>';
        case '1': return '<i class="material-icons" title="Private">lock</i>';
        case '2': return '<i class="material-icons" title="Restricted">group</i>';
        default: return '<i class="material-icons" title="Not specified">help_outline</i>';
    }
  }

  /**
   * Funzione helper per leggere un valore da un cookie, equivalente a retriveVarCookie.
   * @param key Il nome del cookie da leggere.
   * @returns Il valore del cookie o null se non trovato.
   */
  private getCookie(key: string): string | null {
    const name = key + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return null;
  }

  checkPermission(entityData: any): any {
    // Estrai le proprietà dall'oggetto completo dell'entità
    const properties = entityData.properties;
    const d_uid = properties.owner.uid;
    const d_gid = properties.owner.gid;
    const d_rl_str = localStorage.getItem("d_rl");
    const d_lp_str = localStorage.getItem("d_lp");

    const entPerm = {
        isowner: false,
        view: false,
        edit: false,
        delete: false,
        managegrant: false,
        isadmin: false,
        iscurator: false
    };
    if (!d_uid || d_uid === '0') {
        entPerm.view = properties?.visibility === 0;
        return entPerm;
    }
    const isiinfo_str = this.getCookie("DYMisi");
    if (isiinfo_str) {
        try {
            const isiinfo = JSON.parse(atob(isiinfo_str));
            if (isiinfo?.roles?.some((x: any) => x.role === "app-admin")) {
                return { isowner: false, view: true, edit: true, delete: true, managegrant: true, isadmin: true, iscurator: false };
            }
        } catch (e) {
            console.error("Failed to parse DYMisi cookie", e);
        }
    }
    // Controlla se l'utente è un amministratore
    if (d_rl_str) {
        try {
            const d_rl = JSON.parse(atob(d_rl_str));
            // Controlla se l'utente è admin in modo più robusto.
            // I ruoli possono essere un array di stringhe o un array di oggetti con una proprietà 'role'.
            let isAdmin = false;
            if (Array.isArray(d_rl)) {
                isAdmin = d_rl.some(role => 
                    (typeof role === 'string' && role === 'app-admin') || 
                    (typeof role === 'object' && role !== null && role.role === 'app-admin')
                );
            }
            if (isAdmin) {
                return { isowner: false, view: true, edit: true, delete: true, managegrant: true, isadmin: true, iscurator: false };
            }
        } catch (e) {
            console.error("Failed to parse user roles from localStorage", e);
        }
    }

    // Se l'entità non ha proprietà o proprietario, non si può procedere
    if (!properties || !properties.owner) {
        return entPerm;
    }

    // Controlla se l'utente è il proprietario
    if (String(properties.owner.uid) === d_uid) {
        return { ...entPerm, isowner: true, view: true, edit: true, delete: true, managegrant: true };
    }

    // Controlla se l'utente è un curatore per questo indice
    if (d_lp_str) {
        try {
            const d_lp = JSON.parse(atob(d_lp_str));
            const actualIndex = entityData._index; // Usa l'indice dal livello superiore
            if (d_lp.edit?.includes(actualIndex)) {
                entPerm.view = true;
                entPerm.edit = true;
                entPerm.iscurator = true;
            }
            if (d_lp.delete?.includes(actualIndex)) {
                entPerm.view = true;
                entPerm.delete = true;
                entPerm.iscurator = true;
            }
            if (entPerm.iscurator) return entPerm;
        } catch (e) {
            console.error("Failed to parse user curator permissions from localStorage", e);
        }
    }

    // Controlla i permessi di grant
    if (properties.grant) {
        const entGrant = properties.grant;
        if (entGrant.update?.uid?.includes(d_uid) || entGrant.update?.gid?.includes(d_gid)) {
            entPerm.edit = true;
        }
        if (entGrant.delete?.uid?.includes(d_uid) || entGrant.delete?.gid?.includes(d_gid)) {
            entPerm.delete = true;
        }
        if (entGrant.managegrant?.uid?.includes(d_uid) || entGrant.managegrant?.gid?.includes(d_gid)) {
            entPerm.managegrant = true;
        }
    }

    // Se l'entità è pubblica, tutti possono vederla
    if (properties.visibility === 0) {
        entPerm.view = true;
    }

    return entPerm;
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
