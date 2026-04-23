export interface CheckService {
  entities: ServiceStatus;
  dservice: ServiceStatus;
  forms: ServiceStatus;
  templates: ServiceStatus;
  webserver: ServiceStatus;
}

interface ServiceStatus {
  state: string;
  msg: string;
  db?: {
    mongo?: DbStatus;
    elastic?: DbStatus;
    redis?: DbStatus;
  };
  logs?: any
}

interface DbStatus {
  msg: string;
  css: string;
  value?: boolean
}

export interface JSONResponse {
  success: string;
  message: string;
  data: CheckService[];
  extraData: Record<string, any>
}

export interface ConfigLogs {
  [key: string]: string;
}
