import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, switchMap, throwError, of, tap } from 'rxjs';
import { ApiService } from '@core/services/api.service'; 
export interface RawEsEntity {
  _index: string;
  _type: string;
  _id: string;
  _score?: number;
  _source?: Record<string, any>;
  relations?: RawEsEntity[];
  [key: string]: any;
}
export interface GetAllEntitiesResponse {
  data: RawEsEntity[];
  success?: boolean; 
}
export interface GetEntityByIdResponse {
  data: RawEsEntity[];
  success?: boolean;
}
interface RawTemplate {
  _id: string;
  viewtype: Array<{ rendertype: string }>;
  files: Array<{
    _id: string;
    contentType: string;
    filename: string;
    data?: any;
  }>;
}
interface ProcessedTemplateFiles {
  domtype: string;
  filename: string;
  extrattr: Array<{ key: string; value: string }>;
  data?: any;
  name: string;
}
export interface ProcessedTemplate {
  viewtype: {
    [key: string]: string;
  };
  files: {
    [key: string]: ProcessedTemplateFiles[];
  };
}
export interface ProcessedEntitiesResult {
  flattenedData: RawEsEntity[];
  templateKeys: Set<string>;
}
export interface MongoFormPropertiesOwner {
  uid: string;
  gid: string;
}
export interface MongoFormPropertiesAccess {
  view: {
    uid: string[];
    gid: string[];
  };
}
export interface MongoFormProperties {
  created: Date;
  owner: MongoFormPropertiesOwner;
  changed: Date;
  grant: MongoFormPropertiesAccess;
  update: MongoFormPropertiesAccess;
  delete: MongoFormPropertiesAccess;
}
export interface MongoFormInstance {
  _index: string;
  _type?: string;
}
export interface MongoForm {
  _id: string;
  title: string;
  author: string;
  description: string;
  posturl: string;
  instance: MongoFormInstance[];
  structure: any; 
  files: string[];
  properties: MongoFormProperties;
  __v?: number;
}
export interface GetFormResponse {
  data: MongoForm[];
  success?: boolean;
}
@Injectable({
  providedIn: 'root',
})
export class ListEntitiesService {
  private apiService = inject(ApiService);
  private baseContextPath = this.apiService.endpoints;
  private templatesEndpoint = this.apiService.endpoints;
  constructor(private client: HttpClient) {}
  /**
   * @param entities
   * @returns
   */
  getAllEntities(): Observable<GetAllEntitiesResponse> {
    const body = {
      query: {
        query: {
          bool: {
            must_not: {
              match: {
                _index: 'entity_relation',
              },
            },
          },
        },
      }
    };
    return this.client.request<GetAllEntitiesResponse>('GET', this.baseContextPath.listentities.getAllentities, {
      body: body, 
      withCredentials: true,
    });
  }
  /**
   * Recupera i dettagli di una singola entità tramite il suo ID utilizzando l'endpoint _search.
   * @param entityId L'ID dell'entità da recuperare.
   * @returns Un Observable contenente i dettagli dell'entità appiattiti.
   */
  getEntityDetailsById(entityId: string): Observable<RawEsEntity | null> {
    const body = {
      query: {
        query: {
          match: {
            _id: entityId,
          },
        },
      },
    };
    return this.client.request<GetEntityByIdResponse>('POST', this.apiService.endpoints.dashboard.entitiesSearch, { // Usiamo GET con body come per getAllEntities
      body: body,
      withCredentials: true,
    }).pipe(
      map(response => {
        if (response && response.success && response.data && response.data.length > 0) {
          let entity = response.data[0];
          if (entity._source) {
            for (const key in entity._source) {
              if (Object.prototype.hasOwnProperty.call(entity._source, key)) {
                (entity as any)[key] = entity._source[key];
              }
            }
            delete entity._source;
          }
          // Gestione e appiattimento delle relazioni, mantenendo il nome 'relations'
          if (entity.relations && entity.relations.length > 0) {
            (entity as any).relations = entity.relations.map(rel => {
              if (rel && rel._source) {
                const flattenedRel = { ...rel._source, ...rel };
                delete flattenedRel._source;
                return flattenedRel;
              }
              return rel;
            });
          } else {
            (entity as any).relations = [];
          }
          return entity as RawEsEntity;
        }
        return null;
      }),
      catchError(error => {
        console.error(`Errore durante il recupero dei dettagli dell'entità con ID: ${entityId}`, error);
        return throwError(() => new Error(`Impossibile caricare i dettagli per l'entità ${entityId}`));
      })
    );
  }
  public processEntitiesAndExtractTemplateKeys(entities: RawEsEntity[]): ProcessedEntitiesResult {
    const templateKeys = new Set<string>();
    const entitiesCopy = entities ? JSON.parse(JSON.stringify(entities)) : [];
    const flattenedData = this._recursiveFlattenAndExtract(entitiesCopy, templateKeys, 'allEntities');
    return { flattenedData, templateKeys };
  }
  private _recursiveFlattenAndExtract(arr: any, templateKeys: Set<string>, debugPath: string = 'recursiveFlatten'): RawEsEntity[] {
    // Controlla esplicitamente se 'arr' è un array prima di usare .map()
    if (!Array.isArray(arr) || arr.length === 0) {
      // Opzionale: logga se 'arr' è definito ma non è un array, per aiutare nel debug.
      if (arr && !Array.isArray(arr)) {
        console.warn(`_recursiveFlattenAndExtract: Expected array for '${debugPath}', but got ${typeof arr}. Value:`, arr);
      }
      return [];
    }
    return arr.map((entity: RawEsEntity, index: number) => {
      const currentDebugPath = `${debugPath}[${index}]`;
      const newEntity: RawEsEntity = { ...entity }; // Clona per evitare modifiche all'originale
      if (newEntity._source) {
        for (const key in newEntity._source) {
          if (Object.prototype.hasOwnProperty.call(newEntity._source, key)) {
            (newEntity as any)[key] = newEntity._source[key];
          }
        }
        if ('_source' in newEntity) {
           delete newEntity._source;
        }
      }
      // Gestione più robusta delle relazioni interne
      let processedRelations: RawEsEntity[] | undefined;
      if (Object.prototype.hasOwnProperty.call(newEntity, 'relations')) { // Controlla se la proprietà 'relations' esiste sull'oggetto
        if (Array.isArray(newEntity.relations) && newEntity.relations.length > 0) {
          processedRelations = this._recursiveFlattenAndExtract(newEntity.relations, templateKeys, `${currentDebugPath}.relations`);
        } else {
          // Se 'relations' esiste ma non è un array valido o è un array vuoto,
          // lo impostiamo a un array vuoto per coerenza.
          if (!Array.isArray(newEntity.relations)) {
            console.warn(`_recursiveFlattenAndExtract: Property 'relations' at '${currentDebugPath}' was not an array. Value:`, newEntity.relations, ". Corrected to [].");
          }
          processedRelations = [];
        }
      }
      if (processedRelations !== undefined && processedRelations.length > 0) {
          newEntity.relations = processedRelations;
      } else if (Object.prototype.hasOwnProperty.call(newEntity, 'relations')) {
          delete newEntity.relations;
      }
      if (newEntity._index) {
        const templateKey = `${newEntity._index}@${newEntity._index}`;
        templateKeys.add(templateKey);
      }
      return newEntity;
    });
  }
  /**
   * @param index 
   * @param type
   * @returns
   */
  loadTemplatesByIndexAndType(index: string, type: string): Observable<ProcessedTemplate[]> {
    const params = new HttpParams()
      .set('query[query][instance._index]', index)
      .set('_', Date.now().toString());
    const apiSegment = '/api/v1/template/';
    const apiSegmentIndex = this.baseContextPath.dashboard.allTemplates.indexOf(apiSegment);
    let constructedFileBaseUrl = '';
    if (apiSegmentIndex !== -1) {
       constructedFileBaseUrl = this.baseContextPath.dashboard.allTemplates.substring(0, apiSegmentIndex) + '/content/';
    } else {
       console.warn(`Impossibile determinare l'URL base dei file dall'endpoint: ${this.templatesEndpoint}. Utilizzo la base dell'endpoint.`);
       constructedFileBaseUrl = this.templatesEndpoint + '/content/';
    }
    const finalFileBaseUrl = constructedFileBaseUrl;
    return this.client.get<any>(this.baseContextPath.listentities.getTemplate, {
      params: params,
      withCredentials: true,
    }).pipe(
      map(response => {
        if (!response.success || !Array.isArray(response.data)) {
          console.error('La risposta API indica un fallimento o i dati non sono un array', response);
          return [];
        }
        return this._processRawTemplates(response.data, finalFileBaseUrl);
      }),
      catchError(error => {
        console.error('Errore durante il caricamento dei template:', error);
        return throwError(() => new Error('Impossibile caricare i template'));
      })
    );
  }
  private _processRawTemplates(rawTemplates: RawTemplate[], fileBaseUrl: string): ProcessedTemplate[] {
      const processedTemplates: ProcessedTemplate[] = [];
      rawTemplates.forEach((rawTemplate: RawTemplate) => {
          const processedTemplate: ProcessedTemplate = {
              viewtype: {},
              files: {}
          };
          let domToRender: string | undefined = undefined;
          const tempFiles: ProcessedTemplateFiles[] = [];
          rawTemplate.files.forEach(file => {
              const fileUrl = fileBaseUrl + file._id;
              const mimeParts = file.contentType.split('/');
              const fileType = mimeParts[1];
              if (file.contentType === 'text/html') {
                  domToRender = file.data;
              } else {
                  let domtype = fileType;
                  if (fileType === 'css') {
                      domtype = 'link';
                  }
                  if (fileType !== 'octet-stream') {
                      let eltopush: ProcessedTemplateFiles = {
                          domtype: domtype,
                          filename: fileUrl,
                          extrattr: [],
                          data: {},
                          name: file.filename
                      };
                      if (file.filename === 'language.json' && file.data) {
                          eltopush.data.language = file.data;
                      }
                      tempFiles.push(eltopush);
                  }
              }
          });
          if (domToRender !== undefined) {
              rawTemplate.viewtype.forEach(vt => {
                  const renderType = vt.rendertype;
                  processedTemplate.viewtype[renderType] = domToRender as string;
                  const filesForViewType = tempFiles.map(f => ({
                      ...f,
                      extrattr: [...f.extrattr, { key: 'tftemp', value: renderType }]
                  }));
                  processedTemplate.files[renderType] = filesForViewType;
              });
              processedTemplates.push(processedTemplate);
          } 
      });
      return processedTemplates;
  }
  deleteEntityById(entityId: string): Observable<any> {
    const deleteUrl = this.baseContextPath.listentities.deleteEntity + entityId; // Concatenazione diretta
    return this.client.delete(deleteUrl, {
      withCredentials: true,
    }).pipe(
      catchError(this.handleError)
    );
  }
  updateEntityUser(entityId: string, uid: string, gid: string): Observable<any> {
    const endpointUrl = this.apiService.endpoints.listentities.updateEntityUser + entityId;
    const formData = new FormData();
    formData.append('data[id]', entityId);
    formData.append('data[properties][owner][uid]', uid);
    formData.append('data[properties][owner][gid]', gid);
    return this.client.patch(endpointUrl, formData, {
      withCredentials: true,
    }).pipe(
      tap(response => console.log('Risposta dal servizio updateEntityUser:', response)),
      catchError(this.handleError)
    );
  }
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Si è verificato un errore sconosciuto!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Errore: ${error.error.message}`;
    } else {
      errorMessage = `Codice Errore: ${error.status}\nMessaggio: ${error.message}`;
      if (error.error && typeof error.error === 'string') {
        errorMessage += `\nDettaglio: ${error.error}`;
      } else if (error.error && error.error.message) {
        errorMessage += `\nDettaglio: ${error.error.message}`;
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
  /**
   * Recupera il form per un dato indice.
   * @param entityIndex L'indice per cui recuperare il form.
   * @returns Un Observable contenente la risposta del form.
   */
  getFormConfig(entityIndex: string): Observable<GetFormResponse> {
    let params = new HttpParams();
    params = params.set('query', JSON.stringify({ "instance._index": entityIndex }));
    params = params.set('act', "update");
    return this.client.get<GetFormResponse>(this.apiService.endpoints.listentities.getForm, {
      params: params,
      withCredentials: true,
    }).pipe(
      catchError(this.handleError)
    );
  }
  /**
   * Recupera un elenco di entità per un dato indice.
   * Utilizzato per popolare le opzioni dei select per le relazioni.
   * @param indexName L'indice delle entità da recuperare.
   * @returns Un Observable contenente un array di RawEsEntity.
   */
  public getEntitiesByIndex(indexName: string): Observable<RawEsEntity[]> {

    const queryBody = {
        instance: {
            index: indexName
        },
        qoptions: {
            relations: false
        }
    };
    return this.client.post<GetAllEntitiesResponse>(`${this.apiService.endpoints.dashboard.entitiesSearch}`, queryBody, { withCredentials: true }).pipe(
      map(response => {
        if (response && Array.isArray(response.data)) {
          // Usiamo processEntitiesAndExtractTemplateKeys per appiattire e standardizzare
          const { flattenedData } = this.processEntitiesAndExtractTemplateKeys(response.data);
          return flattenedData;
        }
        return [];
      }),
      catchError(err => {
        console.error(`Errore nel caricare entità per indice ${indexName}:`, err);
        return of([]);
      })
    );
  }
  /**
   * Updates an entity using multipart/form-data.
   * @param entityId The ID of the entity to update.
   * @param formData The FormData object containing the entity data.
   * @returns An Observable of the HTTP response.
   */
  updateEntity(entityId: string, formData: FormData): Observable<any> {
    return this.client.put(`${this.apiService.endpoints.listentities.updateEntity}/${entityId}`, formData, {
      withCredentials: true,
    });
  }
  /**
   * Costruisce l'URL completo per un file di contenuto del form (es. CSS) dato il suo ID.
   * @param fileId L'ID del file.
   * @returns L'URL completo per accedere al file.
   */
  public getFormContentFileUrl(fileId: string, index: string): string {
    const endpointForBaseDerivation = this.apiService.endpoints.dashboard.allForms;
    const apiIdentifier = '/api/';
    let baseUrlForContent = '';
    const apiSegmentIndex = endpointForBaseDerivation.indexOf(apiIdentifier);
    if (apiSegmentIndex !== -1) {
      const apiRoot = endpointForBaseDerivation.substring(0, apiSegmentIndex);
      baseUrlForContent = `${apiRoot}/content/${index}/`;
    } else {
      try {
        const url = new URL(endpointForBaseDerivation);
        baseUrlForContent = `${url.protocol}//${url.host}/content/`;
      } catch (e) {
        baseUrlForContent = (typeof window !== 'undefined' ? window.location.origin : '') + '/content/';
      }
    }
    return `${baseUrlForContent}${fileId}`;
  }
}
