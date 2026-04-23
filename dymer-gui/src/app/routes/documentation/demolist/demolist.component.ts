import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MtxAlertModule } from '@ng-matero/extensions/alert';
import { MtxProgressModule } from '@ng-matero/extensions/progress';
import { DemoListService } from './demolist.service';
import { TranslateModule } from '@ngx-translate/core';
import { MtxGridModule } from '@ng-matero/extensions/grid';
import { PageHeaderComponent } from '@shared';
import { ApiService } from '@core/services/api.service';
import { MatIconModule } from '@angular/material/icon';
import { KpiMinicardComponent } from '@shared';
import { RouterOutlet } from '@angular/router';
import hljs from 'highlight.js';

@Component({
  selector: 'app-demolist',
  templateUrl: './demolist.component.html',
  styleUrl: './demolist.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [DemoListService],
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
    MatIconModule
    ],
})
export class DemoListComponent implements AfterViewInit {
  // Oggetto per tenere traccia dello stato di apertura di ogni modale
  public isModalOpen: { [key: string]: boolean } = {
    myModalRList: false,
    myModalRListD: false,
  };
  public downloadBaseUrl: string;

  constructor(private apiService: ApiService) {
    // The baseUrl from ApiService is like 'http://localhost:8080/api'
    // We remove the '/api' part to get the root of the backend server for the download link.
    this.downloadBaseUrl = this.apiService.baseUrl.replace('/api', '');
  }

  ngAfterViewInit() {
    hljs.highlightAll();
  }

  /**
   * Apre un modale basato sul suo ID.
   * @param modalId L'ID del modale da aprire.
   */
  openModal(modalId: string): void {
    this.isModalOpen[modalId] = true;
  }

  /**
   * Chiude un modale basato sul suo ID.
   * @param modalId L'ID del modale da chiudere.
   */
  closeModal(modalId: string): void {
    this.isModalOpen[modalId] = false;
  }
}