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
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MtxGridModule } from '@ng-matero/extensions/grid';
import {LibrariesService, Library } from './libraries.service';
import { BehaviorSubject, Observable, switchMap, tap } from 'rxjs';
 
@Component({
  selector: 'app-libraries',
  templateUrl: './libraries.component.html',
  styleUrls: ['./libraries.component.scss'],
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
    MatSortModule,
    MtxGridModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // Workaround per l'errore NG8002
})
export class LibrariesComponent implements OnInit, AfterViewInit {
  // Subject per triggerare il refresh dei dati
  private refresh$ = new BehaviorSubject<void>(undefined);

  // Properties for Libraries
  libraryCardsConfigs: any[] = [];
  showNewLibrary = false;
  nameFocused = false;
  selectedLibraryType: 'Javascript' | 'CSS' | '' = '';
  library: Partial<Library> = { useonload: true };
  fileUpload: File | null = null;
  @ViewChild('formNewLibrary') formNewLibrary!: NgForm;
  @ViewChild('activationCell', { static: true }) activationCell!: TemplateRef<any>;
  @ViewChild('useOnLoadCell', { static: true }) useOnLoadCell!: TemplateRef<any>;
  @ViewChild('mandatoryCell', { static: true }) mandatoryCell!: TemplateRef<any>;
  @ViewChild('deleteCell', { static: true }) deleteCell!: TemplateRef<any>;
  @ViewChild('callbackCell', { static: true }) callbackCell!: TemplateRef<any>;
  @ViewChildren(MatSort) sorts!: QueryList<MatSort>;

  constructor(
    private librariesService: LibrariesService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadLibraryData();
  }

  ngAfterViewInit(): void {
    // Collega i sort quando vengono inizializzati o cambiano
    this.sorts.changes.subscribe(() => this.linkSorts());
  }

  private linkSorts(): void {
    // Usa un setTimeout per assicurarsi che tutto sia renderizzato prima di collegare
    setTimeout(() => {
      if (this.sorts && this.libraryCardsConfigs.length) {
        this.libraryCardsConfigs.forEach((config, index) => {
          config.dataSource.sort = this.sorts.toArray()[index];
        });
      }
    }, 0);
  }

  private loadLibraryData(): void {
    this.refresh$.pipe(
      switchMap(() => this.librariesService.getCustomLibraries()),
      tap((libs: Library[]) => {
        this.libraryCardsConfigs = this.processLibraries(libs);
        this.cdr.detectChanges(); // Usa detectChanges per forzare un render sincrono
      })
    ).subscribe({
      error: (err: any) => console.error('Error loading custom libraries', err)
    });
  }

  private processLibraries(libs: Library[]): any[] {
    const viewLibs = libs.filter(lib => lib.loadtype === 'view');
    const mapLibs = libs.filter(lib => lib.loadtype === 'map');
    const formLibs = libs.filter(lib => lib.loadtype === 'form');

    const displayedColumns = ['activated', 'name', 'filename', 'group', 'callback', 'useonload', 'mandatory', 'delete'];

    const newConfigsData = [
      { titleKey: 'libraries.view', libs: viewLibs },
      { titleKey: 'libraries.map', libs: mapLibs },
      { titleKey: 'libraries.form', libs: formLibs },
    ];

    return [
      ...newConfigsData.map(configData => {
        const title = this.translate.instant(configData.titleKey);
        // Cerca la configurazione precedente per preservare lo stato di apertura della card
        const oldConfig = this.libraryCardsConfigs.find(c => c.title === title);
        return { title, showConfig: oldConfig ? oldConfig.showConfig : false, dataSource: new MatTableDataSource(configData.libs), displayedColumns: displayedColumns };
      })
    ];
  }

  private forceRefresh(): void {
    this.refresh$.next();
  }

  onDeleteLibrary(library: Library): void {
    if (!library._id) {
      console.error('Library ID is missing.');
      this.snackBar.open(this.translate.instant('errors.common.error_deleting'), this.translate.instant('close'), { duration: 5000, panelClass: ['mat-warn'] });
      return;
    }

    const confirmation = window.confirm(this.translate.instant('libraries.delete_confirmation', { name: library.name }));

    if (confirmation) {
      library.isPendingAction = true; 
      this.cdr.markForCheck();

      this.librariesService.deleteLibrary(library._id).subscribe({
        next: response => {
          if (response.success) {
            this.snackBar.open(response.message || this.translate.instant('libraries.delete_success'), this.translate.instant('close'), { duration: 3000 });
            this.forceRefresh(); // Triggera il refresh dei dati
          } else {
            this.snackBar.open(response.message || this.translate.instant('errors.common.error_deleting'), this.translate.instant('close'), { duration: 5000, panelClass: ['mat-warn']});
            this.forceRefresh(); // Ricarica comunque per rimuovere lo stato 'pending'
          }
        },
        error: (err) => {
          console.error('Error deleting library', err);
          this.snackBar.open(this.translate.instant('errors.common.error_deleting'), this.translate.instant('close'), { duration: 5000, panelClass: ['mat-warn'] });
        }
      });
    }
  }

