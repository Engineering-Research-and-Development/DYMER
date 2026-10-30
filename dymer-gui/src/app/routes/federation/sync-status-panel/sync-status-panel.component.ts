import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FederationConfigService } from '../federation-config.service';
import { SourceHealthBadgeComponent } from '../source-health-badge/source-health-badge.component';

@Component({
  selector: 'dymer-sync-status-panel',
  standalone: true,
  imports: [DatePipe, SourceHealthBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sync-status-panel.component.html',
  styleUrl: './sync-status-panel.component.scss',
})
export class SyncStatusPanelComponent {
  readonly federationService = inject(FederationConfigService);
}
