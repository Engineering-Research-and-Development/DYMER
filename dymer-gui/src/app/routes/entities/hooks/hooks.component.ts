import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AllStatsGlobalResponse, Hook, HookServicePayload, HooksService, AllIndexResponse, AllFormsResponse } from './hooks.service';

@Component({
  selector: 'app-hooks',
  templateUrl: './hooks.component.html',
  styleUrls: ['./hooks.component.scss'],
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
  ],
})
export class HooksComponent implements OnInit {
  hook: HookServicePayload = { _index: '', eventType: 'after_insert', service: 'openness_search' };
  listHooks: Hook[] = [];
  listEntities: string[] = [];
  listEntitiesAvailable: any[] = [];
  listModelsAvailable: any[] = [];
  showlistEntitiesAvailable: boolean = false;
  showlistModelsAvailable: boolean = false;
  sort: { column: string, descending: boolean } = { column: '_index', descending: false };

  constructor(
    private hooksService: HooksService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadHooks();
    this.getAvailableEntitiesAndModels();
    this.loadAllEntities();
  }

  loadAllEntities(): void {
    this.hooksService.getAllStatsGlobal().subscribe({
      next: (retE: AllStatsGlobalResponse) => {
        this.listEntities = retE.data.indices
          .map((e: { index: string; }) => e.index)
          .filter((index: string) => index !== 'entity_relation');
        this.cdr.markForCheck();
      },
      error: (e: any) => console.error('error: ', e),
    });
  }

  private getAvailableEntitiesAndModels() {
    this.hooksService.getAllIndex().subscribe({
      next: (rt: AllIndexResponse) => {
        const allindex = rt.data;
        this.listEntitiesAvailable = Object.entries(allindex)
          .filter(([key]) => key !== 'entity_relation')
          .map(([key, value]) => ({
            _index: key,
            _type: Object.keys(value.mappings)[0],
          }));

        // Chiamata nidificata per ottenere i modelli dopo aver ottenuto le entità
        this.hooksService.getAllForms().subscribe({
          next: (rtf: AllFormsResponse) => {
            const listmodels = rtf.data;
            const modelIndices: string[] = [];

            listmodels.forEach(element => {
              element.instance.forEach(el => {
                if (el._index !== 'general' && el._index !== 'entity_relation') {
                  const isEntityAvailable = this.listEntitiesAvailable.some(obj => obj._index === el._index);
                  if (!isEntityAvailable && !modelIndices.includes(el._index)) {
                    this.listModelsAvailable.push({ _index: el._index, _type: el._index });
                    modelIndices.push(el._index);
                  }
                }
              });
            });
            // Unisci gli indici dei modelli con le entità esistenti, rimuovi duplicati e ordina
            this.listEntities = [...new Set([...this.listEntities, ...modelIndices])].sort();
            this.cdr.markForCheck();
          },
          error: (err) => console.error('Error fetching forms:', err)
        });

        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error fetching all index:', err)
    });
  }

  loadHooks(): void {
    this.hooksService.getHooks().subscribe({
      next: (response: any) => {
        if (response && response.data) {
          this.listHooks = response.data;
          this.cdr.markForCheck();
        }
      },
      error: (err: any) => console.error('Failed to load hooks', err)
    });
  }

  clearString(): void {
    // Logica da implementare se necessaria
  }

  copyPastIndType(el: any): void {
    if (el && el._index) {
      this.hook._index = el._index;
    }
  }

  createDymerHook(hook: HookServicePayload): void {
    // Crea una copia dell'oggetto hook per non modificare il modello della UI
    const dataPost = { ...hook };
    dataPost.microserviceType = 'entity';

    const modService = dataPost.service;
    const servicePaths: { [key: string]: string } = {
      openness_search: '/api/dservice/api/v1/opn/listener',
      eaggregation_hook: '/api/dservice/api/v1/eaggregation/listener',
      fwadapter: '/api/dservice/api/v1/fwadapter/listener',
      sync: '/api/dservice/api/v1/sync/listener',
      workflow: '/api/dservice/api/v1/workflow/listener',
    };

    if (servicePaths[modService]) {
      dataPost.service = {
        serviceType: modService,
        servicePath: servicePaths[modService],
      };
    }

    this.hooksService.createHook(dataPost).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.snackBar.open(response.message, this.translate.instant('hooks.notifications.close'), { duration: 3000 });
          // Aggiunge i nuovi hook alla lista esistente invece di ricaricare tutto
          if (response.data && Array.isArray(response.data)) {
            this.listHooks.push(...response.data);
          }
          this.hook = { _index: '', eventType: 'after_insert', service: 'openness_search' }; // Reset del form
          this.cdr.markForCheck();
        } else {
          this.snackBar.open(response.message, this.translate.instant('hooks.notifications.close'), { duration: 3000, panelClass: ['mat-warn'] });
        }
      },
      error: (err: any) => {
        const message = err?.error?.message || this.translate.instant('hooks.notifications.creation_error');
        this.snackBar.open(message, this.translate.instant('hooks.notifications.close'), { duration: 3000, panelClass: ['mat-warn'] });
        console.error('Error. HOOK Try Again!', err);
      },
    });
  }

  removeDymerHook(id: string): void {
    this.hooksService.deleteHook(id).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.snackBar.open(response.message, this.translate.instant('hooks.notifications.close'), { duration: 3000 });
          const index = this.listHooks.findIndex(hook => hook._id === id);
          if (index !== -1) {
            this.listHooks.splice(index, 1);
            this.cdr.markForCheck(); // Aggiorna la vista
          }
        } else {
          this.snackBar.open(response.message, this.translate.instant('hooks.notifications.close'), { duration: 3000, panelClass: ['mat-warn'] });
        }
      },
      error: (err: any) => {
        const message = err?.error?.message || this.translate.instant('hooks.notifications.deletion_error');
        this.snackBar.open(message, this.translate.instant('hooks.notifications.close'), { duration: 3000, panelClass: ['mat-warn'] });
        console.error('Error. delete hook Try Again!', err);
      },
    });
  }

  changeSorting(column: string): void {
    if (this.sort.column === column) {
      this.sort.descending = !this.sort.descending;
    } else {
      this.sort.column = column;
      this.sort.descending = false;
    }
  }

  selectedCls(column: string): any {
    return column === this.sort.column ? { 'text-primary': true, 'font-weight-bold': true } : {};
  }

  getSortedHooks(): Hook[] {
    if (!this.listHooks) {
      return [];
    }
    return [...this.listHooks].sort((a, b) => {
      const isAsc = this.sort.descending ? -1 : 1;

      // Funzione per accedere a proprietà annidate in sicurezza
      const getNestedValue = (obj: any, path: string) => {
        // Gestisce i casi in cui obj o una proprietà intermedia sia null/undefined
        const value = path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
        if (value === undefined) {
          return undefined;
        }
        return value;
      };

      const valA = getNestedValue(a, this.sort.column);
      const valB = getNestedValue(b, this.sort.column);

      if (valA < valB) return -1 * isAsc;
      if (valA > valB) return 1 * isAsc;
      return 0;
    });
  }
}
