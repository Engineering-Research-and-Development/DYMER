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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OpennessSearchService, CronJobConfig } from './importcron.service';
 
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

@Component({
  selector: 'app-importcron',
  templateUrl: './importcron.component.html',
  styleUrls: ['./importcron.component.scss'],
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
    MatTableModule,
    JsonPipe,
    DatePipe,
  ],
})
export class ImportCronComponent implements OnInit, AfterViewInit {
  
  showConfigAuthentication = false;
  showRules = true;

  configCONJOB: CronJobConfig = {};
  List: CronJobConfig[] = [];

  constructor(
    private opennessSearchService: OpennessSearchService,
    private cdr: ChangeDetectorRef,
    private toast: ToastrService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadList();
  }

  ngAfterViewInit(): void {
    // Init logic if needed
  }

  loadList() {
    this.opennessSearchService.getImportCron().subscribe({
        next: (response: any) => {
          if (response.success) {
            this.List = response.data;
            this.cdr.markForCheck();
          }
        },
        error: (err: any) => console.error('Error loading Cron Jobs', err)
      });
  }

  saveCRONJOB(config: CronJobConfig) {
    const isUpdate = !!config._id;

    let request$: Observable<any>;
    if (isUpdate && config._id) {
      request$ = this.opennessSearchService.updateImportCron(config._id, config);
    } else {
      request$ = this.opennessSearchService.saveImportCron(config);
    }

    request$.subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toast.success(this.translate.instant('importcron.save_success'));
            this.configCONJOB = {}; // Reset form
            this.loadList(); // Reload list
          } else {
            this.toast.error(this.translate.instant('importcron.save_error'));
          }
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error("Error while saving Cron Job", error);
          this.toast.error(this.translate.instant('importcron.save_error'));
        }
      });
  }

  setupdateCRONJOB(index: number, type?: string) {
    const item = this.List[index];
    this.configCONJOB = { ...item };
    
    if (type === 'clone') {
      delete this.configCONJOB._id;
      this.configCONJOB.title = (this.configCONJOB.title || '') + this.translate.instant('importcron.clone_suffix');
    }
    
    this.showConfigAuthentication = true;
    this.cdr.markForCheck();
  }

  removeCRONJOB(index: number) {
    const item = this.List[index];
    if (!item._id) return;

    if (confirm(this.translate.instant('importcron.confirm_delete'))) {
      this.opennessSearchService.deleteImportCron(item._id).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.List.splice(index, 1);
              this.toast.success(this.translate.instant('importcron.delete_success'));
            } else {
              this.toast.error(this.translate.instant('importcron.delete_error'));
            }
            this.cdr.markForCheck();
          },
          error: (error: any) => {
            this.toast.error(this.translate.instant('importcron.delete_error'));
          }
        });
    }
  }

  runCRONJOB(index: number) {
    const item = this.List[index];
    if (!item._id) return;

    if (confirm(this.translate.instant('importcron.confirm_run'))) {
      this.opennessSearchService.runImportCron(item._id).subscribe({
          next: (response: any) => {
        if (response.success && response.data) {
            this.toast.success(this.translate.instant('importcron.run_success'));
          } else {
            this.toast.error(this.translate.instant('importcron.run_error'));
          }
        },
        error: (error: any) => {
          console.error('Error while Running Rule', error);
          this.toast.error(this.translate.instant('importcron.run_error'));
        }
      });
    }
  }
}
