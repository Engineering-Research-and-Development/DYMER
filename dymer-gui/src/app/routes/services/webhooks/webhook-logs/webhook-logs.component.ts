import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Webhook } from '../webhooks.service';

// Placeholder for a Webhook Log Entry. This would typically come from a backend service.
export interface WebhookLogEntry {
    id: string;
    timestamp: Date;
    status: number;
    message: string;
    payloadSent: any;
    responseReceived: any;
    error?: any;
}

@Component({
    selector: 'app-webhook-logs',
    templateUrl: './webhook-logs.component.html',
    styleUrls: ['./webhook-logs.component.scss']
})
export class WebhookLogsComponent implements OnInit {
    @Input() webhook: Webhook | null = null;
    @Output() back = new new EventEmitter<void>();

    logs: WebhookLogEntry[] = [];
    isLoading = false;
    errorMessage: string | null = null;

    constructor() { }

    ngOnInit(): void {
        if (this.webhook) {
            this.loadWebhookLogs(this.webhook._id!);
        }
    }

    /**
     * Loads logs for the selected webhook.
     * NOTE: This is a placeholder. In a real application, this would call a backend API.
     */
    loadWebhookLogs(webhookId: string): void {
        this.isLoading = true;
        this.errorMessage = null;

        // Simulate API call
        setTimeout(() => {
            if (webhookId === 'mock-error-id') {
                this.errorMessage = 'Failed to load logs for this webhook.';
                this.logs = [];
            } else {
                this.logs = [
                    {
                        id: 'log-1',
                        timestamp: new Date(),
                        status: 200,
                        message: 'Webhook successfully invoked.',
                        payloadSent: { entityId: '123', event: 'created' },
                        responseReceived: { status: 'success' }
                    },
                    {
                        id: 'log-2',
                        timestamp: new Date(Date.now() - 3600000),
                        status: 500,
                        message: 'Webhook invocation failed: Remote server error.',
                        payloadSent: { entityId: '456', event: 'updated' },
                        responseReceived: { error: 'Internal Server Error' },
                        error: 'Connection timed out'
                    }
                ];
            }
            this.isLoading = false;
        }, 1000);

        // TODO: Implement actual API call to dymer-services for webhook logs
        // this.webhooksService.getWebhookLogs(webhookId).subscribe({
        //     next: (response) => {
        //         this.logs = response.data;
        //         this.isLoading = false;
        //     },
        //     error: (error) => {
        //         this.errorMessage = 'Failed to load webhook logs.';
        //         this.isLoading = false;
        //     }
        // });
    }

    onBack(): void {
        this.back.emit();
    }
}
