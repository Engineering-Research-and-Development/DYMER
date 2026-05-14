import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { WebhooksService, Webhook } from '../webhooks.service';

@Component({
    selector: 'app-webhook-test',
    templateUrl: './webhook-test.component.html',
    styleUrls: ['./webhook-test.component.scss']
})
export class WebhookTestComponent {
    @Input() webhook: Webhook | null = null;
    @Output() back = new EventEmitter<void>();

    testForm!: FormGroup;
    testResult: any = null;
    isTestRunning = false;
    testSuccess = false;

    constructor(
        private fb: FormBuilder,
        private webhooksService: WebhooksService
    ) {
        this.testForm = this.fb.group({
            testPayload: ['{"message": "Test payload from DYMER"}']
        });
    }

    /**
     * Run the webhook test
     */
    runTest(): void {
        if (!this.webhook) return;

        this.isTestRunning = true;
        this.testResult = null;

        try {
            const testData = JSON.parse(this.testForm.get('testPayload')?.value || '{}');
            this.webhooksService.testWebhook(this.webhook, testData).subscribe({
                next: (response) => {
                    this.testResult = response;
                    this.testSuccess = response.success !== false;
                    this.isTestRunning = false;
                },
                error: (error) => {
                    this.testResult = {
                        success: false,
                        error: error.message,
                        details: error
                    };
                    this.testSuccess = false;
                    this.isTestRunning = false;
                }
            });
        } catch (error) {
            this.testResult = {
                success: false,
                error: 'Invalid JSON in test payload'
            };
            this.testSuccess = false;
            this.isTestRunning = false;
        }
    }

    /**
     * Go back to list
     */
    onBack(): void {
        this.back.emit();
    }
}