import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
  Input,signal,
  Output, EventEmitter
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  FormControl,
  AbstractControl,
} from '@angular/forms';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import { BreadcrumbComponent } from '@shared';
import { PageHeaderComponent } from '@shared';
import { TranslateModule } from '@ngx-translate/core';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ListEntitiesService, GetAllEntitiesResponse, RawEsEntity, ProcessedTemplate, ProcessedEntitiesResult, GetFormResponse, MongoForm } from './listentities.service'; // Importa anche i tipi
import { MatRadioModule } from '@angular/material/radio';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDividerModule } from '@angular/material/divider';
import { MatDrawer } from '@angular/material/sidenav';
import { Subscription, finalize, map, catchError, of, delay, forkJoin, lastValueFrom, tap } from 'rxjs';
import * as JQuery from 'jquery';
import * as Handlebars from 'handlebars';

@Component({
  selector: 'app-checkbox-group',
  template: `
    <div *ngFor="let option of options">
      <mat-checkbox
        [value]="option.value"
        [checked]="selectedValues.includes(option.value)"
        (change)="onCheckboxChange($event, option.value)">
        {{ option.label }}
      </mat-checkbox>
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    MatCheckboxModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class CheckboxGroupComponent {
  @Input() options: { value: string; label: string }[] = [];
  @Input() selectedValues: string[] = [];
  @Output() selectedValuesChange = new EventEmitter<string[]>();

  onCheckboxChange(event: any, value: string): void {
    if (event.checked) {
      this.selectedValues = [...this.selectedValues, value];
    } else {
      this.selectedValues = this.selectedValues.filter(v => v !== value);
    }
    this.selectedValuesChange.emit(this.selectedValues);
  }
}

@Component({
  selector: 'app-entities-listentities',
  templateUrl: './listentities.component.html',
  styleUrls: ['./listentities.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    
    
    TranslateModule,
    MatOptionModule,
    MatSelectModule,
    MatCheckboxModule,
    CommonModule,
     MatRadioModule,
    MatPaginatorModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
      MatProgressSpinnerModule,
    NgxJsonViewerModule,
    MatSidenavModule,
    MatTableModule,
    MatDividerModule
  ],
})


export class ListEntitiesComponent implements OnInit, OnDestroy, AfterViewInit {
  isEditModalOpen: boolean = false;


 isDrawerOpen = signal<boolean>(false);
  selectedEntityDetail: RawEsEntity | undefined = undefined;


 
  userForm!: FormGroup;
  dataSource = new MatTableDataSource<RawEsEntity>([]);
  
  // Altri stati esistenti
  showUserEditor = false;
  showFullJsonView = false;
  isLoading = false;
  isLoadingDetails = false;
  renderedDetailHtml : any = null;
  fullEntityJsonToShow: any = null;
  totalSize = 0;


  entityForm: FormGroup;
  editEntityForm!: FormGroup;
  currentFormConfig: MongoForm | null = null;
  indexes: any = [];
  processedEntities: RawEsEntity[] = [];
  filteredEntities: RawEsEntity[] = [];
  pagedEntities: RawEsEntity[] = [];
  loadedTemplates: ProcessedTemplate[] = [];
  String = String;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  //@ViewChild('drawer') drawer!: MatDrawer;
  private subscriptions: Subscription = new Subscription();
   
 
  public displayedColumns: string[] = ['title', 'index', 'status', 'actions'];
  private _jq: JQueryStatic;
 
  public entitySpecificFormHtml: SafeHtml | null = null;
  // Strutture per i controlli delle relazioni nella modale di modifica
  relationEditControls: Array<{
    controlName: string;
    label: string;
    options: RawEsEntity[];
    originalRelation: RawEsEntity;
    isLoadingOptions: boolean;
  }> = [];
  relationOptionsCache: Map<string, RawEsEntity[]> = new Map();
  private currentDetailRenderType = 'fullcontent';
  private injectedFormCssLinks: HTMLLinkElement[] = [];
  constructor(
    private fb: FormBuilder,
    private listEntitiesService: ListEntitiesService,
    private translate: TranslateService,
    private domSanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    private dialog: MatDialog
  ) {
    this._jq = JQuery.default; 
    this.entityForm = this.fb.group({
      selectIndexCtrl: ['', Validators.required],
      selectVisibilityCtrl: ['', Validators.required],
      selectStatusCtrl: ['', Validators.required],
      titleCtrl: [''],
      idCtrl: ['']
    });
    this.userForm = this.fb.group({
      uidCtrl: ['', Validators.required],
      gidCtrl: ['', Validators.required]
    });
  }
  pageSize = 10;
  currentPage = 0;
 
  pageSizeOptions: number[] = [5, 10, 25, 100];

  resetFilters(): void {
    this.entityForm.reset({
      selectIndexCtrl: '',
      selectVisibilityCtrl: '',
      selectStatusCtrl: '',
      titleCtrl: '',
      idCtrl: ''
    });
    this.clearEntityDetails();
  }

  public confirmDeleteEntity(entity?: RawEsEntity): void {
    if (!entity) return;
    const entityTitle = entity.title || 'N/A';
    const message = this.translate.instant('menu.entities.listentities.confirmDeleteMessage', { entityTitle: entityTitle, entityId: entity._id });
    if (window.confirm(message)) {
      this.deleteEntity(entity._id, entityTitle);
    }
  }

  private deleteEntity(entityId: string, entityTitle: string): void {
    this.isLoadingDetails = true;
    this.cdr.detectChanges();
    const deleteSubscription = this.listEntitiesService.deleteEntityById(entityId)
      .pipe(
        finalize(() => {
          this.isLoadingDetails = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.toastr.success(this.translate.instant('menu.entities.listentities.deleteSuccessMessage', { entityTitle: entityTitle }));
          // Rimuovi l'entità dalla lista
          this.processedEntities = this.processedEntities.filter(e => e._id !== entityId);
          this.applyFilters(); // Riapplica i filtri e aggiorna la paginazione
          // Se l'entità eliminata era quella visualizzata nei dettagli, pulisci i dettagli
          if (this.selectedEntityDetail && this.selectedEntityDetail._id === entityId) {
            this.clearEntityDetails();
          }
        },
        error: (err) => {
          console.error(`Errore durante l'eliminazione dell'entità ${entityId}:`, err);
          this.toastr.error(this.translate.instant('menu.entities.listentities.deleteErrorMessage', { entityTitle: entityTitle }));
        }
      });
    this.subscriptions.add(deleteSubscription);
  }
  /**
   * Restituisce la stringa tradotta per la visibilità dell'entità.
   * @param value Il valore della visibilità ('0', '1', '2').
   * @returns La stringa tradotta.
   */
  public getEntityVisibility(value: string | number | undefined | null): string {
    if (value === undefined || value === null) {
      return this.translate.instant('menu.entities.listentities.valueNotAvailable');
    }
    const key = String(value);
    switch (key) {
      case '0':
        return this.translate.instant('menu.entities.listentities.visibility.public');
      case '1':
        return this.translate.instant('menu.entities.listentities.visibility.private');
      case '2':
        return this.translate.instant('menu.entities.listentities.visibility.restricted');
      default:
        return this.translate.instant('menu.entities.listentities.valueNotAvailable');
    }
  }
  /**
   * Restituisce la stringa tradotta per lo stato dell'entità.
   * @param value Il valore dello stato ('1', '2', '3').
   * @returns La stringa tradotta.
   */
  public getEntityStatus(value: string | number | undefined | null): string {
    if (value === undefined || value === null) {
      return this.translate.instant('menu.entities.listentities.valueNotAvailable');
    }
    const key = String(value);
    switch (key) {
      case '1':
        return this.translate.instant('menu.entities.listentities.status.published');
      case '2':
        return this.translate.instant('menu.entities.listentities.status.unpublished');
      case '3':
        return this.translate.instant('menu.entities.listentities.status.draft');
      default:
        return this.translate.instant('menu.entities.listentities.valueNotAvailable');
    }
  }

 
  closeDrawer() {
    this.isDrawerOpen.set(false);
   
  }
  
  public showEntityDetails(entity?: RawEsEntity): void {
    if (!entity) return;
    this.selectedEntityDetail = entity;
    this.isDrawerOpen.set(true);
    if (!entity || !entity._id) {
      console.error('ID entità non fornito per caricare i dettagli.');
      this.clearEntityDetails();
      return;
    }
    this.selectedEntityDetail = entity;
   
    this.isLoadingDetails = true;
 
     
    this.loadedTemplates = [];
    this.showFullJsonView = false;
    this.fullEntityJsonToShow = null;
    this.showUserEditor = false;
    this.isEditModalOpen = false; // Chiudi la modale se aperta
    //Carica i dettagli dell'entità
    const detailsSubscription = this.listEntitiesService.getEntityDetailsById(entity._id)
      .subscribe({
        next: (detailedEntity) => {
          if (detailedEntity) {
            this.selectedEntityDetail = detailedEntity;
            //Se i dettagli sono stati caricati e l'indice è presente, carica il template
            if (detailedEntity._index) {
              const templateSubscription = this.listEntitiesService.loadTemplatesByIndexAndType(detailedEntity._index, detailedEntity._index)
                .pipe(
                  finalize(() => {
                    this.isLoadingDetails = false;
                    //this.drawer.open();
                    this.isDrawerOpen.set(true);
                  })
                )
                .subscribe({
                  next: (templates: ProcessedTemplate[]) => {
                    this.loadedTemplates = templates;
                    this.renderEntityWithTemplate(detailedEntity);
                  },
                  error: (templateError) => {
                    console.error(`Errore nel caricare i template per l'indice ${detailedEntity._index}:`, templateError);
                    this.loadedTemplates = [];
                    this.renderEntityWithTemplate(detailedEntity);
                  }
                });
              this.subscriptions.add(templateSubscription);
            } else {
              console.warn(`Indice non trovato per l'entità con ID: ${entity._id}. Impossibile caricare il template.`);
              this.renderEntityWithTemplate(detailedEntity);
              this.isLoadingDetails = false;
              //this.drawer.open();
              this.isDrawerOpen.set(true);
            }
          } else {
            console.warn(`Dettagli non trovati per l'entità con ID: ${entity._id}`);
            this.clearEntityDetails();
            this.isLoadingDetails = false;
          }
        },
        error: (err) => {
          console.error(`Errore nel caricare i dettagli dell'entità ${entity._id}:`, err);
          this.clearEntityDetails();
          this.isLoadingDetails = false;
        }
      });
    this.subscriptions.add(detailsSubscription);
  }

    public clearEntityDetails(): void {
    
    this.loadedTemplates = [];
    this.showFullJsonView = false;
    this.fullEntityJsonToShow = null;
    this.showUserEditor = false;
  }

  private renderEntityWithTemplate(entityData: RawEsEntity): void {
    console.log('Rendering entity:', entityData);
    console.log('Loaded templates:', this.loadedTemplates);
    if (!entityData) {
      this.renderedDetailHtml = null;
      return;
    }
    if (!this.loadedTemplates || this.loadedTemplates.length === 0) {
      this.renderedDetailHtml = null;
      return;
    }
    const templateToUse = this.loadedTemplates[0];
    if (!templateToUse || !templateToUse.viewtype || !templateToUse.viewtype[this.currentDetailRenderType]) {
      this.renderedDetailHtml = null;
      return;
    }
    const myTemplate = templateToUse.viewtype[this.currentDetailRenderType];
    if (!Handlebars.helpers.ifEquals) {
      Handlebars.registerHelper('ifEquals', function(this: any, arg1: any, arg2: any, options: any) {
        return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
      });
    }
    if (!Handlebars.helpers.EntityStatus) {
      Handlebars.registerHelper('EntityStatus', function(this: any, status: any) {
        // Personalizza qui la logica di conversione dello status
        switch (status) {
          case '1':
            return 'Pubblicato';
          case '2':
            return 'Non pubblicato';
          case '3':
            return 'Bozza';
          default:
            return 'N/D';
        }
      });
    }
    if (!Handlebars.helpers.EntityStatusPdf) {
      Handlebars.registerHelper('EntityStatusPdf', function(this: any, status: any) {
        // Logica di conversione dello status per PDF, identica a EntityStatus
        switch (String(status)) {
          case '1':
            return 'Pubblicato';
          case '2':
            return 'Non pubblicato';
          case '3':
            return 'Bozza';
          default:
            return 'N/D';
        }
      });
    }
    if (!Handlebars.helpers.loadfile) {
      Handlebars.registerHelper('loadfile', function(this: any, fileId: string, index: string) {
        if (!fileId || !index) return '';
        return `/api/forms/${index}/file/${fileId}`;
      });
    }
    if (!Handlebars.helpers.EntityView) {
      Handlebars.registerHelper('EntityView', function(this: any, value: any) {
        return value !== undefined && value !== null ? String(value) : '';
      });
    }
    if (!Handlebars.helpers.EntityLike) {
      Handlebars.registerHelper('EntityLike', function(this: any, value: any) {
        return value !== undefined && value !== null ? String(value) : '';
      });
    }
    const compiled = Handlebars.compile(myTemplate);
    let html = compiled(entityData);

    // Approccio "Global Override": Iniettiamo un blocco di stile CSS dedicato che forza 
    // la visibilità di tutti i testi all'interno dell'anteprima.
    // Questo metodo sovrascrive sia le classi CSS dei template che gli stili inline.
    const visibilityOverrideStyle = `
      <style>
        .dymer-preview-wrapper { color: #212529 !important; background-color: transparent !important; }
        .dymer-preview-wrapper p, 
        .dymer-preview-wrapper span, 
        .dymer-preview-wrapper div:not(.ignore-color), 
        .dymer-preview-wrapper label, 
        .dymer-preview-wrapper b, 
        .dymer-preview-wrapper i,
        .dymer-preview-wrapper h1, .dymer-preview-wrapper h2, .dymer-preview-wrapper h3, .dymer-preview-wrapper h4 { 
          color: #212529 !important; 
        }
        .dymer-preview-wrapper .kms-label { color: #555 !important; font-weight: 600 !important; }
        .dymer-preview-wrapper .kms-value { color: #000 !important; }
        .dymer-preview-wrapper .text-white { color: #212529 !important; }
        .dymer-preview-wrapper .lightTitle { color: #000 !important; }
      </style>
    `;

    // Avvolgiamo il contenuto nel wrapper e aggiungiamo lo stile di override
    html = visibilityOverrideStyle + '<div class="dymer-preview-wrapper">' + html + '</div>';

    console.log('Rendered HTML for entity:', entityData._id, 'HTML length:', html.length);
    this.renderedDetailHtml = this.domSanitizer.bypassSecurityTrustHtml(html);
  }

  public toggleFullJsonView(): void {
    if (this.showFullJsonView) {
      this.showFullJsonView = false;
    } else {
      if (this.selectedEntityDetail) {
        try {
          const jsonCopy = JSON.parse(JSON.stringify(this.selectedEntityDetail));
          if (jsonCopy.index && jsonCopy._index) {
            delete jsonCopy.index;
          }
          this.fullEntityJsonToShow = jsonCopy;
          this.showFullJsonView = true;
        } catch (e) {
          console.error("Errore durante la clonazione di selectedEntityDetail per la vista JSON:", e);
          this.toastr.error(this.translate.instant('menu.entities.listentities.errorCloningJson'));
          this.showFullJsonView = false;
          this.fullEntityJsonToShow = null;
        }
      } else {
        console.warn("selectedEntityDetail è nullo, impossibile mostrare la vista JSON.");
      }
    }
    this.cdr.detectChanges();
  }

  public showEntityJson(entity?: RawEsEntity): void {
    if (!entity) return;
    if (!entity || !entity._id) {
      console.error('ID entità non fornito per mostrare il JSON.');
      return;
    }
    this.isLoadingDetails = true;
    this.clearEntityDetails();
    // if (this.drawer) {
    //   this.drawer.open();
    //   this.isDrawerOpen.set(false);
    // }
    this.isDrawerOpen.set(false);
    this.subscriptions.add(
      this.listEntitiesService.getEntityDetailsById(entity._id)
        .pipe(finalize(() => {
          this.isLoadingDetails = false;
          this.cdr.detectChanges();
        }))
        .subscribe({
          next: (detailedEntity) => {
            if (detailedEntity) {
              this.selectedEntityDetail = detailedEntity;
              try {
                const jsonCopy = JSON.parse(JSON.stringify(detailedEntity));
                if (jsonCopy.index && jsonCopy._index) {
                  delete jsonCopy.index;
                }
                this.fullEntityJsonToShow = jsonCopy;
                this.showFullJsonView = true;
              } catch (e) {
                console.error("Errore JSON:", e);
                this.toastr.error(this.translate.instant('menu.entities.listentities.errorCloningJson'));
              }
            }
          },
          error: (err) => {
            console.error("Error loading entity details", err);
            this.toastr.error('Errore nel caricamento del JSON');
          }
        })
    );
  }

  public toggleUserEditor(): void {
    this.showUserEditor = !this.showUserEditor;
    if (this.showUserEditor && this.selectedEntityDetail) {
      this.userForm.patchValue({
        uidCtrl: this.selectedEntityDetail.properties?.owner?.uid || '',
        gidCtrl: this.selectedEntityDetail.properties?.owner?.gid || ''
      });
    }
    this.cdr.detectChanges();
  }

  public saveEntityUser(): void {
    const entityId = this.selectedEntityDetail?._id ?? '';
    const newUid = this.userForm.value.uidCtrl ?? '';
    const newGid = this.userForm.value.gidCtrl ?? '';

    this.isLoadingDetails = true;
    this.cdr.detectChanges();

    const userUpdateSubscription = this.listEntitiesService.updateEntityUser(entityId, newUid, newGid)
      .pipe(finalize(() => {
        this.isLoadingDetails = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.toastr.success(this.translate.instant('menu.entities.listentities.userUpdateSuccess'));
          this.showEntityDetails(this.selectedEntityDetail as RawEsEntity);
          this.showUserEditor = false;
        },
        error: (err: { message: any; }) => {
          console.error(`Errore durante l'aggiornamento dell'utente per l'entità ${entityId}:`, err);
          this.toastr.error(this.translate.instant('menu.entities.listentities.userUpdateError', { message: err.message || 'Unknown error' }));
        }
      });
    this.subscriptions.add(userUpdateSubscription);
  }

  /**
   * Funzione resa globale per essere chiamata da template dinamici (`onclick="kmsrenderdetail(...)"`).
   * @param id L'ID dell'entità da visualizzare.
   */
  public kmsrenderdetail(id: string): void {
    // La logica è già in showEntityDetails, quindi la chiamiamo con la struttura dati attesa.
    this.showEntityDetails({ _id: id } as RawEsEntity);
  }

  ngAfterViewInit() {
    if (this.paginator && this.filteredEntities.length > 0) {
      this.totalSize = this.filteredEntities.length;
      this.updatePagedEntities();
    }
    this.dataSource.paginator = this.paginator;
    (window as any).cloneRepeatable = (htmlElement: HTMLElement) => {
      this.cloneRepeatableLogic(this._jq(htmlElement));
    };
    (window as any).removeRepeatable = (htmlElement: HTMLElement) => {
      this.removeRepeatableLogic(this._jq(htmlElement));
    };
    // Rende il metodo del componente accessibile globalmente per l'attributo `onclick`
    (window as any).kmsrenderdetail = this.kmsrenderdetail.bind(this);
  }

  ngOnInit(): void {
    this.loadIndexes();
    const formChangesSubscription = this.entityForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
    this.subscriptions.add(formChangesSubscription);

    const indexSelectionSubscription = this.entityForm.get('selectIndexCtrl')?.valueChanges.subscribe(selectedIndex => {
      if (!selectedIndex) { // L'utente ha deselezionato l'indice dal filtro (es. "Tutti gli indici")
        this.loadedTemplates = [];
        if (this.selectedEntityDetail) {
          this.renderEntityWithTemplate(this.selectedEntityDetail);
        }
      }
    });
    if (indexSelectionSubscription) {
        this.subscriptions.add(indexSelectionSubscription);
    }
  }

  ngOnDestroy(): void {
      this.subscriptions.unsubscribe();
      // Rimuove le funzioni globali per evitare memory leak
      if ((window as any).kmsrenderdetail) {
        delete (window as any).kmsrenderdetail;
      }
      if ((window as any).cloneRepeatable) {
        delete (window as any).cloneRepeatable;
      }
      if ((window as any).removeRepeatable) {
        delete (window as any).removeRepeatable;
      }
      // Assicura la rimozione dei CSS dinamici se il componente viene distrutto con la modale aperta
      this.injectedFormCssLinks.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
      this.injectedFormCssLinks = [];
  }
  async openEditModal(entity?: RawEsEntity): Promise<void> {
    let entityToEdit = entity || this.selectedEntityDetail;

    // Chiudi il drawer se aperto senza crash se undefined
    // if (this.drawer && typeof this.drawer.close === 'function') {
    //   try {
    //     this.drawer.close();
    //   } catch (drawerErr) {
    //     console.warn('Impossibile chiudere il drawer (stato non disponibile):', drawerErr);
    //   }
    // }
    this.isDrawerOpen.set(false);
    const target = entity ?? this.selectedEntityDetail;
    
    console.log('Apertura modale di edit per entità:', target);
    // Se l'entità non ha i dettagli completi (relazioni, ecc.), caricali
    if (entityToEdit && entityToEdit._id && (!entityToEdit.relations || entityToEdit.relations.length === 0)) {
      try {
        const detailedEntity = await lastValueFrom(this.listEntitiesService.getEntityDetailsById(entityToEdit._id));
        if (detailedEntity) {
          entityToEdit = detailedEntity;
        }
      } catch (error) {
        console.error('Errore nel caricamento dei dettagli per la modale di edit:', error);
      }
    }
    
    if (!entityToEdit || !entityToEdit._index) {
      console.warn('Nessuna entità valida selezionata per aprire la modale di modifica.');
      this.toastr.warning(this.translate.instant('menu.entities.listentities.noEntitySelectedForEdit'));
      return;
    }

    if (entityToEdit && entityToEdit._index) {
      // Mostra immediatamente il loader della modale
      this.selectedEntityDetail = entityToEdit;
      this.isLoadingDetails = true;
      this.isEditModalOpen = true;
      this.cdr.detectChanges();
      this.closeInjectedFormStyles(); // Pulisce stili precedenti
      const entityIndex = entityToEdit._index;
      this.entitySpecificFormHtml = null;
      this.cdr.detectChanges();
      let finalHtmlString: string | null = null;
      const parser = new DOMParser();
      const allPotentialRelationTypes = new Set<string>();

      try {
        const response = await lastValueFrom(this.listEntitiesService.getFormConfig(entityIndex));
        if (response && response.success && response.data && response.data.length > 0) {
          const formConfig = response.data[0];
          this.indexes.forEach((index: string) => {
            allPotentialRelationTypes.add(index);
          });
          const relationTypesFromStructure = new Set<string>();
          const findRelationTypesInStructure = (structure: any) => {
            if (!structure) return;
            if (typeof structure === 'object' && !Array.isArray(structure)) {
              let identifiedType: string | null = null;
              if (structure.type === 'relation' && structure.relationType) {
                identifiedType = structure.relationType;
              }
              if (structure.attr?.name) {
                const nameAttr = structure.attr.name;
                const match = nameAttr.match(/data\[relation\]\[([^\]]+)\]/);
                if (match && match[1]) {
                  identifiedType = match[1];
                }
              }
              if (identifiedType) {
                allPotentialRelationTypes.add(identifiedType);
                relationTypesFromStructure.add(identifiedType);
              }
              for (const key in structure) {
                if (Object.prototype.hasOwnProperty.call(structure, key)) {
                  findRelationTypesInStructure(structure[key]);
                }
              }
            } else if (Array.isArray(structure)) {
              structure.forEach(item => findRelationTypesInStructure(item));
            }
          };
          findRelationTypesInStructure(formConfig.structure);
          if (entityToEdit?.relations) {
            entityToEdit.relations.forEach(rel => {
              if (rel._index) {
                allPotentialRelationTypes.add(rel._index);
              }
            });
          }
          const prefetchPromises: Promise<any>[] = [];
          allPotentialRelationTypes.forEach(type => {
            prefetchPromises.push(
              lastValueFrom(this.listEntitiesService.getEntitiesByIndex(type).pipe(
                tap(options => {
                  this.relationOptionsCache.set(type, options);
                }),
                catchError(e => {
                  console.error(`Errore durante il pre-caricamento delle entità per il tipo di relazione '${type}':`, e);
                  this.relationOptionsCache.set(type, []);
                  return of([]); 
                })
              ))
            );
          });
          await Promise.all(prefetchPromises);

          // Inietta i file CSS specifici del form
          if (formConfig.files && Array.isArray(formConfig.files)) {
            const cssFiles = (formConfig.files as any[]).filter(
              (file: any) => file.contentType === 'text/css' && file._id
            );
            cssFiles.forEach((file: any) => {
              const cssFileUrl = this.listEntitiesService.getFormContentFileUrl(file._id, entityIndex);
              const linkEl = document.createElement('link');
              linkEl.rel = 'stylesheet';
              linkEl.type = 'text/css';
              linkEl.href = cssFileUrl;
              linkEl.setAttribute('data-dynamic-form-style', 'true');
              document.head.appendChild(linkEl);
              this.injectedFormCssLinks.push(linkEl);
            });
          }

          if (formConfig.files && Array.isArray(formConfig.files)) {
            const htmlFile = (formConfig.files as any[]).find(
              (file: any) => file.contentType === 'text/html' && typeof file.data === 'string'
            );
            if (htmlFile) {
              const doc = parser.parseFromString(htmlFile.data, 'text/html');
              finalHtmlString = doc.body.innerHTML; // Prende l'HTML iniziale
            } else {
              this.toastr.warning(this.translate.instant('menu.entities.listentities.editModal.noHtmlFormContentInFormConfig'));
            }
          } else {
            this.toastr.warning(this.translate.instant('menu.entities.listentities.editModal.noFilesArrayInFormConfig'));
          }

          if (finalHtmlString) {
            this.entitySpecificFormHtml = this.domSanitizer.bypassSecurityTrustHtml(finalHtmlString);
          }

        } else {
          this.toastr.error(this.translate.instant('menu.entities.listentities.errorNoFormConfigFound', { index: entityIndex }));
        }
      } catch (err) {
        console.error(`Errore durante il recupero o processamento della configurazione del form per l'indice ${entityIndex}:`, err);
        this.toastr.error(this.translate.instant('menu.entities.listentities.errorLoadingFormConfig', { index: entityIndex }));
      } finally {
        this.isLoadingDetails = false;
        // isEditModalOpen is already true from the beginning
        this.cdr.detectChanges();

        const modalElement = document.getElementById('entityEdit');
        if (modalElement) {
            // Rimuove eventuali listener precedenti per sicurezza
            modalElement.removeEventListener('change', this.handleRelationSelectChange.bind(this));
            // Aggiunge un unico listener delegato
            modalElement.addEventListener('change', this.handleRelationSelectChange.bind(this));
      
            // Utilizziamo setTimeout per garantire che il DOM sia completamente stabile e che la modale sia visibile
            // prima di manipolare il suo contenuto.
            setTimeout(() => { // Inizio setTimeout
              const modalBody = modalElement.querySelector('.modal-body');
              if (!modalBody) return;
              const doc: Document = parser.parseFromString(finalHtmlString || '', 'text/html');

              // 1. Processa i placeholder delle relazioni e rimuove i pulsanti statici
              doc.querySelectorAll('[data-torelation]').forEach((placeholder: Element) => {
                const relationGroup = placeholder.closest('.relationcontgrp.repeatable');
                if (relationGroup) {
                  const staticActionBr = relationGroup.querySelector(':scope > .action-br');
                  if (staticActionBr) {
                    staticActionBr.remove();
                  }
                }
              });

              // 2. Sostituisce le select multiple con gruppi di checkbox
              doc.querySelectorAll('select[multiple].selectpicker').forEach((selectElAsElement: Element, selectIndex: number) => {
                const selectEl = selectElAsElement as HTMLSelectElement;
                const options: { value: string; label: string }[] = [];
                selectEl.querySelectorAll('option').forEach(opt => {
                  if (opt.value) {
                    options.push({ value: opt.value, label: opt.textContent || opt.value });
                  }
                });

                const checkboxContainer = document.createElement('div');
                checkboxContainer.classList.add('checkbox-group-container');

                options.forEach((opt, optIndex) => {
                  const checkboxId = `cb-${selectIndex}-${optIndex}`;
                  const checkboxWrapper = document.createElement('div');
                  checkboxWrapper.classList.add('mat-checkbox-wrapper');

                  const checkbox = document.createElement('input');
                  checkbox.type = 'checkbox';
                  checkbox.id = checkboxId;
                  checkbox.value = opt.value;
                  checkbox.setAttribute('data-original-select-name', selectEl.name);

                  const label = document.createElement('label');
                  label.setAttribute('for', checkboxId);
                  label.textContent = opt.label;

                  checkboxWrapper.appendChild(checkbox);
                  checkboxWrapper.appendChild(label);
                  checkboxContainer.appendChild(checkboxWrapper);
                });

                selectEl.style.display = 'none';
                selectEl.parentElement?.insertBefore(checkboxContainer, selectEl.nextSibling);
              });

              // 3. Modifica gli attributi onclick
              doc.querySelectorAll('[onclick*="cloneRepeatable("], [onclick*="removeRepeatable("]').forEach((button: Element) => {
                const onclickAttr = button.getAttribute('onclick');
                if (onclickAttr) button.setAttribute('onclick', onclickAttr.replace(/\$\(this\)/g, 'this'));
              });

              // 4. Costruisce e inietta le relazioni dinamiche
              const entityDetail = entityToEdit;
              if (entityDetail && (entityDetail.relations || allPotentialRelationTypes.size > 0)) {
                  doc.querySelectorAll('[data-torelation]').forEach((container: Element) => {
                      container.innerHTML = '';
                  });
                  const relationsToRender: Partial<RawEsEntity>[] = entityDetail.relations ? JSON.parse(JSON.stringify(entityDetail.relations)) : [];
                  const existingTypesInRenderList = new Set(relationsToRender.map(r => r?._index));
                  allPotentialRelationTypes.forEach((type: string) => {
                      if (type && !existingTypesInRenderList.has(type)) {
                          relationsToRender.push({ _index: type, _id: '', title: '' });
                          existingTypesInRenderList.add(type);
                      }
                  });
                  relationsToRender.sort((a, b) => {
                      if (a._index && b._index) {
                          const typeComparison = a._index.localeCompare(b._index);
                          if (typeComparison !== 0) {
                              return typeComparison;
                          }
                          if (a._id && !b._id) return -1;
                          if (!a._id && b._id) return 1;
                      }
                      return 0;
                  });
                  if (relationsToRender.length > 0) {
                      const relationTypeRenderCounts: { [key: string]: number } = {};
                      relationsToRender.forEach(r => {
                        if (r._index) {
                          relationTypeRenderCounts[r._index] = (relationTypeRenderCounts[r._index] || 0) + 1;
                        }
                      });
                      const firstRepeatableAddedForType = new Set<string>();

                      relationsToRender.forEach((relation, index) => {
                          const relationType = relation._index;
                          if (!relationType) {
                              return null;
                          }
                          const specificRelationsContainer = doc.querySelector(`[data-torelation="${relationType}"]`);
                          if (!specificRelationsContainer) {
                              return null;
                          }
                          const relationIndex = Array.from(specificRelationsContainer.children).length;

                          const clonedRelationElement = document.createElement('div');
                          clonedRelationElement.setAttribute('data-torelation-generated-item', relation._index || `relation-${index}`);
                          clonedRelationElement.setAttribute('data-relation-type', relationType);
                          clonedRelationElement.classList.add('repeatable', 'form-group');

                          if (!firstRepeatableAddedForType.has(relationType)) {
                              clonedRelationElement.classList.add('first-repeatable');
                              firstRepeatableAddedForType.add(relationType);
                          }
                          
                          const isPlaceholder = !relation._id;
                          const labelElement = document.createElement('label');
                          const selectElement = document.createElement('select');
                          const hiddenInput = document.createElement('input');
                          hiddenInput.type = 'hidden';
                          hiddenInput.name = `data[relation][${relationType}][${relationIndex}][to]`;
                          hiddenInput.setAttribute('value', relation._id || '');
                          hiddenInput.value = relation._id || ''; // Imposta entrambi per sicurezza

                          if (isPlaceholder) {
                            labelElement.textContent = this.translate.instant('menu.entities.listentities.editModal.newRelationLabel');
                          } else {
                            const relationTitle = relation.title || relation._id || '';
                            labelElement.textContent = this.translate.instant('menu.entities.listentities.editModal.existingRelationLabel', { relationTitle: relationTitle });
                          }
                          selectElement.id = `relation_select_${relationType}_${relationIndex}`;
                          labelElement.setAttribute('for', selectElement.id);

                          const options = this.relationOptionsCache.get(relationType) || [];
                          const placeholderOption = document.createElement('option');
                          placeholderOption.value = '';
                          placeholderOption.textContent = `--- ${this.translate.instant('menu.entities.listentities.editModal.selectRelationPlaceholder')} ---`;
                          selectElement.appendChild(placeholderOption);

                          options.forEach(optEntity => {
                              const optionElement = document.createElement('option') as HTMLOptionElement;
                              optionElement.value = optEntity._id;
                              optionElement.textContent = `${optEntity.title || optEntity._id} `;
                              if (optEntity._id === relation._id) {
                                  optionElement.selected = true;
                              }
                              selectElement.appendChild(optionElement);
                          });

                          const actionBrDiv = document.createElement('div');
                          actionBrDiv.classList.add('action-br');
                          const cloneButton = document.createElement('span');
                          cloneButton.classList.add('btn', 'btn-outline-primary', 'btn-sm');
                          cloneButton.textContent = ' +';
                          cloneButton.setAttribute('onclick', 'cloneRepeatable(this)');
                          const removeButton = document.createElement('span');
                          removeButton.classList.add('btn', 'btn-outline-danger', 'btn-sm', 'act-remove');
                          removeButton.textContent = '-';
                          removeButton.setAttribute('onclick', 'removeRepeatable(this)');
                          
                          const totalRelationsOfThisType = relationTypeRenderCounts[relationType] || 0;
                          if (totalRelationsOfThisType === 1 && !relation._id) {
                            removeButton.style.display = 'none';
                          } else {
                            removeButton.style.display = 'inline-block';
                          }

                          actionBrDiv.appendChild(cloneButton);
                          actionBrDiv.appendChild(removeButton);
                          
                          clonedRelationElement.appendChild(labelElement);
                          clonedRelationElement.appendChild(selectElement);
                          clonedRelationElement.appendChild(hiddenInput);
                          clonedRelationElement.appendChild(actionBrDiv);
                          
                          specificRelationsContainer.appendChild(clonedRelationElement);

                          return null;
                      });
                  }
              }

              // 5. Popola i valori del form e delle checkbox
              if (entityToEdit) {
                const entityDataForForm = { ...entityToEdit };

                const populateCheckboxes = (data: any, parentNode: Document | HTMLElement) => {
                  parentNode.querySelectorAll('input[type="checkbox"][data-original-select-name]').forEach((el: Element) => {
                    const checkbox = el as HTMLInputElement;
                    const originalSelectName = checkbox.getAttribute('data-original-select-name');
                    if (!originalSelectName) return;

                    const propertyPath = originalSelectName.replace(/^data\[/g, '').replace(/\]$/g, '').replace(/\]\[/g, '.');
                    const pathParts = propertyPath.split('.');
                    
                    // Cerca prima in data._source, poi fai un fallback all'oggetto data radice
                    let selectedValues = pathParts.reduce((obj, part) => (obj && obj[part] !== undefined) ? obj[part] : undefined, data?._source);
                    if (selectedValues === undefined) {
                        selectedValues = pathParts.reduce((obj, part) => (obj && obj[part] !== undefined) ? obj[part] : undefined, data);
                    }
                    checkbox.checked = Array.isArray(selectedValues) && selectedValues.includes(checkbox.value);
                  });
                };

                const setElementValue = (el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: any) => {
                  const finalValue = (value === null || value === undefined) ? '' : value;

                  if (el instanceof HTMLSelectElement) {
                    const selectElement = el;
                    Array.from(selectElement.options).forEach(opt => {
                      opt.selected = (opt.value == String(finalValue));
                      if (opt.selected) {
                        opt.setAttribute('selected', 'selected');
                      } else {
                        opt.removeAttribute('selected');
                      }
                      selectElement.value = String(finalValue);
                    });
                  } else if (el.type === 'checkbox' && el instanceof HTMLInputElement) {
                    el.checked = Boolean(finalValue);
                    if (el.checked) el.setAttribute('checked', 'checked');
                    else el.removeAttribute('checked');
                  } else if (el.type === 'radio' && el instanceof HTMLInputElement) {
                    el.checked = (el.value === String(finalValue));
                    if (el.checked) el.setAttribute('checked', 'checked');
                    else el.removeAttribute('checked');
                  } else if (el instanceof HTMLTextAreaElement) {
                    el.value = String(finalValue);
                  } else {
                    el.setAttribute('value', String(finalValue));
                    el.value = String(finalValue);
                  }
                };

                const populateForm = (data: any, parentNode: Document | HTMLElement) => {
                  parentNode.querySelectorAll('input, textarea, select:not([multiple])').forEach((element: Element) => {
                    const el = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
                    const nameAttr = el.getAttribute('name');

                    if (el.tagName === 'SELECT' && el.hasAttribute('multiple')) {
                      return;
                    }
                    // Salta i campi delle relazioni: i loro valori sono iniettati manualmente e non devono essere resettati
                    if (!nameAttr || nameAttr.includes('[relation]') || nameAttr.startsWith('data[relations]')) return;

                    let propertyPath = nameAttr.replace(/^data\[/g, '').replace(/\]$/g, '').replace(/\]\[/g, '.');
                    if (propertyPath === 'id') propertyPath = '_id';
                    if (propertyPath === 'index') propertyPath = '_index';
                    if (propertyPath === 'score') propertyPath = '_score';

                    const pathParts = propertyPath.split('.');
                    // Cerca prima in data.data, poi fai un fallback all'oggetto data radice
                    let value = pathParts.reduce((obj, part) => (obj && obj[part] !== undefined) ? obj[part] : undefined, data?._source);
                    if (value === undefined)
                        value = pathParts.reduce((obj, part) => (obj && obj[part] !== undefined) ? obj[part] : undefined, data);
                    setElementValue(el, value);
                  });
                };

                // Assegna l'HTML manipolato (ma non ancora popolato) al DOM di Angular
                this.entitySpecificFormHtml = this.domSanitizer.bypassSecurityTrustHtml(doc.body.innerHTML);
                this.cdr.detectChanges(); // Forza l'aggiornamento del DOM

                // Ora che il DOM è aggiornato, popola i valori direttamente sugli elementi renderizzati
                populateForm(entityDataForForm, modalBody as HTMLElement);
                populateCheckboxes(entityDataForForm, modalBody as HTMLElement);
              }

              // Inizializza i selectpicker dopo che Angular ha renderizzato l'HTML
              const selectPickers = this._jq(modalElement).find('.selectpicker');
              if (selectPickers.length > 0 && (this._jq.fn as any).selectpicker) {
                // La sequenza 'destroy' -> 'init' -> 'refresh' è la più robusta per contenuti dinamici.
                if ((selectPickers as any).data('selectpicker')) { (selectPickers as any).selectpicker('destroy'); } //
                (selectPickers as any).selectpicker(); // Inizializza il plugin
                (selectPickers as any).selectpicker('refresh'); // Aggiorna lo stato per riflettere i valori pre-selezionati
              }
            }, 500); // Aumentato il ritardo a 500ms per maggiore robustezza.
        }
      }
    } else {
      this.toastr.warning(this.translate.instant('menu.entities.listentities.noEntitySelectedForEdit'));
      console.warn('Nessuna entità selezionata o indice mancante per aprire la modale di modifica.');
    }
    this.isEditModalOpen = true;
  }
  
  private handleRelationSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    // Controlla se l'evento proviene da una select all'interno di un gruppo di relazioni
    if (target.tagName === 'SELECT' && target.closest('.repeatable')) {
        const jqSelect = this._jq(target);
        const hiddenInput = jqSelect.siblings('input[type="hidden"][name*="[relation]"]');
        if (hiddenInput.length) {
            const selectedValue = jqSelect.val() as string;
            hiddenInput.val(selectedValue);

            const label = jqSelect.siblings('label');
            if (label.length) {
                if (selectedValue) {
                    const selectedOptionText = jqSelect.find('option:selected').text().trim();
                    label.text(this.translate.instant('menu.entities.listentities.editModal.existingRelationLabel', { relationTitle: selectedOptionText }));
                } else {
                    label.text(this.translate.instant('menu.entities.listentities.editModal.newRelationLabel'));
                }
            }
        }
    }
  }
  private closeInjectedFormStyles(): void {
    this.injectedFormCssLinks.forEach(link => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    });
    this.injectedFormCssLinks = [];
  }
  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.entitySpecificFormHtml = null;
    this.closeInjectedFormStyles();
    console.log('Edit modal closed, dynamic form CSS removed.');
  }
  saveEntityChanges(): void {
    if (this.editEntityForm && this.editEntityForm.valid) {
      const entityId = this.selectedEntityDetail?._id;
      if (!entityId) {
        this.toastr.error('ID entità non trovato per il salvataggio.');
        return;
      }
      this.closeEditModal();
    } else {
      this.toastr.error(this.translate.instant('menu.entities.listentities.errorInvalidEditForm'));
      if (this.editEntityForm) {
        this.editEntityForm.markAllAsTouched();
      }
    }
  }
  /*Caricamento degli indici*/
  loadIndexes(): void {
    this.isLoading = true;
    const indexesSubscription = this.listEntitiesService.getAllEntities().subscribe({
      next: (response: GetAllEntitiesResponse) => {
        if (response && Array.isArray(response.data)) {
          const { flattenedData, templateKeys }: ProcessedEntitiesResult =
            this.listEntitiesService.processEntitiesAndExtractTemplateKeys(response.data);
          this.processedEntities = flattenedData;
          const uniqueIndexes: string[] = [];
          this.processedEntities.forEach(entity => {
            if (entity._index && !uniqueIndexes.includes(entity._index)) {
              uniqueIndexes.push(entity._index);
            }
          });
          this.indexes = uniqueIndexes.sort();
        } else {
          this.processedEntities = [];
          this.indexes = [];
        }
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Errore durante il caricamento degli indici:', error)
        this.indexes = [];
        this.processedEntities = [];
        this.applyFilters();
        this.isLoading = false;
      }
    });
    this.subscriptions.add(indexesSubscription);
  }
  /**
   * @param index 
   * @param type
   */
  loadTemplatesForIndex(index: string, type: string): void {
      const templatesSubscription = this.listEntitiesService.loadTemplatesByIndexAndType(index, type).subscribe({
          next: (templates: ProcessedTemplate[]) => {
              this.loadedTemplates = templates;
              if (this.selectedEntityDetail && this.selectedEntityDetail._index === index && this.loadedTemplates.length > 0) {
                this.renderEntityWithTemplate(this.selectedEntityDetail);
              }
          },
          error: (error: any) => {
              console.error(`Errore durante il caricamento dei template per l'indice "${index}":`, error);
              this.loadedTemplates = [];
          }
      });
      this.subscriptions.add(templatesSubscription);
  }
  applyFilters(): void {
    const formValues = this.entityForm.value;
    const selectIndexCtrl = formValues.selectIndexCtrl;
    const selectVisibilityCtrl = formValues.selectVisibilityCtrl;
    const selectStatusCtrl = formValues.selectStatusCtrl;
    const titleSearchTerm = formValues.titleCtrl ? formValues.titleCtrl.trim().replace(/\s\s+/g, ' ').toLowerCase() : undefined;
    const idCtrl = formValues.idCtrl;

    if (!this.processedEntities || this.processedEntities.length === 0) {
      this.filteredEntities = [];
      return;
    }

    this.filteredEntities = this.processedEntities.filter(entity => {
      if (selectIndexCtrl && entity._index !== selectIndexCtrl) {
        return false;
      }
      if (selectVisibilityCtrl) {
        if (!entity.properties || entity.properties.visibility !== selectVisibilityCtrl) {
          return false;
        }
      }
      if (selectStatusCtrl) {
        if (!entity.properties || entity.properties.status !== selectStatusCtrl) {
          return false;
        }
      }
      // Filtra per titolo (solo se titleSearchTerm è una stringa non vuota)
      if (titleSearchTerm) {
        const normalizedEntityTitle = entity.title ? entity.title.trim().replace(/\s\s+/g, ' ').toLowerCase() : null;
        if (!normalizedEntityTitle || !normalizedEntityTitle.includes(titleSearchTerm)) {
          return false;
        }
      }
      if (idCtrl && entity._id !== idCtrl) {
        return false;
      }
      return true;
    });

    this.totalSize = this.filteredEntities.length;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
      this.currentPage = 0;
    }
    this.updatePagedEntities();
  }

  updatePagedEntities(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedEntities = this.filteredEntities.slice(startIndex, endIndex);
    this.dataSource.data = this.pagedEntities;
  }

  public actionPutMultipartForm(
    type: string,
    el: any,
    datapost: any,
    senderFormSelector: string,
    callback: any,
    callerForm: any,
    useGritter: boolean
  ): void {
    if (type !== 'entity') {
      console.warn(`actionPutMultipartForm called with unsupported type: ${type}`);
      this.toastr.warning(`Unsupported action type: ${type}`);
      return;
    }

    const entityId = this.selectedEntityDetail?._id;
    if (!entityId) {
      console.error('Entity ID not found for saving.');
      this.toastr.error('Entity ID not found for saving.');
      return;
    }

    const formElement = document.querySelector(senderFormSelector) as HTMLFormElement;
    if (!formElement) {
      this.toastr.error(this.translate.instant('menu.entities.listentities.editModal.formNotFound', { selector: senderFormSelector }));
      console.error(`Form with selector "${senderFormSelector}" not found.`);
      return;
    }

    // Aggiorna le select multiple nascoste in base alle checkbox selezionate
    const checkboxGroups: { [key: string]: string[] } = {};
    this._jq('input[type="checkbox"][data-original-select-name]:checked').each((_, el) => {
      const checkbox = this._jq(el);
      const originalName = checkbox.attr('data-original-select-name');
      const value = checkbox.val() as string;
      if (originalName) {
        if (!checkboxGroups[originalName]) checkboxGroups[originalName] = [];
        checkboxGroups[originalName].push(value);
      }
    });
    Object.keys(checkboxGroups).forEach(name => {
      this._jq(`select[name="${name}"]`).val(checkboxGroups[name]);
    });

    const addedKeys = new Set<string>();
    const formData = new FormData();

    // 1. Processa tutti gli input standard, textarea e select singole (incluse le relazioni)
    this._jq(formElement).find('input:not([type="file"]), textarea, select:not([multiple])').each((idx, el) => {
      const input = this._jq(el);
      const name = input.attr('name');
      if (name) {
        const value = input.val();

        // Salta le relazioni non selezionate (valore vuoto)
        if (name.includes('[relation]') && (!value || value === '')) {
          console.log(`[DEBUG] skipping empty relation field: ${name}`);
        } else {
          formData.append(name, (value ?? '') as string);
          addedKeys.add(name);
        }
      }
    });

    // 2. Processa le select multiple per creare il formato indicizzato corretto
    this._jq(formElement).find('select[multiple]').each((_index, el) => {
      const select = this._jq(el);
      const name = select.attr('name');
      let selectedValues = (select.val() as string[] | null) || [];

      if (name) {
        selectedValues.forEach((value, i) => {
          const indexedName = `${name}[${i}]`;
          formData.append(indexedName, value);
        });
      }
    });
    // 3. Processa gli input di tipo file
    this._jq(formElement).find('input[type="file"]').each((_index, el) => {
      const fileInput = el as HTMLInputElement;
      const name = fileInput.name;
      if (name && fileInput.files && fileInput.files.length > 0) {
        formData.append(name, fileInput.files[0], fileInput.files[0].name);
      }
    });
    // 4. Aggiungi/Sovrascrivi i dati fondamentali per garantire che siano sempre corretti.
    // Questo viene fatto alla fine per evitare che vengano sovrascritti da campi del form con lo stesso nome.
    if (this.selectedEntityDetail?._index) {
      formData.set('instance[index]', this.selectedEntityDetail._index);
      formData.set('data[index]', this.selectedEntityDetail._index);
    } else {
      this.toastr.error('Errore critico: indice dell\'entità mancante.');
      return;
    }

    // Assicura che il titolo venga sempre preso dal campo corretto nel form.
    const titleInput = this._jq(formElement).find('input[name="data[title]"]');
    if (titleInput.length > 0) {
      formData.set('data[title]', titleInput.val() as string);
    }

    this.isLoadingDetails = true;
    this.cdr.detectChanges();
    const updateSubscription = this.listEntitiesService.updateEntity(entityId, formData)
      .pipe(
        finalize(() => {
          this.isLoadingDetails = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.toastr.success(this.translate.instant('menu.entities.listentities.editModal.saveSuccess'));
          this.closeEditModal();
          if (this.selectedEntityDetail) {
            this.showEntityDetails({ _id: entityId } as RawEsEntity);
          }
        },
        error: (err) => {
          console.error(`Error updating entity ${entityId}:`, err);
          const errorMessage = err.error?.message || err.message || this.translate.instant('menu.entities.listentities.editModal.saveErrorUnknown');
          this.toastr.error(this.translate.instant('menu.entities.listentities.editModal.saveError', { message: errorMessage }));
        }
      });
    this.subscriptions.add(updateSubscription);
  }
  /**
   * Gestisce gli eventi di cambio pagina dal MatPaginator.
   * @param event L'evento di paginazione.
   */
  handlePageEvent(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagedEntities();
  }
  
  getFormControlKeys(group: FormGroup | AbstractControl | null): string[] {
    if (group instanceof FormGroup) {
      return Object.keys(group.controls);
    }
    return [];
  }
  private getFieldConfigByKey(key: string): any {
    if (this.currentFormConfig?.structure) {
      if (Object.prototype.hasOwnProperty.call(this.currentFormConfig.structure, key)) {
        return this.currentFormConfig.structure[key];
      }
      if (Array.isArray(this.currentFormConfig.structure.child)) {
        const childConfig = (this.currentFormConfig.structure.child as any[]).find(
          (cf: any) => cf.attr?.name?.match(/^data\[(.*?)\]$/)?.[1] === key
        );
        if (childConfig) return childConfig;
      }
    }
    return null;
  }
  getFieldLabel(key: string): string {
    const config = this.getFieldConfigByKey(key);
    return config?.label || config?.attr?.placeholder || key;
  }
  getFieldType(key: string): string {
    const config = this.getFieldConfigByKey(key);
    return config?.attr?.type || 'text';
  }
  isFieldTextarea(key: string): boolean {
    const config = this.getFieldConfigByKey(key);
    return config?.type === 'textarea';
  }
  isFieldStandardSelect(key: string): boolean {
    const config = this.getFieldConfigByKey(key);
    return config?.type === 'select';
  }
  getFieldOptions(key: string): any[] {
    const config = this.getFieldConfigByKey(key);
    return config?.options || [];
  }
  isFieldHidden(key: string): boolean {
    const config = this.getFieldConfigByKey(key);
    return config?.attr?.type === 'hidden';
  }
  isFieldFile(key: string): boolean {
    const config = this.getFieldConfigByKey(key);
    return config?.attr?.type === 'file';
  }
  isRelationControl(key: string): boolean {
    return !!this.relationEditControls.find(rc => rc.controlName === key);
  }
  getRelationControlDefinition(key: string) {
    return this.relationEditControls.find(rc => rc.controlName === key);
  }
  getInitialRelationTitle(key: string): string {
    const relControl = this.getRelationControlDefinition(key);
    return relControl?.originalRelation?.title || relControl?.originalRelation?._id || '';
  }
  shouldShowOriginalRelationOption(key: string): boolean {
    const controlDef = this.getRelationControlDefinition(key);
    const currentValue = this.editEntityForm?.get(key)?.value;
    return !!controlDef && !controlDef.isLoadingOptions && !!currentValue && !controlDef.options.find(opt => opt._id === currentValue);
  }
  /**
   * Clona un gruppo di campi ripetibili.
   * @param clickedElement L'elemento jQuery che ha scatenato l'evento.
   */
    private cloneRepeatableLogic(clickedElement: JQuery<HTMLElement>): void { // JQuery<HTMLElement> è un'interfaccia globale
    const repeatableGroup = clickedElement.closest('.repeatable');
    if (!repeatableGroup || repeatableGroup.length === 0) {
      console.error('CloneRepeatable: Could not find parent ".repeatable" group.');
      return;
    }
    const relationTypeFromGroup = repeatableGroup.attr('data-relation-type');
    if (!relationTypeFromGroup) {
      console.error('CloneRepeatable: Impossibile determinare il tipo di relazione dall\'attributo "data-relation-type" dell\'elemento:', repeatableGroup);
      return;
    }
    const clone = repeatableGroup.clone(true); // Clona con tutti gli attributi e i dati
    // Resetta il testo della label nel clone a un valore generico.
    // Il testo corretto verrà impostato quando l'utente farà una selezione.
    const labelElement = clone.find('label');
    if (labelElement.length) {
        labelElement.text(this.translate.instant('menu.entities.listentities.editModal.newRelationLabel'));
    }

    // Pulisce tutti i campi nel gruppo clonato
    clone.find('input, textarea, select').each((index: number, el: HTMLElement) => {
      const inputEl = this._jq(el);
      // Non pulire l'input nascosto della relazione qui, verrà gestito dopo la popolazione della select
      if (inputEl.is(':checkbox') || inputEl.is(':radio')) { 
        inputEl.prop('checked', false);
      } else if (inputEl.is('select')) {
        // Resetta tutte le select, quelle di relazione verranno ripopolate dopo
        inputEl.prop('selectedIndex', -1); 
          inputEl.find('option').removeAttr('selected');
      } else {
        inputEl.val('');
      }
      // Rimuove attributi specifici che non dovrebbero essere clonati
      inputEl.removeAttr('oldval');
      if (inputEl.attr('type') === 'file') {
        inputEl.removeAttr('onchange');
      }
    });

    // Popola le select delle relazioni nel clone e imposta il valore iniziale dell'input nascosto
    clone.find('select').each((_, selectEl) => {
      const jqSelect = this._jq(selectEl);
      const hiddenInputForSelect = jqSelect.siblings('input[type="hidden"][name*="[relation]"]');

      if (hiddenInputForSelect.length) {
        const nameAttr = hiddenInputForSelect.attr('name');
        const match = nameAttr?.match(/data\[relation\]\[([^\]]+)\]/);
        const relationType = match ? match[1] : null;

        if (relationType && this.relationOptionsCache.has(relationType)) {
          const options = this.relationOptionsCache.get(relationType) || [];
          jqSelect.empty(); // Svuota le opzioni eventualmente clonate

          // Aggiungi un'opzione placeholder
          const placeholderOption = document.createElement('option');
          placeholderOption.value = '';
          placeholderOption.textContent = `--- ${this.translate.instant('menu.entities.listentities.editModal.selectRelationPlaceholder')} ---`;
          jqSelect.append(placeholderOption);

          // Popola con le opzioni dalla cache
          options.forEach(optEntity => {
            const optionElement = document.createElement('option');
            optionElement.value = optEntity._id;
            optionElement.textContent = `${optEntity.title || optEntity._id} `;
            jqSelect.append(optionElement);
          });
          // Imposta il valore dell'input nascosto al valore predefinito della select (il placeholder vuoto)
          hiddenInputForSelect.val(jqSelect.val() as string);
          console.log('[CLONE LOGIC] Initial hidden input value set to:', hiddenInputForSelect.val());
        } else {
          jqSelect.empty();
          const errorOption = document.createElement('option');
          // Notify a text with information about the error in the select
          errorOption.textContent = this.translate.instant('menu.entities.listentities.editModal.errorLoadingOptions');
          jqSelect.append(errorOption);
          console.warn(`Opzioni per il tipo di relazione '${relationType}' non trovate nella cache.`);
        }
      }
    });
    // Rimuove elementi specifici degli allegati
    clone.find('[fileid][attachref]').remove();
    clone.find('div[id^="contattach_data"]').remove();

    // Gestione specifica per Summernote, se presente
    clone.find('.summernote').each((index: number, el: HTMLElement) => {
      const summernoteEl = this._jq(el);
      summernoteEl.val('');
      if (summernoteEl.next().hasClass('note-editor')) {
        summernoteEl.next().remove();
      }
    });

    clone.removeClass('first-repeatable');
    clone.find('.act-remove').show();
    repeatableGroup.after(clone);
    // Re-indicizza il gruppo per garantire che i nomi degli input siano sequenziali
    // Dopo aver clonato, assicurati che tutti i pulsanti di rimozione per questo tipo di relazione siano visibili.
    const parentContainer = repeatableGroup.parent();
    if (parentContainer.length) {
        parentContainer.find(`.repeatable[data-relation-type="${relationTypeFromGroup}"]`).each((_, el) => { // Target specifico per tipo di relazione
            this._jq(el).find('.act-remove').css('display', 'inline-block');
        });
    }
    this.reindexRepeatableGroup(repeatableGroup.parent(), relationTypeFromGroup);
    const clonedHiddenInputAfterReindex = clone.find('input[type="hidden"][name*="[relation]"]');
  }

  /**
   * Rimuove un gruppo di campi ripetibili.
   * Se è l'ultimo elemento, svuota i campi invece di rimuoverlo.
   * @param clickedElement L'elemento jQuery che ha scatenato l'evento.
   */
  private removeRepeatableLogic(clickedElement: JQuery<HTMLElement>): void {
    const repeatableGroup = clickedElement.closest('.repeatable');
    if (!repeatableGroup || repeatableGroup.length === 0) {
      console.error('RemoveRepeatable: Could not find parent ".repeatable" group.');
      return;
    }
    const parentContainer = repeatableGroup.parent();
    const relationTypeFromGroup = repeatableGroup.attr('data-relation-type');
    if (!relationTypeFromGroup) {
      console.error('RemoveRepeatable: Impossibile determinare il tipo di relazione dall\'attributo "data-relation-type". Rimozione o re-indicizzazione non sicure.');
      repeatableGroup.remove();
      return;
    }

    // Impedisce la rimozione se è l'ultimo elemento di questo tipo
    const currentElementsOfType = parentContainer.find(`.repeatable[data-relation-type="${relationTypeFromGroup}"]`);
    if (currentElementsOfType.length <= 1) {
      return;
    }

    // Se stiamo rimuovendo una relazione esistente, aggiungiamo l'ID alla lista di cancellazione
    const sourceHiddenInput = repeatableGroup.find('input[type="hidden"][name*="[relation]"]');
    const relationIdToDelete = sourceHiddenInput.val();
    if (relationIdToDelete) {
      this.addDeletionInput(parentContainer, relationIdToDelete as string);
    }

    repeatableGroup.remove();

    // Se è rimasto solo un elemento dopo la rimozione, nascondi il suo pulsante "-"
    const remainingOfType = parentContainer.find(`.repeatable[data-relation-type="${relationTypeFromGroup}"]`);
    if (remainingOfType.length === 1) {
      remainingOfType.find('.act-remove').hide();
    }

    this.reindexRepeatableGroup(parentContainer, relationTypeFromGroup);
  }

  private addDeletionInput(container: JQuery<HTMLElement>, relationId: string): void {
    const form = container.closest('form');
    const existingDeleteInputs = form.find('input[name^="data[relationtodelete]"]');
    const newIndex = existingDeleteInputs.length;
    const deleteInput = this._jq('<input type="hidden">');
    deleteInput.attr('name', `data[relationtodelete][${newIndex}]`);
    deleteInput.val(relationId);
    container.append(deleteInput);
  }
  /**
   * Re-indicizza i nomi e gli ID degli input all'interno di un container di elementi ripetibili.
   * Questo è fondamentale per l'invio corretto dei dati del form al backend.
   * @param container Il container jQuery che contiene gli elementi '.repeatable'.
   * @param relationType Il tipo di relazione da re-indicizzare (es. 'documento_di_identita').
   */
  private reindexRepeatableGroup(container: JQuery<HTMLElement>, relationType: string): void {
    let currentIndex = 0;
    // Itera su tutti i gruppi ripetibili nel container
    container.find('.repeatable').each((_idx: number, groupEl: HTMLElement) => {
      const jqGroup = this._jq(groupEl);
      // Controlla se questo gruppo appartiene al tipo di relazione che stiamo re-indicizzando
      const hiddenInput = jqGroup.find(`input[type="hidden"][name*="[relation][${relationType}]"]`);
      if (hiddenInput.length > 0) {
        // Questo gruppo è del tipo corretto, quindi processa i suoi input
        jqGroup.find('input[name], textarea[name], select[name]').each((_inputIdx: number, inputEl: HTMLElement) => {
          const jqInput = this._jq(inputEl);
          const oldName = jqInput.attr('name');
          if (oldName) {
            // Sostituisce la prima occorrenza di un indice numerico [n] con il nuovo indice.
            // Funziona correttamente sia per percorsi semplici (data[field][0]) 
            // che complessi (data[relation][type][0][to])
            const newName = oldName.replace(/\[\d+\]/, `[${currentIndex}]`);
            jqInput.attr('name', newName);
            // Aggiorna anche l'ID e il 'for' della label se seguono un pattern
            const oldId = jqInput.attr('id');
            if (oldId) {
              const oldIdMatch = oldId.match(/^(.*_)\d+$/);
              if (oldIdMatch) {
                const idBase = oldIdMatch[1]; // es. "relation_select_my_type_"
                const newId = `${idBase}${currentIndex}`;
                jqInput.attr('id', newId);
                // Trova la label associata all'ID vecchio e aggiorna il suo 'for'
                jqGroup.find(`label[for="${oldId}"]`).attr('for', newId);
              }
            }
          }
        });
        currentIndex++;
      }
    });
  }
  
  /**
   * Gestisce gli eventi di click sui link delle relazioni.
   * @param event Click sul link della relazione.
   */
  public handleRenderedHtmlClick(event: MouseEvent): void {
    let targetElement = event.target as HTMLElement;
    // Risale l'albero DOM per trovare un link di relazione cliccato
    while (targetElement && targetElement !== event.currentTarget as HTMLElement) {
      if (targetElement.hasAttribute('onclick')) {
        const onclickAttr = targetElement.getAttribute('onclick')!;
        // Regex per estrarre l'ID da una chiamata come kmsrenderdetail('some-id-string')
        const match = onclickAttr.match(/kmsrenderdetail\s*\(\s*['"]([^'"]+)['"]\s*\)/);

        if (match && match[1]) {
          const entityId = match[1];
          // Previene l'azione di default (es. se è un link) e ferma la propagazione dell'evento
          event.preventDefault();
          event.stopPropagation();
          this.showEntityDetails({ _id: entityId } as RawEsEntity);
          return; // Esce dalla funzione una volta gestito il click
        }
      }
      targetElement = targetElement.parentElement as HTMLElement;
    }
  }
}