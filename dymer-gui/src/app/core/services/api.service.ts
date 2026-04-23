import { Injectable } from '@angular/core';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  public get baseUrl(): string {
    return this._baseUrl;
  }

  private readonly _baseUrl = `${environment.backend.baseUrl}`+`${environment.backend.contextPath}`;
  public readonly endpoints = {
    login: {
      login: `${this._baseUrl}/api/portalweb/login`,
      userInfo: `${this._baseUrl}/api/dservice/api/v1/duser`,
      refresh: `${this._baseUrl}/api/portalweb/auth/refresh`
    },
    permissions: {
      form: `${this._baseUrl}/api/forms/api/v1/form`,
      list: `${this._baseUrl}/api/dservice/api/v1/perm/`,
      listUsers: `${this._baseUrl}/api/dservice/api/v1/duser/`,
      addUser: `${this._baseUrl}/api/dservice/api/v1/duser`,
      updateUser: (id: string | number) => `${this._baseUrl}/api/dservice/api/v1/duser/${id}`,
      removeUser: (id: string | number) => `${this._baseUrl}/api/dservice/api/v1/duser/${id}`,
      listAuthConfig: `${this._baseUrl}/api/dservice/api/v1/authconfig`,
      createAuthConfig: `${this._baseUrl}/api/dservice/api/v1/authconfig`,
      updateAuthConfig: (id: string | number) => `${this._baseUrl}/api/dservice/api/v1/authconfig/${id}`,
      removeAuthConfig: (id: string | number) => `${this._baseUrl}/api/dservice/api/v1/authconfig/${id}`,
    },
    dashboard: {
      uuid: `${this._baseUrl}/api/entities/uuid`,
      info: `${this._baseUrl}/info/json`,
      allStats: `${this._baseUrl}/api/entities/api/v1/entity/allstatsglobal`,
      allForms: `${this._baseUrl}/api/forms/api/v1/form/`,
      allTemplates: `${this._baseUrl}/api/templates/api/v1/template/`,
      allRelations: `${this._baseUrl}/api/entities/api/v1/entity/relationstat/`,
      exportEntities: `${this._baseUrl}/api/entities/api/v1/entity/export-json-entities`,
      exportJsonEntities: `${this._baseUrl}/api/entities/api/v1/entity/export-json-entities`,
      exportCsvEntities: `${this._baseUrl}/api/entities/api/v1/entity/export-csv-entities`,
      deleteAllEntitiesAndIndexByIndex: `${this._baseUrl}/api/entities/api/v1/entity/deleteAllEntityAndIndexByIndex`,
      deleteAllEntitiesByIndex: `${this._baseUrl}/api/entities/api/v1/entity/deleteAllEntityByIndex`,
      entitiesSearch: `${this._baseUrl}/api/entities/api/v1/entity/_search`,
    },
    wizard: {
      getModelHtml:`${this._baseUrl}/public/assets/wsbuilder/libs/builder/dymer-basetemplate-form.html`,
      createModel:`${this._baseUrl}/api/forms/api/v1/form/`,
      updateModelStructure:`${this._baseUrl}/api/forms/api/v1/form/updatestructure`,
      updateModelAsset:`${this._baseUrl}/api/forms/api/v1/form/updateAsset`,
      getModelDetail:`${this._baseUrl}/api/forms/api/v1/form/modeldetail`,
      createTemplate:`${this._baseUrl}/api/templates/api/v1/template/`,
      getTemplateHtml:`${this._baseUrl}/public/assets/wsbuilder/libs/builder/dymer-basetemplate-template`,
      getVocabularies:`${this._baseUrl}/api/dservice/api/v1/taxonomy`,
      getRelations:`${this._baseUrl}/api/forms/api/v1/form/`
    },
    listentities: {
      base: `${this._baseUrl}/api/entities`,
      getAllentities:`${this._baseUrl}/api/entities/api/v1/entity/`,
      getTemplate: `${this._baseUrl}/api/templates/api/v1/template`,
      deleteEntity: `${this._baseUrl}/api/entities/api/v1/entity/`,
      updateEntityUser: `${this._baseUrl}/api/entities/api/v1/entity/role/`,
      getForm: `${this._baseUrl}/api/forms/api/v1/form`,
      updateEntity:`${this._baseUrl}/api/entities/api/v1/entity`
    },
    relations: {
      singleRelation:`${this._baseUrl}/api/entities/api/v1/entity/singlerelation/`
    },
    addentity: {
      getModels: `${this._baseUrl}/api/forms/api/v1/form/`,
      getModelHtml: (id: string) => `${this._baseUrl}/api/forms/api/v1/form/${id}/html`,
      createEntity: (index: string) => `${this._baseUrl}/api/entities/api/v1/entity/${index}`,
    },
    taxonomy: {
      updateVocabulary: `${this._baseUrl}/api/dservice/api/v1/taxonomy`,
      getVocabularies: `${this._baseUrl}/api/dservice/api/v1/taxonomy`,
      getVocabularyById: (id: string) => `${this._baseUrl}/api/dservice/api/v1/taxonomy/${id}`,
      getVocabularyByTitle: `${this._baseUrl}/api/dservice/api/v1/taxonomy/title/`,
      getRemoteVocabulary: `api/dservice/api/v1/taxonomy/title/`,
      csvToJson: `${this._baseUrl}/api/dservice/api/v1/import/test-csv`
    },
    importExport:{
      getIndex: (index: string) => `${this._baseUrl}/api/entities/api/v1/entity/allindex/${index}`,
      getStructure: (index: string) => `${this._baseUrl}/api/entities/api/v1/entity/getstructure/${index}`,
      importFromCsv: `${this._baseUrl}/api/dservice/api/v1/import/fromcsv`
    },
    hooks:{
      getHooks: `${this._baseUrl}/api/dservice/api/v1/servicehook/hooks/`,
      createHook: `${this._baseUrl}/api/dservice/api/v1/servicehook/addhook`,
      deleteHook: (id: string) => `${this._baseUrl}/api/dservice/api/v1/servicehook/hook/${id}`,
      getAllIndexes: `${this._baseUrl}/api/entities/api/v1/entity/allindex`,
      getAllForms: `${this._baseUrl}/api/forms/api/v1/form/`
    },
     opennessSearch:{
      setConfig: `${this._baseUrl}/api/dservice/api/v1/opn/setConfig`,
      getConfigs: `${this._baseUrl}/api/dservice/api/v1/opn/configs`,
      setRule: `${this._baseUrl}/api/dservice/api/v1/opn/setRule`,
      addRule: `${this._baseUrl}/api/dservice/api/v1/opn/addrule`,
      getRules: `${this._baseUrl}/api/dservice/api/v1/opn/rules`,
      getUsers: `${this._baseUrl}/api/dservice/api/v1/opn/users`,
      deleteRule: (id: string) => `${this._baseUrl}/api/dservice/api/v1/opn/rule/${id}`,
      setUser: `${this._baseUrl}/api/dservice/api/v1/opn/setuser`,
      runRule: (id: string) =>  `${this._baseUrl}/api/dservice/api/v1/opn/run/${id}`,
    },
    importcron: {
      base: `${this._baseUrl}/api/dservice/api/v1/import/cronjob`,
      save: `${this._baseUrl}/api/dservice/api/v1/import/cronjob`,
      update: (id: string) => `${this._baseUrl}/api/dservice/api/v1/import/cronjob/${id}`,
      delete: (id: string) => `${this._baseUrl}/api/dservice/api/v1/import/cronjob/${id}`,
      run: (id: string) => `${this._baseUrl}/api/dservice/api/v1/import/fromdymer/${id}`,
    },
    libraries:{
      getAllLibraries: `${this._baseUrl}/api/dservice/api/v1/library/`,
      reloadLibraries: `${this._baseUrl}/api/dservice/api/v1/library/reload`,
      libraryById: (id: string) => `${this._baseUrl}/api/dservice/api/v1/library/${id}`,
      uploadFile: `${this._baseUrl}/public/filelibrary`
    },
    socialStatistics: {
      getAll: `${this._baseUrl}/api/dservice/api/v1/stats/getallstats`,
      deleteStatById: (id: string) => `${this._baseUrl}/api/dservice/api/v1/stats/deletestats/${id}`,
      deleteAllStats: `${this._baseUrl}/api/dservice/api/v1/stats/deletestats/all`
    },
    logs: {
      logTypes: `${this._baseUrl}/api/system/logtypes`,
      checkGeneralService: `${this._baseUrl}/checkservice`,
      checkEntities: `${this._baseUrl}/api/entities/checkservice`,
      uuidEntities: `${this._baseUrl}/api/entities/uuid`,
      mongoEntitiesState: `${this._baseUrl}/api/entities/api/v1/entity/mongostate`,
      elasticEntitiesState: `${this._baseUrl}/api/entities/api/v1/entity/elasticstate`,
      redisEntitiesState: `${this._baseUrl}/api/entities/api/v1/entity/redisstate`,
      checkServices: `${this._baseUrl}/api/dservice/checkservice`,
      mongoServicesState: `${this._baseUrl}/api/dservice/api/v1/perm/mongostate`,
      checkForms: `${this._baseUrl}/api/forms/checkservice`,
      mongoFormsState: `${this._baseUrl}/api/forms/api/v1/form/mongostate`,
      checkTemplates: `${this._baseUrl}/api/templates/checkservice`,
      mongoTemplatesState: `${this._baseUrl}/api/templates/api/v1/template/mongostate`,
      setLogConfig: `${this._baseUrl}/api/system/setlogConfig`,
      multitenancyState: `${this._baseUrl}/api/entities/api/v1/entity/multitenancy`,
      webservertailogs: (type: string) => `${this._baseUrl}/tailLog/${type}`,
      dservicetailogs: `${this._baseUrl}/tailLog/dservice`,
      formstailogs: `${this._baseUrl}/tailLog/forms`,
      templatetailogs: `${this._baseUrl}/api/tailLog/templates`
    },
    ollama:{
      ollamaws: `${this._baseUrl}/api/dservice/api/v1/llm/generate-code`,
      generateCode: `${this._baseUrl}/api/dservice/api/v1/llm/generate-code`,
      queryModel:   `${this._baseUrl}/api/dservice/api/v1/llm/query-model`,
      checkStatus:  `${this._baseUrl}/api/dservice/api/v1/llm/status`,
      listModels:   `${this._baseUrl}/api/dservice/api/v1/llm/models`,
      pullModel:    `${this._baseUrl}/api/dservice/api/v1/llm/pull-model`
    },
    models: {
      getAllModels: `${this._baseUrl}/api/forms/api/v1/form`,
      createModel: `${this._baseUrl}/api/forms/api/v1/form`,      
      updateModel: `${this._baseUrl}/api/forms/api/v1/form/update`,      
      deleteModel: (id: string) => `${this._baseUrl}/api/forms/api/v1/form/${id}`,
      deleteAttachment: (modelId: string, attachmentId: string) => `${this._baseUrl}/api/forms/api/v1/form/${modelId}/${attachmentId}`,
      // saveAsset: `${this._baseUrl}/api/forms/api/v1/form/addAsset`,
      createAttachment: `${this._baseUrl}/api/forms/api/v1/form/addAsset`,
      updateAttachment: `${this._baseUrl}/api/forms/api/v1/form/updateAsset`,
      getAttachment: (index: string, fileId: string) => `${this._baseUrl}/api/forms/api/v1/form/content/${index}/${fileId}`,
      defaultPagePath: `assets/default_pages/dymer-basetemplate-form.html`,
      updateStructure: `${this._baseUrl}/api/forms/api/v1/form/updateStructure`
    },
    templates: {
      getAllTemplates: `${this._baseUrl}/api/templates/api/v1/template`,
      createTemplate: `${this._baseUrl}/api/templates/api/v1/template`,
      updateTemplate: `${this._baseUrl}/api/templates/api/v1/template/update`,
      deleteTemplate: (id: string) => `${this._baseUrl}/api/templates/api/v1/template/${id}`,
      getAllIndexes: `${this._baseUrl}/api/entities/api/v1/entity/allindex`,
      deleteAttachment: (templateId: string, attachmentId: string) => `${this._baseUrl}/api/templates/api/v1/template/${templateId}/${attachmentId}`,
      createAttachment: `${this._baseUrl}/api/templates/api/v1/template/addAsset`,
      updateAttachment: `${this._baseUrl}/api/templates/api/v1/template/updateAsset`,
      fullContentPagePath: `assets/default_pages/dymer-basetemplate-template-fullcontent.html`,
      teaserPagePath: `assets/default_pages/dymer-basetemplate-template-teaser.html`,
      teaserListPagePath: `assets/default_pages/dymer-basetemplate-template-teaserlist.html`,
      teaserMapPagePath: `assets/default_pages/dymer-basetemplate-template-teasermap.html`,
      fullAutoGenOPath: (model: string) => `/api/forms/api/v1/form/modeldetail?query={"instance._index":"${model}"}`
    },
    agents:{
      getAllAgents: `${this._baseUrl}/api/dservice/api/v1/ai-agents/getAllAgents`,
      createAgent: `${this._baseUrl}/api/dservice/api/v1/ai-agents/createAgent`,
      updateAgent: (id: string) => `${this._baseUrl}/api/dservice/api/v1/ai-agents/${id}`,
      deleteAgent: (id: string) => `${this._baseUrl}/api/dservice/api/v1/ai-agents/${id}`,
      testConnection: `${this._baseUrl}/api/dservice/api/v1/ai-agents/test-connection`,
      stream: `${this._baseUrl}/api/dservice/api/v1/ai-agents/stream`,
      checkStatus: (id: string) => `${this._baseUrl}/api/dservice/api/v1/ai-agents/status/${id}`
    },
    documentation: {
      swagger: `${this._baseUrl}/swaggerdoc`
    },
  };
  constructor() {}
}
