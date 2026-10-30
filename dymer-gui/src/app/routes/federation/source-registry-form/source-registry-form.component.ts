import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdapterTypeSelectorComponent } from '../adapter-type-selector/adapter-type-selector.component';
import { TrueConnectorConfigComponent } from '../true-connector-config/true-connector-config.component';
import { FederationConfigService } from '../federation-config.service';
import { AdapterType, SourceRegistryEntry, SourceRegistryFormValue } from '../federation.interface';

@Component({
  selector: 'dymer-source-registry-form',
  standalone: true,
  imports: [ReactiveFormsModule, AdapterTypeSelectorComponent, TrueConnectorConfigComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './source-registry-form.component.html',
  styleUrl: './source-registry-form.component.scss',
})
export class SourceRegistryFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly federationService = inject(FederationConfigService);

  /** Se valorizzato, il form lavora in modalità edit su questa entry. */
  readonly initialValue = input<SourceRegistryEntry | null>(null);

  readonly saved = output<SourceRegistryEntry>();
  readonly cancelled = output<void>();

  readonly saving = signal(false);
  readonly testing = signal(false);
  readonly testResult = signal<{ ok: boolean; message: string } | null>(null);

  readonly editingId = computed(() => this.initialValue()?.id ?? null);

  readonly trueConnectorGroup = this.fb.group({
    connectorEndpoint: [''],
    selfDescriptionUrl: [''],
    identityProvider: [''],
    clientId: [''],
    certificateAlias: [''],
    credentialsSecret: [''],
  });

  readonly form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    endpoint: ['', Validators.required],
    adapterType: ['dymer' as AdapterType, Validators.required],
    pollIntervalMinutes: [15, [Validators.required, Validators.min(1)]],
    pushEnabled: [true],
    enabled: [true],
    trustLevel: ['standard' as const, Validators.required],
    autoCreatePolicy: ['profile-only' as const, Validators.required],
  });

  readonly isTrueConnector = computed(() => this.form.get('adapterType')?.value === 'true-connector');

  constructor() {
    const initial = this.initialValue();
    if (initial) {
      this.form.patchValue({
        name: initial.name,
        description: initial.description ?? '',
        endpoint: initial.endpoint,
        adapterType: initial.adapterType,
        pollIntervalMinutes: initial.pollIntervalMinutes,
        pushEnabled: initial.pushEnabled,
        enabled: initial.enabled,
        trustLevel: initial.trustLevel as any,
        autoCreatePolicy: initial.autoCreatePolicy as any,
      });
      if (initial.trueConnectorConfig) {
        this.trueConnectorGroup.patchValue({
          connectorEndpoint: initial.trueConnectorConfig.connectorEndpoint ?? '',
          selfDescriptionUrl: initial.trueConnectorConfig.selfDescriptionUrl ?? '',
          identityProvider: initial.trueConnectorConfig.identityProvider ?? '',
          clientId: initial.trueConnectorConfig.clientId ?? '',
          certificateAlias: initial.trueConnectorConfig.certificateAlias ?? '',
        });
      }
    }
  }

  private buildPayload(): SourceRegistryFormValue {
    const value = this.form.getRawValue();
    return {
      ...value,
      description: value.description ?? undefined,
      trueConnectorConfig: this.isTrueConnector() ? this.trueConnectorGroup.getRawValue() : undefined,
    } as SourceRegistryFormValue;
  }

  async testConnection(): Promise<void> {
    this.testing.set(true);
    this.testResult.set(null);
    try {
      const result = await this.federationService.testConnection(this.buildPayload());
      this.testResult.set(result);
    } catch {
      this.testResult.set({ ok: false, message: 'Impossibile completare il test di connessione.' });
    } finally {
      this.testing.set(false);
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.saving.set(true);
    try {
      const payload = this.buildPayload();
      const result = this.editingId()
        ? await this.federationService.updateSource(this.editingId()!, payload)
        : await this.federationService.createSource(payload);
      this.saved.emit(result);
    } finally {
      this.saving.set(false);
    }
  }
}
