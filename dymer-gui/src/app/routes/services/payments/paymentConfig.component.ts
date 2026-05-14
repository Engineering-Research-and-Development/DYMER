import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { paymentConfigService } from './paymentConfig.service';

@Component({
  selector: 'app-payment-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './paymentConfig.component.html',
  styleUrls: ['./paymentConfig.component.scss']
})
export class PaymentConfigComponent implements OnInit {
 
  isLoading = false;
  activeProvider: 'stripe' | 'paypal' = 'stripe';
  
  // Modello dati allineato allo schema Mongoose
  config: any = {
    isEnabled: false,
    stripe: {
      active: false,
      mode: 'test',
      publicKey: '',
      secretKey: '',
      currency: 'EUR'
    },
    paypal: {
      active: false,
      mode: 'sandbox',
      clientId: '',
      clientSecret: '',
      currency: 'EUR'
    },
    settings: {
      successUrl: '',
      cancelUrl: '',
      autoInvoice: true
    }
  };

  private readonly API_URL = 'api/dservice/payments';

  constructor(
    private http: HttpClient,
    private paymentConfigService: paymentConfigService) {}

  ngOnInit() {
    //this.fetchData();
    this.loadPaymentConfig();
  }


  loadPaymentConfig() {
    this.paymentConfigService.getPaymentConfig().subscribe({
      next: (response: any) => {
        if (response && response.data) {
          console.log('Payment config loaded:', response.data);
          this.config = response.data;
          
        }
      },
      error: (err: any) => console.error('Failed to load payments', err)
    });
  }



  fetchData() {
    this.isLoading = true;
    this.http.get(this.API_URL).subscribe({
      next: (data: any) => {
        if (data) this.config = { ...this.config, ...data };
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  saveConfig() {
    this.isLoading = true;
    this.http.post(this.API_URL, this.config).subscribe({
      next: () => this.isLoading = false,
      error: () => this.isLoading = false
    });
  }
}