  openReloadModal(): void {
    const confirmation = window.confirm(
      this.translate.instant('libraries.reload_confirmation')
    );
    if (confirmation) {
      this.librariesService.reloadLibraries().subscribe({
        next: () => {
          this.snackBar.open(this.translate.instant('libraries.reload_success'), this.translate.instant('close'), { duration: 3000 });
          this.forceRefresh(); // Refresh data
        },
        error: () => {
          this.snackBar.open(this.translate.instant('libraries.reload_error'), this.translate.instant('close'), { duration: 5000, panelClass: ['mat-warn'] });
        }
      });
    }
  }

  onLibraryActivationChange(event: MatSlideToggleChange, library: Library): void {
    if (!library._id) {
      console.error('Library ID is missing.');
      this.snackBar.open(this.translate.instant('errors.common.error_saving'), this.translate.instant('close'), { duration: 5000, panelClass: ['mat-warn'] });
      return;
    }
    library.isPendingAction = true;
    this.cdr.markForCheck();

    this.librariesService.updateLibraryStatus(library._id, event.checked).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open(
            response.message || this.translate.instant('libraries.activation_update_success'),
            this.translate.instant('close'),
            { duration: 3000 }
          );
          this.forceRefresh(); 
        } else {
          event.source.checked = !event.checked; // Revert checkbox on failure
          this.snackBar.open(response.message || this.translate.instant('errors.common.error_saving'), this.translate.instant('close'), { duration: 5000, panelClass: ['mat-warn']});
          this.forceRefresh(); // Ricarica comunque per rimuovere lo stato 'pending'
        }
      },
      error: (err: any) => {
        console.error('Error updating library status', err);
        event.source.checked = !event.checked; // Revert checkbox on error
        this.forceRefresh(); // Ricarica per rimuovere lo stato 'pending'
        this.snackBar.open(this.translate.instant('errors.common.error_saving'), this.translate.instant('close'), { duration: 5000, panelClass: ['mat-warn'] });
      }
    });
  }

  showLibraryForm(): void {
    this.library.domtype = this.selectedLibraryType === 'CSS' ? 'link' : 'script';
  }

  onFileSelect(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.classList.add('file-over');
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('file-over');
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('file-over');

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
      this.cdr.markForCheck();
    }
  }

  addLibrary(): void {
    if (!this.formNewLibrary?.valid || !this.fileUpload) {
      this.snackBar.open(this.translate.instant('errors.common.fill_required_fields'), this.translate.instant('close'), { duration: 5000, panelClass: ['mat-warn'] });
      return;
    }

    this.library.type = this.selectedLibraryType as 'Javascript' | 'CSS';

    this.librariesService.addLibrary(this.library as Library, this.fileUpload).subscribe({
      next: () => {
        this.snackBar.open(this.translate.instant('libraries.add_success'), this.translate.instant('close'), { duration: 3000 });
        this.cancelAddLibrary();
        this.forceRefresh();
      },
      error: (err: any) => {
        console.error('Error adding library', err);
        this.snackBar.open(this.translate.instant('errors.common.error_saving'), this.translate.instant('close'), { duration: 5000, panelClass: ['mat-warn'] });
      }
    });
  }

  cancelAddLibrary(): void {
    this.showNewLibrary = false;
    this.library = { useonload: true };
    this.selectedLibraryType = '';
    this.fileUpload = null;
    this.nameFocused = false;
  }

  private handleFile(file: File): void {
    this.fileUpload = file;
    this.library.filename = this.fileUpload.name;
  }

  getRowClass = (rowData: any, rowIndex: number) => {
    if (rowData.isPendingAction) {
      return 'pending-action-row';
    }
    return '';
  };

  // Funzione trackBy per ottimizzare il rendering della tabella
  trackByLibraryId(index: number, item: Library): string {
    return item._id ?? `new-item-${index}`;
  }
}
