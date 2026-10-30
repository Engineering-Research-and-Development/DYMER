import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { SourceHealthStatus, HEALTH_LABELS } from '../federation.interface';

@Component({
  selector: 'dymer-source-health-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './source-health-badge.component.html',
  styleUrl: './source-health-badge.component.scss',
})
export class SourceHealthBadgeComponent {
  readonly status = input.required<SourceHealthStatus>();
  readonly label = computed(() => HEALTH_LABELS[this.status()]);
}
