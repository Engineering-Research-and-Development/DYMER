import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, JsonPipe, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OpennessSearchService, AllIndexResponse, AllFormsResponse, SetConfigResponse, GetConfigsResponse, GetRulesResponse, GetUsersResponse } from './opennesssearch.service';
 
declare global {
  interface Window {
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

export interface OpnSearchConfigItem {
  servicetype?: string;
  id?: string;
  configuration: {
    method: 'GET' | 'POST';
    host: string;
    port: string;
    path: string;
    dymerpath: string;
  };
}

interface MappingRule {
  op_index: string;
  op_type: string;
  sendnotification: boolean;
  op_mapping: string;
}

interface OpnUser {
  _id?: string;
  d_cid: string;
  d_uid: string;
  d_gid: string;
  d_mail: string;
  d_pwd?: string;
  clientID: string;
  d_isEncrypted?: boolean;
  secretID: string;
  tokenURL: string;
}

interface RuleInfo {
  info_insert: any;
  info_update: any;
  info_delete: any;
}

interface ListRule extends RuleInfo {
  _id: string;
  _index: string;
  mapping: any;
  sendnotification: boolean;
  typerelations: string;
  changed: string | Date;
  // Flags for UI state
  showDetails?: boolean;
  showFilterItem?: boolean;
}

@Component({
  selector: 'app-opennesssearch',
  templateUrl: './opennesssearch.component.html',
  styleUrls: ['./opennesssearch.component.scss'],
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
    JsonPipe,
    DatePipe,
  ],
})
export class OpennessSearchComponent implements OnInit, AfterViewInit {
  listEntities: string[] = [];
  listEntitiesAvailable: EntityAvailable[] = [];
  listModelsAvailable: ModelAvailable[] = [];
  showlistEntitiesAvailable: boolean = false;
  showlistModelsAvailable: boolean = false;
  sort: { column: string, descending: boolean } = { column: '_index', descending: false };

  showConfigOpnSearch = false;
  showMappingRule = false;
  showMappingUser = false;

  opnsearchConfig = {
    insert: this.createDefaultConfigItem(),
    update: this.createDefaultConfigItem(),
    delete: this.createDefaultConfigItem(),
    get: this.createDefaultConfigItem('GET'),
  };

  rule: MappingRule = {
    op_index: '',
    op_type: '',
    sendnotification: false,
    op_mapping: JSON.stringify({
      "title": "title",
      "extContent": ["description"]
    }, null, 2)
  };

  opnUser: OpnUser = {
    d_cid: '',
    d_uid: '',
    d_gid: '',
    d_mail: '',
    d_pwd: '',
    clientID: '',
    secretID: '',
    tokenURL: '',
    d_isEncrypted: false
  };

  ListRules: ListRule[] = []; // Initialize with your data

  private actualUser: OpnUser | null = null;

  displayedColumns: string[] = ['index', 'mapping', 'sendNotification', 'delete', 'runRule', 'lastUpdate', 'info'];

  constructor(
    private opennessSearchService: OpennessSearchService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadOpnSearchConfigs();
    this.loadRules();
    this.loadUser();
  }

  ngAfterViewInit(): void {
    this.getAvailableEntitiesAndModels(); 
  }
  private loadOpnSearchConfigs() {
    this.opennessSearchService.getConfigs().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          response.data.forEach(el => {
            const serviceType = el.servicetype as keyof typeof this.opnsearchConfig;
            if (this.opnsearchConfig[serviceType]) {
              this.opnsearchConfig[serviceType].id = el._id;
              this.opnsearchConfig[serviceType].configuration = el.configuration;
            }
          });
          this.cdr.markForCheck();
        }
      },
      error: (err) => console.error('Error loading Openness Search configs', err)
    });
  }
  private loadRules() {
    this.opennessSearchService.getRules().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.ListRules = response.data;
          this.cdr.markForCheck();
        }
      },
      error: (err) => console.error('Error loading Openness Search rules', err)
    });
  }
  private loadUser() {
    this.opennessSearchService.getUsers().subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.length > 0) {
          // Assuming we only care about the first user
          const user = response.data[0];
          this.opnUser = { ...user };
          this.actualUser = { ...user };
          this.cdr.markForCheck();
        }
      },
      error: (err) => console.error('Error loading Openness Search user', err)
    });
  }

  private createDefaultConfigItem(method: 'GET' | 'POST' = 'POST'): OpnSearchConfigItem {
    return {
      configuration: {
        method: method,
        host: '',
        port: '',
        path: '',
        dymerpath: ''
      }
    };
  }

  saveOpnSearchConfig(config: OpnSearchConfigItem, servicetype: 'insert' | 'update' | 'delete' | 'get') {
    const payload: OpnSearchConfigItem = {
      ...config,
      servicetype: servicetype,
    };
    this.opennessSearchService.setConfig(payload).subscribe({
      next: (response) => {
        if (response.success) {
          response.data.forEach(el => {
            if (this.opnsearchConfig[el.servicetype as keyof typeof this.opnsearchConfig]) {
              this.opnsearchConfig[el.servicetype as keyof typeof this.opnsearchConfig].id = el.id;
            }
          });
          this.snackBar.open(
            `[${servicetype}] ${response.message}`,
            this.translate.instant('menu.actions.close'),
            { duration: 3000 }
          );
        } else {
          this.snackBar.open(response.message, this.translate.instant('menu.actions.close'), {
            duration: 5000,
            panelClass: ['mat-warn'],
          });
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error("Error while saving Openness Search Configuration", error);
        this.snackBar.open(
          this.translate.instant('common.error_saving'),
          this.translate.instant('menu.actions.close'),
          { duration: 5000, panelClass: ['mat-warn'] }
        );
      }
    });
  }

  clearString() {
    // Implement clear logic if needed
  }

  copyPastIndType(el: EntityAvailable | ModelAvailable) {
    this.rule.op_index = el._index;
    this.rule.op_type = el._type;
  }

  openUserConfig() {
    const dataPost = { ...this.opnUser };
    if (this.actualUser && dataPost.d_pwd !== this.actualUser.d_pwd) {
      dataPost.d_isEncrypted = false;
    }
    this.opennessSearchService.setUser(dataPost).subscribe({
      next: (response) => {
        if (response.success) {
          response.data.forEach((el: any) => {
            this.opnUser._id = el._id;
            this.opnUser.d_isEncrypted = el.d_isEncrypted;
            this.actualUser = { ...this.opnUser }; // Update actual user after save
          });
          this.snackBar.open(
            `[${this.opnUser.d_mail}] ${response.message}`,
            this.translate.instant('menu.actions.close'),
            { duration: 3000 }
          );
        } else {
          this.snackBar.open(response.message, this.translate.instant('menu.actions.close'), {
            duration: 5000,
            panelClass: ['mat-warn'],
          });
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error("Error while saving user", error);
        this.snackBar.open(this.translate.instant('common.error_saving'), this.translate.instant('menu.actions.close'), {
          duration: 5000,
          panelClass: ['mat-warn'],
        });
      }
    });
  }

  removeOpnSearchRule(index: number) {
    const ruleToDelete = this.ListRules[index];
    if (!ruleToDelete) {
      console.error('Rule not found at index:', index);
      return;
    }

    if (confirm(this.translate.instant('openness_search.confirm_delete_rule', { index: ruleToDelete._index }))) {
      this.opennessSearchService.deleteRule(ruleToDelete._id).subscribe({
        next: (response) => {
          if (response.success) {
            this.ListRules.splice(index, 1);
            this.snackBar.open(response.message, this.translate.instant('menu.actions.close'), { duration: 3000 });
          } else {
            this.snackBar.open(response.message || this.translate.instant('hooks.openness_search.error_delete_rule'), this.translate.instant('menu.actions.close'), {
              duration: 5000,
              panelClass: ['mat-warn'],
            });
          }
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Error while deleting rule:', error);
          this.snackBar.open(this.translate.instant('errors.common.error_deleting') || 'we are sorry but an error has occurred', this.translate.instant('menu.actions.close'), {
            duration: 5000,
            panelClass: ['mat-warn'],
          });
        },
      });
    }
  }

  runOpnSearchRule(index: number) {
    const ruleToRun = this.ListRules[index];
    if (!ruleToRun) {
      console.error('Rule not found at index:', index);
      return;
    }

    const confirmationMessage = this.translate.instant('openness_search.confirm_run_rule', { index: ruleToRun._index });

    if (confirm(confirmationMessage)) {
      this.opennessSearchService.runRule(ruleToRun._id).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open(response.message, this.translate.instant('menu.actions.close'), { duration: 3000 });
          } else {
            this.snackBar.open(response.message || this.translate.instant('hooks.openness_search.error_run_rule'), this.translate.instant('menu.actions.close'), {
              duration: 5000,
              panelClass: ['mat-warn'],
            });
          }
        },
        error: (error) => {
          console.error('Error while Running Rule. Try Again !', error);
          this.snackBar.open(this.translate.instant('hooks.openness_search.error_run_rule_generic'), this.translate.instant('menu.actions.close'), {
            duration: 5000,
            panelClass: ['mat-warn'],
          });
        }
      });
    }
  }

  showentitydet() {
    // Implement logic if needed
  }

  private getAvailableEntitiesAndModels() {
    forkJoin({
      allIndex: this.opennessSearchService.getAllIndex().pipe(catchError(err => {
        console.error('Error fetching all index:', err);
        this.snackBar.open(this.translate.instant('menu.query_builder.notifications.fetch_entities_error'), this.translate.instant('menu.query_builder.notifications.actions.close'), { duration: 3000, panelClass: ['mat-warn'] });
        return of(null);
      })),
      allForms: this.opennessSearchService.getAllForms().pipe(catchError(err => {
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
          .flatMap((element: { instance: any; }) => element.instance)
          .filter((el: { _index: string; }) => el._index !== 'general' && el._index !== 'entity_relation')
          .filter((el: { _index: string; }) => !availableEntityIndices.has(el._index))
          .filter((el: { _index: string; }) => !modelIndices.has(el._index) && modelIndices.add(el._index));

        this.listModelsAvailable = modelsFromForms.map((el: { _index: any; }) => ({ _index: el._index, _type: el._index }));

        // Unisci gli indici dei modelli con le entità esistenti, rimuovi duplicati e ordina
        const allIndices = new Set([...this.listEntities, ...modelIndices]);
        this.listEntities = [...allIndices].sort();
      }

      this.initializeopennessSearch();

      this.cdr.markForCheck();
    });
  }

  private initializeopennessSearch(): void {
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
  }

  createOpnSearchRule(rule: MappingRule): void {
    const payload = { ...rule };

    try {
      // Safely parse the mapping
      payload.op_mapping = JSON.parse(payload.op_mapping);
    } catch (e) {
      console.error('Error parsing op_mapping JSON:', e);
      this.snackBar.open(this.translate.instant('importexport.invalid_mapping_json'), this.translate.instant('menu.actions.close'), {
        duration: 5000,
        panelClass: ['mat-warn'],
      });
      return;
    }

    // Ensure sendnotification is a boolean
    payload.sendnotification = !!payload.sendnotification;

    this.opennessSearchService.createRule(payload).subscribe({
      next: (response) => {
        if (response.success) {
          this.ListRules.push(...response.data);
          this.snackBar.open(response.message, this.translate.instant('menu.actions.close'), { duration: 3000 });
          this.resetRule();
        } else {
          this.snackBar.open(response.message, this.translate.instant('menu.actions.close'), {
            duration: 5000,
            panelClass: ['mat-warn'],
          });
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error while creating rule:', error);
        this.snackBar.open(this.translate.instant('common.error_saving'), this.translate.instant('menu.actions.close'), {
          duration: 5000,
          panelClass: ['mat-warn'],
        });
      },
    });
  }

  private resetRule(): void {
    this.rule = {
      op_index: '',
      op_type: '',
      sendnotification: false,
      op_mapping: JSON.stringify({
        "title": "title",
        "extContent": ["description"]
      }, null, 2)
    };
  }
}
