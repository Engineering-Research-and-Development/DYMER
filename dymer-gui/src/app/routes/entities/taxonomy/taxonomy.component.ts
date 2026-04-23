import { AfterViewInit, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse, } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TaxonomyService, Vocabulary, VocabularyUpdatePayload } from './taxonomy.service';
import { catchError, EMPTY, finalize, of, switchMap, throwError, tap } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select'; 
import { MatRadioModule } from '@angular/material/radio';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-taxonomy',
  templateUrl: './taxonomy.component.html',
  styleUrls: ['./taxonomy.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatRadioModule,
    MatListModule,
    MatSelectModule,
    MatCardModule,
    MatSnackBarModule,
    MatPaginatorModule,
    MatTabsModule,
    MatProgressBarModule,
    MatInputModule,
    MatTooltipModule,
    TranslateModule,
    MatDialogModule,
  ],
})
export class TaxonomyComponent implements OnInit, AfterViewInit {
  private taxonomyService = inject(TaxonomyService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  // Properties for the new vocabulary UI
  showAddVocab = false;
  vocabularies: Vocabulary[] = [];
  paginatedVocabularies: Vocabulary[] = [];
  vocabulariesDataSource = new MatTableDataSource<Vocabulary>();
  selectedVocab: Vocabulary | null = null;
  nodesDataSource = new MatTableDataSource<any>();
  paginatedNodes: any[] = [];

  addVocabularyForm!: FormGroup;
  importRestForm!: FormGroup;
  importCsvForm!: FormGroup;
  itemForm!: FormGroup;
  csvFileName: string | null = null;
  csvFile: File | null = null;
  private initialItemData: any | null = null;

  isLoading = false;

  @ViewChild('itemDialog') itemDialog!: TemplateRef<any>;
  @ViewChild('deleteDialog') deleteDialog!: TemplateRef<any>;
  @ViewChild(MatPaginator) vocabulariesPaginator!: MatPaginator;
  @ViewChild('nodesPaginator') nodesPaginator!: MatPaginator;

  ngOnInit(): void {
    this.initForm();
    this.loadData();
  }

  ngAfterViewInit() {
    this.vocabulariesDataSource.paginator = this.vocabulariesPaginator;
    this.vocabulariesDataSource.connect().subscribe(data => {
      this.paginatedVocabularies = data;
    });
    this.nodesDataSource.connect().subscribe(data => {
      this.paginatedNodes = data;
    });
  }

  private initForm(): void {
    this.addVocabularyForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
    });

    this.importRestForm = this.fb.group({
      title: ['', Validators.required],
      sourcePath: ['', Validators.required],
    });

