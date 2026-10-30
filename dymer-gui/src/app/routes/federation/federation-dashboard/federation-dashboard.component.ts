import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SourceRegistryListComponent } from '../source-registry-list/source-registry-list.component';
import { SourceRegistryFormComponent } from '../source-registry-form/source-registry-form.component';
import { SyncStatusPanelComponent } from '../sync-status-panel/sync-status-panel.component';
import { SourceRegistryEntry } from '../federation.interface';

type FederationTab = 'sources' | 'status';
type ViewMode = 'list' | 'create' | 'edit';

@Component({
  selector: 'dymer-federation-dashboard',
  standalone: true,
  imports: [SourceRegistryListComponent, SourceRegistryFormComponent, SyncStatusPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './federation-dashboard.component.html',
  styleUrl: './federation-dashboard.component.scss',
})
export class FederationDashboardComponent {
  readonly activeTab = signal<FederationTab>('sources');
  readonly viewMode = signal<ViewMode>('list');
  readonly editingSource = signal<SourceRegistryEntry | null>(null);

  setTab(tab: FederationTab): void {
    this.activeTab.set(tab);
    if (tab === 'sources') {
      this.viewMode.set('list');
    }
  }

  openCreate(): void {
    this.editingSource.set(null);
    this.viewMode.set('create');
  }

  openEdit(source: SourceRegistryEntry): void {
    this.editingSource.set(source);
    this.viewMode.set('edit');
  }

  backToList(): void {
    this.viewMode.set('list');
    this.editingSource.set(null);
  }
}
