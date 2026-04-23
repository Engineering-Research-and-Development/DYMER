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
import { FixProblemsService } from './fixproblems.service';
import { TranslateModule } from '@ngx-translate/core';
import { MtxGridModule } from '@ng-matero/extensions/grid';
import { PageHeaderComponent } from '@shared';
import { MatIconModule } from '@angular/material/icon';
import { KpiMinicardComponent } from '@shared';
import { RouterOutlet } from '@angular/router';
import hljs from 'highlight.js';

@Component({
  selector: 'app-fixproblems',
  templateUrl: './fixproblems.component.html',
  styleUrl: './fixproblems.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [FixProblemsService],
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
    
  ],
})
export class FixProblemsComponent implements AfterViewInit {
  constructor() {}

  ngAfterViewInit() {
    hljs.highlightAll();
  }
}