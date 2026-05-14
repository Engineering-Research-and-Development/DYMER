import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Webhook } from '../webhooks.service';

@Component({
    selector: 'app-webhook-list',
    templateUrl: './webhook-list.component.html',
    styleUrls: ['./webhook-list.component.scss']
})
export class WebhookListComponent {
    @Input() webhooks: Webhook[] = [];
    @Output() edit = new EventEmitter<Webhook>();
    @Output() delete = new EventEmitter<string>();
    @Output() test = new EventEmitter<Webhook>();
    @Output() logs = new EventEmitter<Webhook>();

    onEdit(webhook: Webhook): void {
        this.edit.emit(webhook);
    }

    onDelete(id: string): void {
        this.delete.emit(id);
    }

    onTest(webhook: Webhook): void {
        this.test.emit(webhook);
    }

    onLogs(webhook: Webhook): void {
        this.logs.emit(webhook);
    }

    getEventLabel(eventType: string): string {
        const labels: Record<string, string> = {
            'entity.created': 'Created',
            'entity.updated': 'Updated',
            'entity.deleted': 'Deleted'
        };
        return labels[eventType] || eventType;
    }
}