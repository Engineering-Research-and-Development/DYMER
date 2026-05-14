import { inject } from '@angular/core';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
//import { environment } from '../../../environments/environment';


import {ApiService} from '@core/services/api.service';


export interface Webhook {
    _id?: string;
    _index: string;
    _type: string;
    microserviceType: string;
    eventType: 'entity.created' | 'entity.updated' | 'entity.deleted';
    webhookUrl: string;
    httpMethod: 'POST' | 'PUT' | 'GET' | 'DELETE';
    headers?: Record<string, string>;
    payloadTemplate?: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

@Injectable({
    providedIn: 'root'
} )
export class WebhooksService {
    private apiService = inject(ApiService);
    private apiUrl = `${this.apiService.endpoints.hooks.getHooks}`;

    constructor(private http: HttpClient ) {}

    /**
     * Retrieve all webhooks
     */
    getWebhooks(query?: any): Observable<any> {
        let params = '';
        if (query) {
            params = '?' + Object.keys(query)
                .map(key => `${key}=${encodeURIComponent(JSON.stringify(query[key]))}`)
                .join('&');
        }
        return this.http.get(`${this.apiUrl}/hooks/${params}` );
    }

    /**
     * Retrieve a single webhook by ID
     */
    getWebhookById(id: string): Observable<Webhook> {
        return this.http.get<Webhook>(`${this.apiUrl}/hook/${id}` );
    }

    /**
     * Create a new webhook
     */
    createWebhook(webhook: Webhook): Observable<any> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        const payload = {
            op_index: webhook._index,
            op_type: webhook._type,
            op_microserviceType: webhook.microserviceType,
            op_eventType: webhook.eventType,
            op_webhookUrl: webhook.webhookUrl,
            op_httpMethod: webhook.httpMethod,
            op_headers: webhook.headers || {},
            op_payloadTemplate: webhook.payloadTemplate || '',
            op_isActive: webhook.isActive
        };
        return this.http.post(`${this.apiUrl}/addhook`, payload, { headers } );
    }

    /**
     * Update an existing webhook
     */
    updateWebhook(id: string, webhook: Webhook): Observable<any> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        const payload = {
            _id: id,
            op_index: webhook._index,
            op_type: webhook._type,
            op_microserviceType: webhook.microserviceType,
            op_eventType: webhook.eventType,
            op_webhookUrl: webhook.webhookUrl,
            op_httpMethod: webhook.httpMethod,
            op_headers: webhook.headers || {},
            op_payloadTemplate: webhook.payloadTemplate || '',
            op_isActive: webhook.isActive
        };
        return this.http.put(`${this.apiUrl}/hook/${id}`, payload, { headers } );
    }

    /**
     * Delete a webhook
     */
    deleteWebhook(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/hook/${id}` );
    }

    /**
     * Test a webhook by sending a test payload
     */
    testWebhook(webhook: Webhook, testData?: any): Observable<any> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        const payload = {
            webhook: webhook,
            testData: testData || { message: 'Test payload from DYMER' }
        };
        return this.http.post(`${this.apiUrl}/test-webhook`, payload, { headers } );
    }
}