import { Component, OnInit } from '@angular/core';
import { WebhooksService, Webhook } from './webhooks.service';
import { WebhookFormComponent  } from './webhook-form/webhook-form.component';
import { WebhookListComponent } from './webhook-list/webhook-list.component';
import { WebhookTestComponent } from './webhook-test/webhook-test.component';
import { WebhookLogsComponent } from './webhook-logs/webhook-logs.component';

@Component({
    selector: 'app-webhooks',
    templateUrl: './webhooks.component.html',
    styleUrls: ['./webhooks.component.scss'],
    standalone: true, // Mark as standalone component
    imports: [WebhookListComponent, WebhookFormComponent, WebhookTestComponent, WebhookLogsComponent] // Import standalone components
})
export class WebhooksComponent implements OnInit {
    webhooks: Webhook[] = [];
    selectedWebhook: Webhook | null = null;
    currentView: 'list' | 'form' | 'test' | 'logs' = 'list';
    isLoading = false;
    errorMessage: string | null = null;

    constructor(private webhooksService: WebhooksService) {}

    ngOnInit(): void {
        this.loadWebhooks();
    }

    /**
     * Load all webhooks from the API
     */
    loadWebhooks(): void {
        this.isLoading = true;
        this.errorMessage = null;
        this.webhooksService.getWebhooks().subscribe({
            next: (response: any) => {
                this.webhooks = response.data || [];
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading webhooks:', error);
                this.errorMessage = 'Failed to load webhooks. Please try again.';
                this.isLoading = false;
            }
        });
    }

    /**
     * Switch to list view
     */
    showList(): void {
        this.currentView = 'list';
        this.selectedWebhook = null;
        this.loadWebhooks();
    }

    /**
     * Switch to form view for creating a new webhook
     */
    showCreateForm(): void {
        this.selectedWebhook = {
            _index: '',
            _type: '',
            microserviceType: 'dymer-entities',
            eventType: 'entity.created',
            webhookUrl: '',
            httpMethod: 'POST',
            headers: {},
            payloadTemplate: '',
            isActive: true
        };
        this.currentView = 'form';
    }

    /**
     * Switch to form view for editing an existing webhook
     */
    showEditForm(webhook: Webhook): void {
        this.selectedWebhook = { ...webhook };
        this.currentView = 'form';
    }

    /**
     * Switch to test view
     */
    showTestView(webhook: Webhook): void {
        this.selectedWebhook = webhook;
        this.currentView = 'test';
    }

    /**
     * Switch to logs view
     */
    showLogs(webhook: Webhook): void {
        this.selectedWebhook = webhook;
        this.currentView = 'logs';
    }

    /**
     * Delete a webhook
     */
    deleteWebhook(id: string): void {
        if (confirm('Are you sure you want to delete this webhook?')) {
            this.webhooksService.deleteWebhook(id).subscribe({
                next: () => {
                    this.loadWebhooks();
                },
                error: (error) => {
                    console.error('Error deleting webhook:', error);
                    this.errorMessage = 'Failed to delete webhook.';
                }
            });
        }
    }

    /**
     * Handle webhook save event from the form component
     */
    onWebhookSaved(): void {
        this.showList();
    }

    /**
     * Handle webhook delete event from the form component
     */
    onWebhookDeleted(): void {
        this.showList();
    }
}
