import { ChangeDetectionStrategy, Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AdapterType, ADAPTER_TYPE_LABELS } from '../federation.interface';
import { AdapterOption } from './adapter-type-selector.interface';


@Component({
  selector: 'dymer-adapter-type-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AdapterTypeSelectorComponent),
      multi: true,
    },
  ],
  templateUrl: './adapter-type-selector.component.html',
  styleUrl: './adapter-type-selector.component.scss',
})
export class AdapterTypeSelectorComponent implements ControlValueAccessor {
  readonly disabled = input(false);

  value: AdapterType | null = null;

  readonly options: AdapterOption[] = [
    {
      value: 'dymer',
      label: ADAPTER_TYPE_LABELS.dymer,
      description: 'Federazione tra istanze DYMER native',
      available: true,
    },
    {
      value: 'true-connector',
      label: ADAPTER_TYPE_LABELS['true-connector'],
      description: 'Harvesting via True Connector / self-description IDS',
      available: true,
    },
    {
      value: 'dcat-generic',
      label: ADAPTER_TYPE_LABELS['dcat-generic'],
      description: 'Catalogo DCAT-AP esterno generico',
      available: true,
    },
    {
      value: 'dcp',
      label: ADAPTER_TYPE_LABELS.dcp,
      description: 'Decentralized Claims Protocol',
      available: false,
    },
    {
      value: 'ssi',
      label: ADAPTER_TYPE_LABELS.ssi,
      description: 'Self-Sovereign Identity',
      available: false,
    },
    {
      value: 'simpl',
      label: ADAPTER_TYPE_LABELS.simpl,
      description: 'SIMPL middleware',
      available: false,
    },
  ];

  private onChange: (value: AdapterType | null) => void = () => {};
  private onTouched: () => void = () => {};

  select(value: AdapterType): void {
    if (this.disabled()) return;
    this.value = value;
    this.onChange(value);
    this.onTouched();
  }

  writeValue(value: AdapterType | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: AdapterType | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
