import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  SourceRegistryEntry,
  SourceRegistryFormValue,
  SourceSyncStatus,
} from './federation.interface';

const API_BASE = '/api/v1/federation';

/**
 * Service centrale per la sezione Federation di dymer-gui.
 * Usa httpResource per le letture reattive (auto-refresh su trigger del signal)
 * e HttpClient diretto per le mutazioni (create/update/delete/azioni).
 */
@Injectable({ providedIn: 'root' })
export class FederationConfigService {
  private readonly http = inject(HttpClient);

  // Trigger incrementale: cambiandolo si forza il refetch di sourcesResource.
  private readonly refreshTrigger = signal(0);

  /**
   * Risorsa reattiva con la lista completa delle fonti registrate.
   * Si aggiorna automaticamente quando refreshTrigger cambia.
   */
  readonly sourcesResource = httpResource<SourceRegistryEntry[]>(() => {
    // Leggere il signal qui dentro lo rende una dipendenza reattiva della resource.
    this.refreshTrigger();
    return `${API_BASE}/sources`;
  });

  readonly sources = computed(() => this.sourcesResource.value() ?? []);
  readonly isLoading = computed(() => this.sourcesResource.isLoading());
  readonly loadError = computed(() => this.sourcesResource.error());

  readonly healthySourcesCount = computed(
    () => this.sources().filter((s) => s.syncStatus?.health === 'healthy').length,
  );
  readonly errorSourcesCount = computed(
    () => this.sources().filter((s) => s.syncStatus?.health === 'error').length,
  );
  readonly pendingCatalogsTotal = computed(() =>
    this.sources().reduce((acc, s) => acc + (s.syncStatus?.pendingCatalogsCount ?? 0), 0),
  );

  /** Forza il refresh della lista fonti (es. dopo create/update/delete o azione manuale). */
  refresh(): void {
    this.refreshTrigger.update((v) => v + 1);
  }

  /** Recupera una singola fonte per id (lettura puntuale, non reattiva). */
  async getSource(id: string): Promise<SourceRegistryEntry> {
    return firstValueFrom(this.http.get<SourceRegistryEntry>(`${API_BASE}/sources/${id}`));
  }

  async createSource(value: SourceRegistryFormValue): Promise<SourceRegistryEntry> {
    const created = await firstValueFrom(
      this.http.post<SourceRegistryEntry>(`${API_BASE}/sources`, value),
    );
    this.refresh();
    return created;
  }

  async updateSource(id: string, value: SourceRegistryFormValue): Promise<SourceRegistryEntry> {
    const updated = await firstValueFrom(
      this.http.put<SourceRegistryEntry>(`${API_BASE}/sources/${id}`, value),
    );
    this.refresh();
    return updated;
  }

  async deleteSource(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${API_BASE}/sources/${id}`));
    this.refresh();
  }

  async pauseSource(id: string): Promise<void> {
    await firstValueFrom(this.http.post<void>(`${API_BASE}/sources/${id}/pause`, {}));
    this.refresh();
  }

  async resumeSource(id: string): Promise<void> {
    await firstValueFrom(this.http.post<void>(`${API_BASE}/sources/${id}/resume`, {}));
    this.refresh();
  }

  /** Forza una sync immediata (bypassa l'attesa del prossimo ciclo di poll). */
  async triggerSync(id: string): Promise<void> {
    await firstValueFrom(this.http.post<void>(`${API_BASE}/sources/${id}/sync`, {}));
    this.refresh();
  }

  async getSyncStatus(id: string): Promise<SourceSyncStatus> {
    return firstValueFrom(this.http.get<SourceSyncStatus>(`${API_BASE}/sources/${id}/status`));
  }

  /** Test di connessione, usato dal form prima del salvataggio. */
  async testConnection(value: SourceRegistryFormValue): Promise<{ ok: boolean; message: string }> {
    return firstValueFrom(
      this.http.post<{ ok: boolean; message: string }>(`${API_BASE}/sources/test-connection`, value),
    );
  }
}
