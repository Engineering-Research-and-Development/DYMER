import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RelationsService, RawEsEntity } from './relations.service';
import { tap, switchMap, map, catchError, of, Observable } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-relations',
  templateUrl: './relations.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatSelectModule,
    MatCardModule,
    MatSnackBarModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatInputModule,
    MatTooltipModule,
    TranslateModule,
  ],
})
export class RelationsComponent implements OnInit, AfterViewInit {
  private relationsService = inject(RelationsService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);

  manageRelForm!: FormGroup;
  groupedEntities: { groupName: string; entities: RawEsEntity[] }[] = [];
  dataSource = new MatTableDataSource<any>();
  isLoading = false;
  isUpdating = false;
  selectedRelationForUpdate: any = null;
  //showConfigAuthentication = false;
  showConfigAuthentication = true;

  private allEntities: RawEsEntity[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('relationFormCardContent') relationFormCardContent?: ElementRef;

  ngOnInit(): void {
    this.initForm();
    this.loadData();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  private initForm(): void {
    this.manageRelForm = this.fb.group({
      _id: [null],
      _id1: ['', [Validators.required]],
      index1: [''],
      _id2: ['', [Validators.required]],
      index2: [''],
      type: [''],
      directed: [false],
      attributes: this.fb.group({}),
    });
  }

  /**
   * Carica tutte le entità e le relazioni, arricchendo le relazioni con i titoli.
   */
  loadData(): void {
    this.isLoading = true;
    // 1. Recupera tutte le entità (per i menu a tendina e per arricchire le relazioni)
    this.relationsService.getAllEntities().pipe(
      tap(response => {
        // Appiattisce _source nell'entità e la salva per un uso successivo
        this.allEntities = response.data.map(e => ({ ...e, ...e._source }));
        // Raggruppa le entità per indice per popolare i menu a tendina
        this.groupedEntities = this.groupEntitiesByIndex(this.allEntities);
      }),
      // 2. Successivamente, recupera tutte le relazioni
      switchMap(() => this.relationsService.getRelations()),
      // 3. Arricchisci le relazioni con i titoli delle entità collegate
      map(relationsResponse => {
        const relations = relationsResponse.data;
        return relations.map(relation => {
          const entity1 = this.allEntities.find(e => e._id === relation._source?._id1);
          const entity2 = this.allEntities.find(e => e._id === relation._source?._id2);
          // Aggiunge title1 e title2 all'oggetto della relazione
          return {
            ...relation,
            title1: entity1?.title ?? this.translate.instant('menu.entities.relations.entityNotFound'),
            title2: entity2?.title ?? this.translate.instant('menu.entities.relations.entityNotFound'),
          };
        });
      }),
      catchError(error => {
        console.error('Errore durante il caricamento dei dati delle relazioni', error);
        this.snackBar.open(this.translate.instant('menu.entities.relations.loadError'), this.translate.instant('close'), { duration: 5000, panelClass: ['bg-red-500', 'text-white'] });
        this.isLoading = false;
        return of([]); // Ritorna un array vuoto per non interrompere lo stream
      })
    ).subscribe(enrichedRelations => {
      this.dataSource.data = enrichedRelations;
      this.isLoading = false;
    });
  }
    resetManageRel(): void {
      // Resetta il form ai valori iniziali
      this.manageRelForm.reset({
        _id: '',
        id1: '',
        index1: '',
        id2: '',
        index2: ''
      });

      // Opzionale: Se hai una variabile che traccia se sei in "edit mode"
      // o se vuoi pulire eventuali messaggi di errore
      this.manageRelForm.markAsPristine();
      this.manageRelForm.markAsUntouched();
      
      // Se la UI di Resend/OpenClaw prevede di nascondere il form dopo il reset, 
      // potresti usare un Signal per chiudere la sezione
      // this.showConfigAuthentication.set(false); 
    }
  private groupEntitiesByIndex(entities: RawEsEntity[]): {
    groupName: string;
    entities: RawEsEntity[];
  }[] {
    const groupsAsRecord: Record<string, RawEsEntity[]> = entities.reduce((acc, entity) => {
      const index = entity._index;
      if (!acc[index]) {
        acc[index] = [];
      }
      acc[index].push(entity);
      return acc;
    }, {} as Record<string, RawEsEntity[]>);

    return Object.keys(groupsAsRecord).map(key => ({ groupName: key, entities: groupsAsRecord[key] }));
  }

  deleteRelationById(relation: any): void {
    const confirmMessage = this.translate.instant('menu.entities.relations.confirmDelete', {
      title1: relation.title1,
      title2: relation.title2,
    });
    if (window.confirm(confirmMessage)) {
      this.relationsService.deleteSingleRelationById(relation._id, relation).subscribe({
        next: response => {
          if (response && response.success) {
            this.dataSource.data = this.dataSource.data.filter(r => r._id !== relation._id);
            this.snackBar.open(response.message || this.translate.instant('menu.entities.relations.deleteSuccess'), this.translate.instant('close'), {
              duration: 3000,
            });
          } else {
            this.snackBar.open(response.message || this.translate.instant('menu.entities.relations.deleteError'), this.translate.instant('close'), {
              duration: 5000,
              panelClass: ['bg-red-500', 'text-white'],
            });
          }
        },
        error: err => {
          console.error('Error in relation delete !', err);
          this.snackBar.open(this.translate.instant('menu.entities.relations.deleteError'), this.translate.instant('close'), {
            duration: 5000,
            panelClass: ['bg-red-500', 'text-white'],
          });
        },
      });
    }
  }

  /**
   * Prepara il componente per l'aggiornamento di una relazione.
   * @param relation La relazione da aggiornare.
   */
  setUpdateManageRel(relation: any): void {
    this.showConfigAuthentication = true;
    this.isUpdating = true;
    // Crea una copia per evitare di modificare direttamente l'oggetto nella lista
    this.selectedRelationForUpdate = { ...relation };
    this.manageRelForm.patchValue({
      _id: relation._id,
      _id1: relation._source?._id1,
      index1: relation._source?._index1,
      _id2: relation._source?._id2,
      index2: relation._source?._index2,
      type: relation._source?.type,
      directed: relation._source?.directed,
      attributes: relation._source?.attributes || {},
    });

    // Scroll to form for better UX
    setTimeout(() => {
      this.relationFormCardContent?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /**
   * Annulla la modalità di aggiornamento.
   */
  cancelUpdate(): void {
    this.isUpdating = false;
    this.selectedRelationForUpdate = null;
    this.manageRelForm.reset();
  }

  /**
   * Gestisce il cambio di selezione di un'entità, assicurando che le due entità
   * selezionate non siano uguali.
   * @param selector Identificatore del selettore che ha scatenato l'evento ('sel1' o 'sel2').
   */
  onEntitySelectionChange(selector: string): void {
    const { _id1, _id2 } = this.manageRelForm.value;

    if (selector === 'sel1' && _id1) {
      const entity1 = this.allEntities.find(e => e._id === _id1);
      this.manageRelForm.patchValue({ index1: entity1?._index });
    }
    if (selector === 'sel2' && _id2) {
      const entity2 = this.allEntities.find(e => e._id === _id2);
      this.manageRelForm.patchValue({ index2: entity2?._index });
    }

    if (_id1 && _id1 === _id2) {
      this.snackBar.open(this.translate.instant('menu.entities.relations.sameEntityError'), this.translate.instant('close'), {
        duration: 3000,
        panelClass: ['bg-orange-500', 'text-white'],
      });
      // Resetta il campo che è stato appena modificato per forzare una nuova selezione.
      const controlToReset = selector === 'sel1' ? '_id1' : '_id2';
      const indexControlToReset = selector === 'sel1' ? 'index1' : 'index2';
      this.manageRelForm.get(controlToReset)?.reset();
      this.manageRelForm.get(indexControlToReset)?.reset();
    }
  }

  private relationExists(formValue: any, relationIdToExclude?: string): boolean {
    return this.dataSource.data.some(r => {
      // Se stiamo aggiornando, escludiamo la relazione corrente dal controllo
      if (relationIdToExclude && r._id === relationIdToExclude) {
        return false;
      }
      const isSameDirection =
        r._source?._id1 === formValue._id1 &&
        r._source?._id2 === formValue._id2 &&
        r._source?._index1 === formValue.index1 &&
        r._source?._index2 === formValue.index2;

      const isOppositeDirection =
        r._source?._id1 === formValue._id2 &&
        r._source?._id2 === formValue._id1 &&
        r._source?._index1 === formValue.index2 &&
        r._source?._index2 === formValue.index1;

      return isSameDirection || isOppositeDirection;
    });
  }

  saveManageRel(): void {
    if (this.manageRelForm.invalid) {
      this.manageRelForm.markAllAsTouched();
      this.snackBar.open(this.translate.instant('menu.entities.relations.fillRequiredFields'), this.translate.instant('close'), {
        duration: 3000,
      });
      return;
    }

    this.isLoading = true;
    const formValue = this.manageRelForm.getRawValue();

    if (this.isUpdating && formValue._id) {
      if (this.relationExists(formValue, formValue._id)) {
        this.snackBar.open(this.translate.instant('menu.entities.relations.alreadyExists'), this.translate.instant('close'), {
          duration: 3000,
          panelClass: ['bg-orange-500', 'text-white'],
        });
        this.isLoading = false;
        return;
      }

      const relationId = formValue._id;
      const relationData = {
        id1: formValue._id1,
        index1: formValue.index1,
        id2: formValue._id2,
        index2: formValue.index2,
        type: formValue.type,
        directed: formValue.directed,
        attributes: formValue.attributes,
      };

      this.relationsService.updateSingleRelation(relationId, relationData).subscribe({
        next: () => {
          this.snackBar.open(this.translate.instant('menu.entities.relations.updateSuccess'), this.translate.instant('close'), {
            duration: 3000,
          });
          this.isLoading = false;
          this.cancelUpdate();
          this.loadData();
        },
        error: err => {
          console.error("Errore durante l'aggiornamento della relazione", err);
          this.snackBar.open(this.translate.instant('menu.entities.relations.updateError'), this.translate.instant('close'), {
            duration: 5000,
            panelClass: ['bg-red-500', 'text-white'],
          });
          this.isLoading = false;
        },
      });
    } else {
      if (this.relationExists(formValue)) {
        this.snackBar.open(this.translate.instant('menu.entities.relations.alreadyExists'), this.translate.instant('close'), {
          duration: 3000,
          panelClass: ['bg-orange-500', 'text-white'],
        });
        this.isLoading = false;
        return;
      }

      const relationData = {
        id1: formValue._id1,
        index1: formValue.index1,
        id2: formValue._id2,
        index2: formValue.index2,
        type: formValue.type,
        directed: formValue.directed,
        attributes: formValue.attributes,
      };

      this.relationsService.createSingleRelation(relationData).subscribe({
        next: response => {
          if (response && response.success) {
            this.snackBar.open(response.message || this.translate.instant('menu.entities.relations.createSuccess'), this.translate.instant('close'), {
              duration: 3000,
            });
            this.cancelUpdate();
            this.loadData();
          } else {
            this.snackBar.open(
              response.message || this.translate.instant('menu.entities.relations.createError'),
              this.translate.instant('close'),
              {
                duration: 5000,
                panelClass: ['bg-red-500', 'text-white'],
              }
            );
          }
          this.isLoading = false;
        },
        error: err => {
          console.error('Errore durante la creazione della relazione', err);
          this.snackBar.open(this.translate.instant('menu.entities.relations.createError'), this.translate.instant('close'), {
            duration: 5000,
            panelClass: ['bg-red-500', 'text-white'],
          });
          this.isLoading = false;
        },
      });
    }
  }

  toggleConfig(): void {
    this.showConfigAuthentication = !this.showConfigAuthentication;
  }
}
