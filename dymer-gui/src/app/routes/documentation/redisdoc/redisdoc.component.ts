import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewEncapsulation, ViewChild, ChangeDetectorRef, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MtxAlertModule } from '@ng-matero/extensions/alert';
import { MtxProgressModule } from '@ng-matero/extensions/progress';
import { RedisDocService } from './redisdoc.service';
import { TranslateModule } from '@ngx-translate/core';
import { MtxGridModule } from '@ng-matero/extensions/grid';
import { PageHeaderComponent } from '@shared';
import { ApiService } from '@core/services/api.service';
import { MatIconModule } from '@angular/material/icon';
import { KpiMinicardComponent } from '@shared';
import { RouterOutlet, RouterLink } from '@angular/router';
import { HighlightDirective } from '@shared/directives/highlight.directive';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import xml from 'highlight.js/lib/languages/xml'; // For HTML

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('html', xml);

@Component({
  selector: 'app-redisdoc',
  templateUrl: './redisdoc.component.html',
  styleUrl: './redisdoc.component.scss',
  encapsulation: ViewEncapsulation.None, // Disabilita l'incapsulamento degli stili
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [RedisDocService],
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatListModule,
    MatGridListModule,
    MatTableModule,
    MatTabsModule,
    MtxProgressModule,
    MtxAlertModule,
    TranslateModule,
    MtxGridModule,
     MatIconModule,
     HighlightDirective,
  ],
})
export class RedisDocComponent implements OnInit, AfterViewInit {

  public codeBlockExample1!: string;
  public codeBlockValidation1!: string;
  public codeBlockValidation2!: string;
  public codeRedisConfig!: string;

  @ViewChild('codeBlockRedis') codeBlockRedisRef!: ElementRef;

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.codeRedisConfig = `
"cache": {
    "protocol": "http",
    "host": "127.0.0.1",
    "ip": "cache",
    "port": <redis port>,
    "user": "redis",
    "password": "<redis password>",
    "isEnabled": true
    }
`;
  }
  
  ngAfterViewInit(): void {
    // We need to trigger change detection manually to ensure the code blocks are in the DOM
    this.cdr.detectChanges();

    if (this.codeBlockRedisRef) {
      hljs.highlightElement(this.codeBlockRedisRef.nativeElement);
    }
  }

  scrollToTop(event: Event): void {
    event.preventDefault();
    const mainPanel = document.querySelector('.main-panel');
    if (mainPanel) {
      mainPanel.scrollTop = 0;
    }
  }

  scrollToAnchor(elementId: string, event: MouseEvent): void {
    event.preventDefault();
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    }
  }

}