    this.importCsvForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
    });

    this.itemForm = this.fb.group({
      id: [null],
      value: ['', Validators.required],
      locales: this.fb.group({
        en: ['', Validators.required],
        it: ['', Validators.required],
        fr: ['', Validators.required],
      }),
    });
  }

  loadData(): void {
    this.loadVocabularies();
  }

  loadVocabularies() {
    this.isLoading = true;
    this.taxonomyService
      .getVocabularies()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: res => {
          this.vocabulariesDataSource.data = res.data;
          console.log('Data controller lists', res.data);
        },
        error: err => {
          console.error(err);
          this.snackBar.open(this.translate.instant('menu.entities.taxonomy.errors.load'), 'Close', {
            duration: 5000,
          });
        },
      });
  }

  actionShowHideAddVocab() {
    this.showAddVocab = !this.showAddVocab;
    if (!this.showAddVocab) {
      this.addVocabularyForm.reset();
    }
  }

  createVocabulary() {
    if (this.addVocabularyForm.invalid) {
      this.snackBar.open(this.translate.instant('menu.entities.taxonomy.errors.fillRequiredFields'), 'Close', { duration: 3000 });
      return;
    }
    this.isLoading = true;
    this.taxonomyService
      .createVocabulary(this.addVocabularyForm.value)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: res => {
          if (res.data) {
            const currentData = this.vocabulariesDataSource.data;
            this.vocabulariesDataSource.data = [...currentData, res.data];
            this.snackBar.open(this.translate.instant('menu.entities.taxonomy.success.created'), 'Close', { duration: 3000 });
            this.addVocabularyForm.reset();
            this.showAddVocab = false;
          }
        },
        error: err => {
          console.error(err);this.snackBar.open(this.translate.instant('menu.entities.taxonomy.errors.create'), 'Close', {
            duration: 5000,
            panelClass: ['bg-red-500', 'text-white'],
          });
        },
      });
  }

  onVocabChange(vocab: Vocabulary) {
    if (this.selectedVocab?._id === vocab._id) {
      this.selectedVocab = null;
      this.nodesDataSource.data = [];
    } else {
      this.selectedVocab = vocab;
      this.nodesDataSource.data = this.selectedVocab.nodes || [];
      // Use a timeout to ensure the paginator is rendered before we assign it
      setTimeout(() => {
        this.nodesDataSource.paginator = this.nodesPaginator;
      });
    }
  }

  openModal(modalId: string, node?: any, action?: string) {
    if (modalId === 'deleteVocabulary') {
      const dialogRef = this.dialog.open(this.deleteDialog, {
        data: {
          title: this.translate.instant('menu.entities.taxonomy.deleteItem'),
          message: this.translate.instant('menu.entities.taxonomy.deleteItemMessage'),
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.deleteVocabulary();
        }
      });
    } else if (modalId === 'insertSubItem' || modalId === 'updateSubItem') {
      this.itemForm.reset();
      this.initialItemData = null;
      const isUpdate = modalId === 'updateSubItem';

      if (isUpdate && node) {
        this.itemForm.patchValue({
          id: node.id,
          value: node.value,
          locales: {
            en: node.locales.en.value,
            it: node.locales.it.value,
            fr: node.locales.fr.value,
          },
        });
        this.initialItemData = this.itemForm.value;
      }

      const dialogRef = this.dialog.open(this.itemDialog, {
        width: '700px', // Set modal width
        data: {
          title: this.translate.instant(isUpdate ? 'menu.entities.taxonomy.update' : 'menu.entities.taxonomy.insert'),
          action: this.translate.instant(isUpdate ? 'menu.actions.update' : 'menu.actions.save'),
          isUpdate: isUpdate,
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          if (isUpdate) {
            this.updateVocabItem(result, node);
          } else {
            this.insertvocab(result, node);
          }
        }
      });
    } else if (modalId === 'deleteSubItem') {
      const dialogRef = this.dialog.open(this.deleteDialog, {
        data: {
          title: this.translate.instant('menu.entities.taxonomy.deleteItem'),
          message: this.translate.instant('menu.entities.taxonomy.deleteItemMessage', { item: node.value }),
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.deleteVocabItem(node);
        }
      });
    } else {
      console.log('Opening modal:', modalId, 'for node:', node, 'with action:', action);
    }
  }

  deleteVocabulary(): void {
    if (!this.selectedVocab || !this.selectedVocab._id) {
      this.snackBar.open(this.translate.instant('menu.entities.taxonomy.errors.noneSelected'), 'Close', { duration: 3000 });
      return;
    }
    this.isLoading = true;
    const vocabularyID = this.selectedVocab._id;
    this.taxonomyService
      .deleteVocabulary(vocabularyID!)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.vocabulariesDataSource.data = this.vocabulariesDataSource.data.filter(v => v._id !== vocabularyID);          
          this.nodesDataSource.data = [];
          this.selectedVocab = null;
          this.snackBar.open(this.translate.instant('menu.entities.taxonomy.success.deleted'), 'Close', { duration: 3000 });
        },
        error: err => {
          console.error(err);
          this.snackBar.open(this.translate.instant('menu.entities.taxonomy.errors.delete'), 'Close', {
            duration: 5000,
            panelClass: ['bg-red-500', 'text-white'],
          });
        },
      });
  }

  toggle(node: any) {
    node.collapsed = !node.collapsed;
  }

  getLocales(locales: object) {
    return Object.entries(locales).map(([key, value]) => ({ key, value }));
  }

  saveUpdateVocab(): void {
    if (!this.selectedVocab || !this.selectedVocab._id) {
      this.snackBar.open(this.translate.instant('menu.entities.taxonomy.errors.noneSelected'), 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    const vocabularyID = this.selectedVocab._id;
    const payload: VocabularyUpdatePayload = {
      id: vocabularyID!,
      data: this.nodesDataSource.data,
    };

    this.taxonomyService
      .updateVocabularyNodes(payload)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          const index = this.vocabulariesDataSource.data.findIndex(v => v._id === vocabularyID);
          if (index > -1) {
            const updatedData = [...this.vocabulariesDataSource.data];
            updatedData[index].nodes = this.nodesDataSource.data;
            this.vocabulariesDataSource.data = updatedData;
          }
          this.snackBar.open(this.translate.instant('menu.entities.taxonomy.success.updated'), 'Close', { duration: 3000 });
        },
        error: err => {
          console.error('Error updating vocabulary:', err);
          this.snackBar.open(this.translate.instant('menu.entities.taxonomy.errors.update'), 'Close', {
            duration: 5000,
            panelClass: ['bg-red-500', 'text-white'],
          });
        },
      });
  }

  importVocabularyFromREST() {
    if (this.importRestForm.invalid) {
      this.snackBar.open(this.translate.instant('menu.entities.taxonomy.errors.fillRequiredFields'), 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    const { title, sourcePath } = this.importRestForm.value;

    // This logic sequentially:
    // 1. Checks for a local vocabulary with the same title.
    // 2. If it exists, deletes it.
    // 3. Fetches the vocabulary from the remote source.
    // 4. If found, creates a new local vocabulary.
    // 5. Updates the new local vocabulary with the nodes from the remote one.
    this.taxonomyService.getVocabularyByTitle(title).pipe(
      switchMap(response => {
        if (response.data?._id) {
          return this.taxonomyService.deleteVocabulary(response.data._id);
        }
        // No existing vocabulary, continue.
        return of(null);
      }),
      switchMap(() => {
        return this.taxonomyService.getRemoteVocabularyByTitle(sourcePath, title);
      }),
      switchMap(remoteVocabResponse => {
        if (remoteVocabResponse?.data) {
          const newVoc = {
            title: remoteVocabResponse.data.title,
            description: remoteVocabResponse.data.description,
          };
          // Create the new empty vocabulary
          return this.taxonomyService.createVocabulary(newVoc).pipe(
            switchMap(createdVocabResponse => {
              if (createdVocabResponse?.data?._id) {
                // If creation is successful, update it with the nodes
                const payload = {
                  id: createdVocabResponse.data._id!,
                  data: remoteVocabResponse.data!.nodes || []
                };
                return this.taxonomyService.updateVocabularyNodes(payload);
              }
              return throwError(() => new Error('Failed to create new vocabulary.'));
            })
          );
        } else {
          // Remote vocabulary not found
          this.snackBar.open(this.translate.instant('menu.entities.taxonomy.errors.import.noRemoteVocab'), 'Close', { duration: 5000, panelClass: ['bg-red-500', 'text-white'] });
          return EMPTY;
        }
      }),
      catchError(err => {
        console.error('Error during import process:', err);
        this.snackBar.open(this.translate.instant('menu.entities.taxonomy.errors.import'), 'Close', { duration: 5000, panelClass: ['bg-red-500', 'text-white'] });
        return EMPTY; 
      }),
      finalize(() => {
        this.isLoading = false;
        this.importRestForm.reset();
      })
    ).subscribe({
      next: () => {
        this.snackBar.open(this.translate.instant('menu.entities.taxonomy.success.imported'), 'Close', { duration: 3000 });
        this.loadVocabularies();
      },
    });
  }

  importVocabularyFromCSV() {
    if (this.importCsvForm.invalid || !this.csvFile) {
      this.snackBar.open(this.translate.instant('menu.entities.taxonomy.errors.fillRequiredFields'), 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    const { title, description } = this.importCsvForm.value;
    
    this.taxonomyService.uploadCsv(this.csvFile).pipe(
      switchMap((csvData: string[]) => {
        try {
          if (!csvData || csvData.length === 0) {
            this.snackBar.open(this.translate.instant('menu.entities.taxonomy.errors.emptyCsv'), 'Close', { duration: 5000, panelClass: ['bg-red-500', 'text-white'] });
            return EMPTY;
          }

          // Parse CSV data to extract vocabulary
          const separator = ',';
          const header = csvData[0].replace(/"/g, '').split(separator);
          const columnIndex = header.indexOf(title);

          if (columnIndex === -1) {
            this.snackBar.open(this.translate.instant('menu.entities.taxonomy.errors.import.csvColumnNotFound', { title }), 'Close', { duration: 5000, panelClass: ['bg-red-500', 'text-white'] });
            return EMPTY;
          }

          const vocabularySet = new Set<string>();
          for (let i = 1; i < csvData.length; i++) { // Start from 1 to skip header
            let record = csvData[i];
            if (!record || record.trim() === '') { // Skip empty lines
              continue;
            }
            // Handle quoted fields that may contain commas
            record = record.replace(/"[^"]+"/g, (v) => v.replace(/,/g, '_'));
            const fields = record.split(separator);

            // Ensure the column exists before trying to access it
            if (columnIndex < 0 || columnIndex >= fields.length) {
              continue;
            }
            if (fields[columnIndex]) {
              const items = fields[columnIndex].split('_');
              for (let item of items) {
                item = item.replace(/"/g, '').trim();
                if (item.startsWith('"') && item.endsWith('"')) { // Remove quotes if present
                  item = item.substring(1, item.length - 1);
                }
                if (item) {
                  vocabularySet.add(item);
                }
              }
            }
          }

          const vocabulary = Array.from(vocabularySet);

          // Check if vocabulary with the same title exists and delete it
          return this.taxonomyService.getVocabularyByTitle(title).pipe(
            switchMap(response => {
              if (response.data?._id) {
                return this.taxonomyService.deleteVocabulary(response.data._id);
              }
              return of(null); // No existing vocabulary, continue
            }),
            catchError((err: HttpErrorResponse) => {
              if (err.status === 404) {
                return of(null); // Continue the chain as if nothing was deleted.
              }
              return throwError(() => err); // Re-throw other, more serious errors.
            }),
            switchMap(() => this.taxonomyService.createVocabulary({ title, description })),
            switchMap(createdVocab => {
              if (!createdVocab?.data?._id) {
                return throwError(() => new Error(this.translate.instant('menu.entities.taxonomy.errors.csvShellFailed')));
              }
              const nodes = vocabulary.map(v => ({ value: v, locales: { en: { value: v }, it: { value: v }, fr: { value: v } }, nodes: [], collapsed: true }));
              const payload: VocabularyUpdatePayload = { id: createdVocab.data._id, data: nodes };
              return this.taxonomyService.updateVocabularyNodes(payload);
            })
          );
        } catch (syncError: any) {
          // Catch synchronous errors during CSV parsing and re-throw as an observable error
          return throwError(() => new Error(this.translate.instant('menu.entities.taxonomy.errors.csvParsing', { message: syncError.message || 'Unknown parsing error' })));
        }
      }),
      catchError((err: any) => { // Use 'any' here to avoid type errors if the error object is malformed
        console.error('Error caught in component pipe (outer):', err);
        this.snackBar.open(this.translate.instant('menu.entities.taxonomy.errors.import'), 'Close', { duration: 5000, panelClass: ['bg-red-500', 'text-white'] });
        return EMPTY; // Stop the RxJS chain
      }),
      finalize(() => {
        this.isLoading = false;
        this.importCsvForm.reset();
        this.csvFile = null;
        this.csvFileName = null;
      })
    ).subscribe({
      next: () => {
        this.snackBar.open(this.translate.instant('menu.entities.taxonomy.success.imported'), 'Close', { duration: 3000 });
        this.loadVocabularies();
      },
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.csvFile = input.files[0];
      this.csvFileName = this.csvFile.name;
    } else {
      this.csvFile = null;
      this.csvFileName = null;
    }
    this.cdr.markForCheck();
  }

  insertvocab(newItemData: any, parentNode?: any) {
    const newNode = {
      id: newItemData.id || new Date().getTime(),
      value: newItemData.value,
      locales: {
        en: { value: newItemData.locales.en },
        it: { value: newItemData.locales.it },
        fr: { value: newItemData.locales.fr },
      },
      nodes: [],
      collapsed: true,
    };

    if (parentNode) {
      parentNode.nodes = parentNode.nodes || [];
      parentNode.nodes.push(newNode);
      parentNode.collapsed = false;
    } else {
      this.nodesDataSource.data = [...this.nodesDataSource.data, newNode];
    }
    this.snackBar.open(this.translate.instant('menu.entities.taxonomy.itemAdded'), 'Close', { duration: 3000 });
  }

  deleteVocabItem(nodeToDelete: any) {
    const findAndRemove = (nodes: any[], nodeId: any): boolean => {
      const index = nodes.findIndex(node => node.id === nodeId);
      if (index !== -1) {
        nodes.splice(index, 1);
        return true;
      }
      for (const node of nodes) {
        if (node.nodes && findAndRemove(node.nodes, nodeId)) {
          return true;
        }
      }
      return false;
    };

    if (findAndRemove(this.nodesDataSource.data, nodeToDelete.id)) {
      this.nodesDataSource.data = [...this.nodesDataSource.data]; // Trigger update
      this.snackBar.open(this.translate.instant('menu.entities.taxonomy.itemDeleted'), 'Close', {
        duration: 3000,
      });
    }
  }
  updateVocabItem(updatedData: any, nodeToUpdate: any) {
    nodeToUpdate.value = updatedData.value;
    nodeToUpdate.locales = {
      en: { value: updatedData.locales.en },
      it: { value: updatedData.locales.it },
      fr: { value: updatedData.locales.fr },
    };
    this.snackBar.open(this.translate.instant('menu.entities.taxonomy.itemUpdated'), 'Close', {
      duration: 3000,
    });
  }

  resetCsvForm() {
    this.importCsvForm.reset();
    this.csvFile = null;
    this.csvFileName = null;
  }

  resetItemForm() {
    if (this.initialItemData) {
      this.itemForm.patchValue(this.initialItemData);
    } else {
      this.itemForm.reset();
    }
  }
}
