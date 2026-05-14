import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WebhooksService, Webhook } from '../webhooks.service';

@Component({
    selector: 'app-webhook-form',
    templateUrl: './webhook-form.component.html',
    styleUrls: ['./webhook-form.component.scss']
})
export class WebhookFormComponent implements OnInit {
    @Input() webhook: Webhook | null = null;
    @Output() saved = new EventEmitter<Webhook>();
    @Output() deleted = new EventEmitter<string>();
    @Output() cancelled = new EventEmitter<void>();

    webhookForm!: FormGroup;
    isSubmitting = false;
    errorMessage: string | null = null;
    successMessage: string | null = null;

    eventTypes = [
        { value: 'entity.created', label: 'Entity Created' },
        { value: 'entity.updated', label: 'Entity Updated' },
        { value: 'entity.deleted', label: 'Entity Deleted' }
    ];

    httpMethods = ['POST', 'PUT', 'GET', 'DELETE'];

    // --- Preset Logic ---
    readonly WEBHOOK_PRESETS = {
        n8n: {
            label: 'n8n Workflow',
            icon: 'assets/icons/n8n.png', // Placeholder for icon path
            defaultUrl: 'https://n8n.your-company.com/webhook/',
            method: 'POST',
            headers: { 'Authorization': 'Bearer YOUR_N8N_TOKEN' },
            description: 'Automate workflows, integrate with ERP/CRM, send notifications.'
        },
        make: {
            label: 'Make (ex Integromat)',
            icon: 'assets/icons/make.png', // Placeholder for icon path
            defaultUrl: 'https://hook.us1.make.com/',
            method: 'POST',
            headers: { 'x-api-key': 'YOUR_MAKE_KEY' },
            description: 'AI data enrichment with LLMs (OpenAI/GPT-4), content generation.'
        },
        pinecone: {
            label: 'Pinecone Vector DB',
            icon: 'assets/icons/pinecone.png', // Placeholder for icon path
            defaultUrl: 'https://your-index.svc.pinecone.io/vectors/upsert',
            method: 'POST',
            headers: { 'Api-Key': 'YOUR_PINECONE_KEY' },
            description: 'Enable semantic search and similar product recommendations.'
        },
        custom: {
            label: 'Custom Webhook',
            icon: 'fas fa-code',
            defaultUrl: 'https://',
            method: 'POST',
            headers: {},
            description: 'Manual configuration for generic endpoints.'
        }
    };

    selectedPresetKey: string = 'custom';
    activeHeaders: Record<string, string> = {};
    // --- End Preset Logic ---

    constructor(
        private fb: FormBuilder,
        private webhooksService: WebhooksService
    ) {}

    ngOnInit(): void {
        this.initializeForm();
        if (this.webhook && this.webhook.headers) {
            this.activeHeaders = { ...this.webhook.headers };
        }
    }

