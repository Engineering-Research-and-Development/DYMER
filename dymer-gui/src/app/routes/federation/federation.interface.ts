// Modelli di dominio condivisi tra i componenti della sezione Federation.
// Allineati al contratto API esposto da dymer-federation.

export type AdapterType = 'dymer' | 'true-connector' | 'dcat-generic' | 'dcp' | 'ssi' | 'simpl';

export type SourceHealthStatus = 'healthy' | 'degraded' | 'error' | 'unknown' | 'paused';

export type HarvestMethod = 'push' | 'pull';

export type AutoCreatePolicy = 'profile-only' | 'allow-inferred-draft' | 'disabled';

export interface SourceRegistryEntry {
  id: string;
  name: string;
  description?: string;
  adapterType: AdapterType;
  endpoint: string;
  enabled: boolean;
  pollIntervalMinutes: number;
  pushEnabled: boolean;
  autoCreatePolicy: AutoCreatePolicy;
  trustLevel: 'verified' | 'standard' | 'untrusted';
  createdAt: string;
  updatedAt: string;

  // Configurazione specifica per adapter True Connector (opzionale, presente solo se adapterType === 'true-connector')
  trueConnectorConfig?: TrueConnectorConfig;

  // Stato sync, popolato lato read da dymer-federation
  syncStatus?: SourceSyncStatus;
}

export interface TrueConnectorConfig {
  connectorEndpoint: string;
  selfDescriptionUrl?: string;
  identityProvider?: string;
  clientId?: string;
  // Il secret/certificato non viene mai restituito in chiaro dalle API di lettura
  hasCredentials: boolean;
  certificateAlias?: string;
}

export interface SourceSyncStatus {
  sourceId: string;
  health: SourceHealthStatus;
  lastSuccessAt?: string;
  lastAttemptAt?: string;
  lastHarvestMethod?: HarvestMethod;
  lastError?: string;
  entitiesHarvested?: number;
  pendingCatalogsCount?: number;
}

export interface SourceRegistryFormValue {
  name: string;
  description?: string;
  adapterType: AdapterType;
  endpoint: string;
  enabled: boolean;
  pollIntervalMinutes: number;
  pushEnabled: boolean;
  autoCreatePolicy: AutoCreatePolicy;
  trustLevel: 'verified' | 'standard' | 'untrusted';
  trueConnectorConfig?: Partial<TrueConnectorConfig> & { credentialsSecret?: string };
}

export const ADAPTER_TYPE_LABELS: Record<AdapterType, string> = {
  'dymer': 'DYMER nativo',
  'true-connector': 'True Connector (IDS)',
  'dcat-generic': 'DCAT generico',
  'dcp': 'DCP',
  'ssi': 'SSI',
  'simpl': 'SIMPL',
};

export const HEALTH_LABELS: Record<SourceHealthStatus, string> = {
  healthy: 'Operativo',
  degraded: 'Degradato',
  error: 'Errore',
  unknown: 'Sconosciuto',
  paused: 'In pausa',
};
