import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service'; 


export interface paymentConfigServicePayload {
  [key: string]: any;
}

export interface payments {
  _id: string;
    isEnabled: boolean;
    stripe: {
      active: boolean;
      mode: 'test' | 'live';   
        publicKey: string;  
        secretKey: string;
        currency: string;
    };
    paypal: {
      active: boolean;
      mode: 'sandbox' | 'live';
        clientId: string;
        clientSecret: string;  
        currency: string;
    };
    settings: {
        successUrl: string;
        cancelUrl: string;
        autoInvoice: boolean;
    };
  
 
}

@Injectable({
  providedIn: 'root',
})

export class paymentConfigService {
  private apiService = inject(ApiService);
  constructor(private client: HttpClient) {}

   getPaymentConfig(): Observable<payments> {
    return this.client.get<payments>(this.apiService.endpoints.payments.getPayments, {
      withCredentials: true,
    });
  }

  updatePaymentConfig(config: payments): Observable<payments> {
    return this.client.put<payments>(this.apiService.endpoints.payments.createPayment, { data: config }, {
      withCredentials: true,
    });
  }

 

  
  }