import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FederationConfigService } from '../federation-config.service';
import { SourceHealthBadgeComponent } from '../source-health-badge/source-health-badge.component';
import { ADAPTER_TYPE_LABELS, SourceRegistryEntry } from '../federation.interface';

@Component({
  selector: 'dymer-source-registry-list',
  standalone: true,
  imports: [DatePipe, SourceHealthBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './source-registry-list.component.html',
  styleUrl: './source-registry-list.component.scss',
})
export class SourceRegistryListComponent {
  readonly federationService = inject(FederationConfigService);

  readonly createRequested = output<void>();
  readonly editRequested = output<SourceRegistryEntry>();

  readonly busyId = signal<string | null>(null);

  adapterLabel(source: SourceRegistryEntry): string {
    return ADAPTER_TYPE_LABELS[source.adapterType];
  }

  async sync(id: string): Promise<void> {
    this.busyId.set(id);
    try {
      await this.federationService.triggerSync(id);
    } finally {
      this.busyId.set(null);
    }
  }

  async pause(id: string): Promise<void> {
    await this.federationService.pauseSource(id);
  }

  async resume(id: string): Promise<void> {
    await this.federationService.resumeSource(id);
  }

  async remove(source: SourceRegistryEntry): Promise<void> {
    const confirmed = confirm(`Eliminare la fonte "${source.name}"? L'operazione non è reversibile.`);
    if (!confirmed) return;
    await this.federationService.deleteSource(source.id);
  }
}