    /**
     * Initialize the form with webhook data
     */
    initializeForm(): void {
        this.webhookForm = this.fb.group({
            _index: [this.webhook?._index || '', Validators.required],
            _type: [this.webhook?._type || '', Validators.required],
            microserviceType: [this.webhook?.microserviceType || 'dymer-entities', Validators.required],
            eventType: [this.webhook?.eventType || 'entity.created', Validators.required],
            webhookUrl: [this.webhook?.webhookUrl || '', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
            httpMethod: [this.webhook?.httpMethod || 'POST', Validators.required],
            payloadTemplate: [this.webhook?.payloadTemplate || ''],
            isActive: [this.webhook?.isActive ?? true],
            headers: [this.webhook?.headers || {}] // Initialize headers form control
        });

        // If editing an existing webhook, try to match a preset or default to custom
        if (this.webhook && !this.webhook._id) { // Only for new webhooks or if no ID is present (meaning it's a new form)
            this.applyPreset('custom', this.WEBHOOK_PRESETS['custom']);
        } else if (this.webhook) {
            // Try to match existing webhook to a preset
            const matchedPreset = Object.entries(this.WEBHOOK_PRESETS).find(([, preset]) =>
                this.webhook?.webhookUrl.startsWith(preset.defaultUrl.split('//')[0] + '//' + preset.defaultUrl.split('//')[1].split('/')[0])
            );
            if (matchedPreset) {
                this.selectedPresetKey = matchedPreset[0];
            } else {
                this.selectedPresetKey = 'custom';
            }
        }
    }

    /**
     * Apply selected preset values to the form
     */
    applyPreset(key: string, preset: any): void {
        this.selectedPresetKey = key;
        this.webhookForm.patchValue({
            webhookUrl: preset.defaultUrl,
            httpMethod: preset.method,
            payloadTemplate: key === 'n8n' ? '{\n  "id": "{{_id}}",\n  "action": "sync",\n  "entity": {{this}}\n}' : (key === 'make' ? '{\n  "entity": {{this}},\n  "event": "{{eventType}}"\n}' : '')
        });
        this.activeHeaders = { ...preset.headers };
        this.webhookForm.get('headers')?.setValue(this.activeHeaders);
    }

    /**
     * Add a custom header to the active headers list
     */
    addHeader(name: string, value: string): void {
        if (name && value) {
            this.activeHeaders = { ...this.activeHeaders, [name]: value };
            this.webhookForm.get('headers')?.setValue(this.activeHeaders);
        }
    }

    /**
     * Remove a header from the active headers list
     */
    removeHeader(name: string): void {
        const newHeaders = { ...this.activeHeaders };
        delete newHeaders[name];
        this.activeHeaders = newHeaders;
        this.webhookForm.get('headers')?.setValue(this.activeHeaders);
    }

    /**
     * Submit the form to save the webhook
     */
    onSubmit(): void {
        // Ensure headers are updated in the form before submission
        this.webhookForm.get('headers')?.setValue(this.activeHeaders);

        if (this.webhookForm.invalid) {
            this.errorMessage = 'Please fill in all required fields correctly.';
            return;
        }

        this.isSubmitting = true;
        this.errorMessage = null;
        this.successMessage = null;

        const formData = this.webhookForm.value;

        if (this.webhook?._id) {
            // Update existing webhook
            this.webhooksService.updateWebhook(this.webhook._id, formData).subscribe({
                next: (response) => {
                    this.successMessage = 'Webhook updated successfully!';
                    this.isSubmitting = false;
                    setTimeout(() => this.saved.emit(response.data), 1500);
                },
                error: (error) => {
                    console.error('Error updating webhook:', error);
                    this.errorMessage = 'Failed to update webhook. Please try again.';
                    this.isSubmitting = false;
                }
            });
        } else {
            // Create new webhook
            this.webhooksService.createWebhook(formData).subscribe({
                next: (response) => {
                    this.successMessage = 'Webhook created successfully!';
                    this.isSubmitting = false;
                    setTimeout(() => this.saved.emit(response.data), 1500);
                },
                error: (error) => {
                    console.error('Error creating webhook:', error);
                    this.errorMessage = 'Failed to create webhook. Please try again.';
                    this.isSubmitting = false;
                }
            });
        }
    }

    /**
     * Cancel and go back to list
     */
    onCancel(): void {
        this.cancelled.emit();
    }

    /**
     * Delete the webhook
     */
    onDelete(): void {
        if (!this.webhook?._id) return;

        if (confirm('Are you sure you want to delete this webhook?')) {
            this.webhooksService.deleteWebhook(this.webhook._id).subscribe({
                next: () => {
                    this.successMessage = 'Webhook deleted successfully!';
                    setTimeout(() => this.deleted.emit(this.webhook!._id!), 1500);
                },
                error: (error) => {
                    console.error('Error deleting webhook:', error);
                    this.errorMessage = 'Failed to delete webhook. Please try again.';
                }
            });
        }
    }
}
