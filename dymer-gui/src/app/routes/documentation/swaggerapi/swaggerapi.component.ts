import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '@shared';
import { MatCardModule } from '@angular/material/card';
import { HttpErrorResponse } from '@angular/common/http';
import { SwaggerApiService } from './swaggerapi.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-swaggerapi',
  templateUrl: './swaggerapi.component.html',
  styleUrls: ['./swaggerapi.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [SwaggerApiService],
  imports: [
    CommonModule,
    PageHeaderComponent,
    MatCardModule,
    
    MatProgressSpinnerModule,
  ],
})
export class SwaggerApiComponent implements OnInit {
  swaggerDocUrl: SafeResourceUrl | null = null;
  isLoading = true; // Inizia a caricare da subito
  errorMessage: string | null = null;

  constructor(
    private swaggerApiService: SwaggerApiService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSwaggerDoc();
  }

  private loadSwaggerDoc(): void {
    this.errorMessage = null;

    this.swaggerApiService.getSwaggerDocUrl().subscribe({
      next: (response: any) => {
        if (response && response.swaggerDocUrl) {
          // Sanifichiamo l'URL per poterlo usare come src di un iframe
          this.swaggerDocUrl = this.sanitizer.bypassSecurityTrustResourceUrl(response.swaggerDocUrl);
        } else {
          this.isLoading = false;
          this.errorMessage = 'URL della documentazione Swagger non trovato nella risposta.';
        }
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage = "Errore durante il recupero dell'URL della documentazione Swagger.";
        console.error(this.errorMessage, error);
        this.cdr.markForCheck();
      }
    });
  }

  onIframeLoad(): void {
    this.isLoading = false;
    this.cdr.markForCheck();
  }
}