import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiResponse, Hook, HookServicePayload, QueryBuilderService, AllIndexResponse, AllFormsResponse } from './querybuilder.service';
 
declare function addBindQueryBuilder(config: any): void;
declare global {
  interface Window {
    addBindQueryBuilder?: (cfg: any) => void;
    vvveb_search_endpoint?: string;
    dymer_base_entity_config?: any;
    dymer_searchEntities?: (query: any) => Promise<any>;
    checkStatus?: (properties: any, options: string) => string;
    checkVisibility?: (properties: any, options: string) => string;
    checkPermission?: (properties: any) => any;
    getrendRole?: (perm: any) => string;
  }
}

interface EntityAvailable {
  _index: string;
  _type: string;
}

interface ModelAvailable {
  _index: string;
  _type: string;
}

@Component({
  selector: 'app-querybuilder',
  templateUrl: './querybuilder.component.html',
  styleUrls: ['./querybuilder.component.scss'],
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
    MatSnackBarModule,
  ],
})
export class QueryBuilderComponent implements OnInit, AfterViewInit {
  hook: HookServicePayload = { _index: '', eventType: 'after_insert', service: 'openness_search' };
  listHooks: Hook[] = [];
  listEntities: string[] = [];
  listEntitiesAvailable: EntityAvailable[] = [];
  listModelsAvailable: ModelAvailable[] = [];
  showlistEntitiesAvailable: boolean = false;
  showlistModelsAvailable: boolean = false;
  sort: { column: string, descending: boolean } = { column: '_index', descending: false };

  constructor(
    private queryBuilderService: QueryBuilderService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    (window as any).checkStatus = this.queryBuilderService.checkStatus.bind(this.queryBuilderService);
    (window as any).checkVisibility = this.queryBuilderService.checkVisibility.bind(this.queryBuilderService);
    (window as any).checkPermission = this.queryBuilderService.checkPermission.bind(this.queryBuilderService);
    (window as any).getrendRole = this.queryBuilderService.getrendRole.bind(this.queryBuilderService);
    (window as any).dymer_searchEntities = this.queryBuilderService.searchEntities.bind(this.queryBuilderService);
    this.getAvailableEntitiesAndModels(); 
  }

  private getAvailableEntitiesAndModels() {
    forkJoin({
      allIndex: this.queryBuilderService.getAllIndex().pipe(catchError(err => {
        console.error('Error fetching all index:', err);
        this.snackBar.open(this.translate.instant('menu.query_builder.notifications.fetch_entities_error'), this.translate.instant('menu.query_builder.notifications.actions.close'), { duration: 3000, panelClass: ['mat-warn'] });
        return of(null);
      })),
      allForms: this.queryBuilderService.getAllForms().pipe(catchError(err => {
        console.error('Error fetching forms:', err);
        this.snackBar.open(this.translate.instant('menu.query_builder.notifications.fetch_forms_error'), this.translate.instant('menu.query_builder.notifications.actions.close'), { duration: 3000, panelClass: ['mat-warn'] });
        return of(null);
      }))
    }).subscribe(({ allIndex, allForms }) => {
      if (allIndex?.success) {
        this.listEntitiesAvailable = Object.entries(allIndex.data)
          .filter(([key]) => key !== 'entity_relation')
          .map(([key, value]) => ({
            _index: key,
            _type: Object.keys((value as any).mappings)[0],
          }));
      }
 
      if (allForms?.success) {
        const availableEntityIndices = new Set(this.listEntitiesAvailable.map(e => e._index));
        const modelIndices = new Set<string>();

        const modelsFromForms = allForms.data
          .flatMap(element => element.instance)
          .filter(el => el._index !== 'general' && el._index !== 'entity_relation')
          .filter(el => !availableEntityIndices.has(el._index))
          .filter(el => !modelIndices.has(el._index) && modelIndices.add(el._index));

        this.listModelsAvailable = modelsFromForms.map(el => ({ _index: el._index, _type: el._index }));

        // Unisci gli indici dei modelli con le entità esistenti, rimuovi duplicati e ordina
        const allIndices = new Set([...this.listEntities, ...modelIndices]);
        this.listEntities = [...allIndices].sort();
      }

      this.initializeQueryBuilder();

      this.cdr.markForCheck();
    });
  }

  private initializeQueryBuilder(): void {
    const inexListQuery: { [key: string]: string } = {};

    this.listEntitiesAvailable.forEach(entity => {
      inexListQuery[entity._index] = `${entity._index} / ${entity._type}`;
    });

    this.listModelsAvailable.forEach(model => {
      if (!inexListQuery[model._index]) {
        inexListQuery[model._index] = `${model._index} / ${this.translate.instant('menu.query_builder.no_model')}`;
      }
    });

    const qbconfig = {
      lang: {
        add_rule: this.translate.instant('menu.query_builder.buttons.add_rule'),
        add_group: this.translate.instant('menu.query_builder.buttons.add_group'),
        delete_rule: this.translate.instant('menu.query_builder.buttons.delete_rule'),
        delete_group: this.translate.instant('menu.query_builder.buttons.delete_group'),
      },
      filters: {
        "_index": inexListQuery
      }
    };
 
    if (typeof (window as any).addBindQueryBuilder === 'function') {
      // Esponi l'endpoint di ricerca alla libreria esterna
      (window as any).vvveb_search_endpoint = this.queryBuilderService.getEntitiesSearchEndpoint();
      // Esponi la configurazione base dell'entità alla libreria esterna
      (window as any).dymer_base_entity_config = this.queryBuilderService.getBaseEntityConfig();
      (window as any).addBindQueryBuilder(qbconfig);
    } else {
      console.error('addBindQueryBuilder function not found. Make sure dymer.querygen.js is loaded.');
    }
  }

  changeSorting(column: string): void {
    if (this.sort.column === column) {
      this.sort.descending = !this.sort.descending;
    } else {
      this.sort.column = column;
      this.sort.descending = false;
    }
  }

  selectedCls(column: string): { [key: string]: boolean } {
    return column === this.sort.column ? { 'text-primary': true, 'font-weight-bold': true } : {};
  }
}
