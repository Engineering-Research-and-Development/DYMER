import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';

@Component({
  selector: 'dymer-true-connector-config',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './true-connector-config.component.html',
  styleUrl: './true-connector-config.component.scss',
})
export class TrueConnectorConfigComponent {
  readonly formGroup = input.required<FormGroup>();
}
