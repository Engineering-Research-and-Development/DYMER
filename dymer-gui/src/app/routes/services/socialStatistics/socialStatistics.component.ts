import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef, AfterViewInit, ViewChild, TemplateRef, CUSTOM_ELEMENTS_SCHEMA, ViewChildren, QueryList } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule, JsonPipe, DatePipe } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MtxGridModule } from '@ng-matero/extensions/grid';
import { SocialStatisticsService, SocialStat } from './socialStatistics.service';
import { BehaviorSubject } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables, ChartData, ChartConfiguration } from 'chart.js';
 
const barValueLabelPlugin = {
  id: 'barValueLabelPlugin',
  afterDatasetsDraw(chart: any) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset: any, i: number) => {
      if (dataset.label === 'Max') return;
      const meta = chart.getDatasetMeta(i);
      if (!meta.hidden) {
        meta.data.forEach((element: any, index: number) => {
          const data = dataset.data[index];
          if (data !== null && data !== undefined) {
            ctx.fillStyle = '#666';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(data.toString(), element.x + 5, element.y);
          }
        });
      }
    });
  }
};

@Component({
  selector: 'app-socialStatistics',
  templateUrl: './socialStatistics.component.html',
  styles: [`
    .chart-card {
      position: relative;
      overflow: visible;
    }
    .chart-badge {
      position: absolute;
      top: -10px;
      right: -10px;
      background-color: #9c27b0;
      color: white;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      z-index: 10;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatTableModule,
     
    MatDialogModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatRadioModule,
    MatSortModule,
    MatPaginatorModule,
    MtxGridModule,
    BaseChartDirective,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SocialStatisticsComponent implements OnInit, AfterViewInit {
  private refresh$ = new BehaviorSubject<void>(undefined);

  // Properties for Social Statistics
  statsShowFilters = false;
  statsShowCharts = false;
  statsTypes: any[] = [];
  allStats: SocialStat[] = [];
  typeFilter: string = 'all';
  actionFilters: { [key: string]: boolean } = {};
  counterFilters: { [key: string]: boolean } = {};

  statsDataSource = new MatTableDataSource<SocialStat>([]); 
  statsDisplayedColumns: string[] = ['#', 'type', 'title', 'user', 'action', 'counter', 'actions'];
  @ViewChild('statsSort') statsSort!: MatSort;
  @ViewChild('statsPaginator') statsPaginator!: MatPaginator;
  nameFocused = false;
  fileUpload: File | null = null;
  @ViewChildren(MatSort) sorts!: QueryList<MatSort>;

  // Chart properties
  public topViewedChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Views'
    }]
  };

  public topViewedChartOptions: ChartConfiguration['options'] = {
    indexAxis: 'y',
    responsive: true,
    layout: {
      padding: { right: 30 }
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: ''
      },
      tooltip: {
        filter: (item) => item.datasetIndex === 1
      }
    },
    scales: {
      x: { display: true, grid: { display: false }  },
      y: { grid: { display: false } }
    }
  };

  public topLikedChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Likes'
    }]
  };

  public topLikedChartOptions: ChartConfiguration['options'] = {
    indexAxis: 'y',
    responsive: true,
    layout: {
      padding: { right: 30 }
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: ''
      },
      tooltip: {
        filter: (item) => item.datasetIndex === 1
      }
    },
    scales: {
      x: { display: true, grid: { display: false }  },
      y: { grid: { display: false } }
    }
  };

  public typeDistributionChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Count'
    }]
  };

  public typeDistributionChartOptions: ChartConfiguration['options'] = {
    indexAxis: 'y',
    responsive: true,
    layout: {
      padding: { right: 30 }
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: ''
      },
      tooltip: {
        filter: (item) => item.datasetIndex === 1
      }
    },
    scales: {
      x: { display: true, grid: { display: false } },
      y: { grid: { display: false } }
    }
  };

  constructor(
    private librariesService: SocialStatisticsService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    public dialog: MatDialog
  ) {
    Chart.register(...registerables, barValueLabelPlugin);
  }

  ngOnInit(): void {
    this.loadSocialStatisticsData();
    this.setChartTitles();
    this.translate.onLangChange.subscribe(() => {
      this.setChartTitles();
    });
  }

  ngAfterViewInit(): void {
    this.statsDataSource.paginator = this.statsPaginator;
    this.statsDataSource.sort = this.statsSort;
  }

  private loadSocialStatisticsData(): void {
    this.librariesService.getSocialStats().subscribe({
      next: (stats: SocialStat[]) => {
        // Mappiamo i dati per allinearli alle colonne 'user' e 'action' della tabella
        const mappedStats = stats.map(stat => ({
          ...stat,
          user: stat.email,
          action: stat.act,
        }));
        this.allStats = mappedStats;
        this.statsDataSource.data = mappedStats;

        // Process top 10 viewed items
        const viewsByTitle = mappedStats
          .filter(stat => stat.action === 'views')
          .reduce((acc, stat) => {
            const title = stat.title || 'Untitled';
            acc[title] = (acc[title] || 0) + stat.timestamps.length;
            return acc;
          }, {} as Record<string, number>);
        const top10Viewed = Object.entries(viewsByTitle)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10);
        
        const maxViews = top10Viewed.length > 0 ? top10Viewed[0][1] : 0;

        this.topViewedChartData = {
          labels: top10Viewed.map(([title]) => this.splitLabel(title, 30)),
          datasets: [
            {
              data: top10Viewed.map(() => maxViews),
              label: 'Max',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              hoverBackgroundColor: 'rgba(0, 0, 0, 0.05)',
              barPercentage: 0.6, categoryPercentage: 1.0, grouped: false, order: 1
            },
            {
              data: top10Viewed.map(([, count]) => count),
              label: 'Views',
              backgroundColor: '#3f51b5',
              barPercentage: 0.6, categoryPercentage: 1.0, grouped: false, order: 0
            }
          ]
        };

        // Process top 10 liked items
        const likesByTitle = mappedStats
          .filter(stat => stat.action === 'like')
          .reduce((acc, stat) => {
            const title = stat.title || 'Untitled';
            acc[title] = (acc[title] || 0) + stat.timestamps.length;
            return acc;
          }, {} as Record<string, number>);
        const top10Liked = Object.entries(likesByTitle)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10);

        const maxLikes = top10Liked.length > 0 ? top10Liked[0][1] : 0;

        this.topLikedChartData = {
          labels: top10Liked.map(([title]) => this.splitLabel(title, 30)),
          datasets: [
            {
              data: top10Liked.map(() => maxLikes),
              label: 'Max',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              hoverBackgroundColor: 'rgba(0, 0, 0, 0.05)',
              barPercentage: 0.6, categoryPercentage: 1.0, grouped: false, order: 1
            },
            {
              data: top10Liked.map(([, count]) => count),
              label: 'Likes',
              backgroundColor: '#e91e63',
              barPercentage: 0.6, categoryPercentage: 1.0, grouped: false, order: 0
            }
          ]
        };

        // Process type distribution
        const typesCount = mappedStats.reduce((acc, stat) => {
          const type = stat.type || 'Unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const sortedTypes = Object.entries(typesCount).sort(([, a], [, b]) => b - a);
        const maxTypesCount = sortedTypes.length > 0 ? sortedTypes[0][1] : 0;

        this.typeDistributionChartData = {
          labels: sortedTypes.map(([type]) => this.splitLabel(type, 30)),
          datasets: [
            {
              data: sortedTypes.map(() => maxTypesCount),
              label: 'Max',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              hoverBackgroundColor: 'rgba(0, 0, 0, 0.05)',
              barPercentage: 0.6, categoryPercentage: 1.0, grouped: false, order: 1
            },
            {
              data: sortedTypes.map(([, count]) => count),
              label: 'Count',
              backgroundColor: '#ffc107',
              barPercentage: 0.6, categoryPercentage: 1.0, grouped: false, order: 0
            }
          ]
        };

        // Sostituzione di Object.groupBy con una funzione reduce standard
        const typesObject = mappedStats.reduce((acc, item) => {
          (acc[item.type] = acc[item.type] || []).push(item);
          return acc;
        }, {} as Record<string, SocialStat[]>);

        this.statsTypes = Object.values(typesObject);

        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error loading social statistics', err)
    });
  }

  private splitLabel(str: string, maxwidth: number): string[] {
    const sections: string[] = [];
    const words = str.split(' ');
    let temp = '';

    words.forEach((item, index) => {
      if (temp.length > 0) {
        const concat = temp + ' ' + item;
        if (concat.length > maxwidth) {
          sections.push(temp);
          temp = item;
        } else {
          temp = concat;
        }
      } else {
        temp = item;
      }
      if (index === words.length - 1) {
        sections.push(temp);
      }
    });
    return sections;
  }

  private setChartTitles(): void {
    this.translate.get([
      'socialStatistics.charts.topViews',
      'socialStatistics.charts.topLikes',
      'socialStatistics.charts.typeDistribution'
    ]).subscribe(translations => {
      this.topViewedChartOptions = {
        ...this.topViewedChartOptions,
        plugins: {
          ...this.topViewedChartOptions?.plugins,
          title: {
            display: true,
            text: translations['socialStatistics.charts.topViews']
          }
        }
      };
      this.topLikedChartOptions = {
        ...this.topLikedChartOptions,
        plugins: {
          ...this.topLikedChartOptions?.plugins,
          title: {
            display: true,
            text: translations['socialStatistics.charts.topLikes']
          }
        }
      };
      this.typeDistributionChartOptions = {
        ...this.typeDistributionChartOptions,
        plugins: {
          ...this.typeDistributionChartOptions?.plugins,
          title: {
            display: true,
            text: translations['socialStatistics.charts.typeDistribution']
          }
        }
      };
      this.cdr.markForCheck();
    });
  }

  statsTypeFilter(filterValue: string): void {
    this.typeFilter = filterValue;
    this.applyFilters();
  }

  statsActionFilter(action: string, isChecked: boolean): void {
    // Se si seleziona "all", deseleziona gli altri.
    if (action === 'all') {
      if (isChecked) {
        Object.keys(this.actionFilters).forEach(key => this.actionFilters[key] = false);
      }
      this.actionFilters['all'] = isChecked;
    } else {
      this.actionFilters[action] = isChecked;
      // Se si seleziona un'azione specifica, deseleziona "all".
      this.actionFilters['all'] = false;
    }
    this.applyFilters();
  }

  statsCounterFilter(counter: string, isChecked: boolean): void {
    if (counter === 'all') {
      Object.keys(this.counterFilters).forEach(key => (this.counterFilters[key] = false));
    } else {
      this.counterFilters[counter] = isChecked;
    }
    this.applyFilters();
  }

  applyFilters(event?: Event): void {
    const textFilter = (event?.target as HTMLInputElement)?.value?.trim().toLowerCase() || 
                       (document.querySelector('input[matInput]') as HTMLInputElement)?.value?.trim().toLowerCase() || 
                       '';

    let filteredData = this.allStats;

    // 1. Filtro per testo
    if (textFilter) {
      filteredData = filteredData.filter(stat =>
        (stat.title?.toLowerCase() || '').includes(textFilter) ||
        (stat.user?.toLowerCase() || '').includes(textFilter)
      );
    }

    // 2. Filtro per tipo
    if (this.typeFilter !== 'all') {
      filteredData = filteredData.filter(stat => stat.type === this.typeFilter);
    }

    // 3. Filtro per azione
    const activeActionFilters = Object.keys(this.actionFilters).filter(key => key !== 'all' && this.actionFilters[key]);
    if (activeActionFilters.length > 0) {
      filteredData = filteredData.filter(stat => activeActionFilters.includes(stat.action));
    }

    // 4. Filtro per counter
    const activeCounterFilters = Object.keys(this.counterFilters).filter(key => key !== 'all' && this.counterFilters[key]);
    if (activeCounterFilters.length > 0) {
      filteredData = filteredData.filter(stat => activeCounterFilters.includes(this.getCounterGroup(stat.timestamps.length)));
    }
    this.statsDataSource.data = filteredData;
  }

  deleteStatistics(id: string): void {
    const confirmationMessage = id === 'all'
      ? this.translate.instant('socialStatistics.confirmations.delete_all')
      : this.translate.instant('socialStatistics.confirmations.delete_one');

    if (window.confirm(confirmationMessage)) {
      const deleteRequest = id === 'all'
        ? this.librariesService.deleteAllStatistics()
        : this.librariesService.deleteStatistic(id);

      deleteRequest.subscribe({
        next: () => {
          this.snackBar.open(this.translate.instant('socialStatistics.messages.delete_success'), this.translate.instant('close'), { duration: 3000 });
          if (id === 'all') {
            this.statsDataSource.data = [];
          } else {
            const currentData = this.statsDataSource.data;
            this.statsDataSource.data = currentData.filter(item => item._id !== id);
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error deleting statistics', err);
          const errorMessage = err.data?.message || this.translate.instant('socialStatistics.errors.delete_error');
          this.snackBar.open(errorMessage, this.translate.instant('close'), { duration: 5000, panelClass: ['mat-warn'] });
        }
      });
    }
  }

  getCounterGroup(counter: number): string {
    if (counter >= 0 && counter <= 100) {
      return 'one';
    } else if (counter >= 101 && counter <= 300) {
      return 'two';
    }
    return 'three';
  }
}
