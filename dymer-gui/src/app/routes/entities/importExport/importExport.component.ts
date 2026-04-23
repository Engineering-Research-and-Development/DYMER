import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, JsonPipe, NgFor } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MtxSelectModule } from '@ng-matero/extensions/select';
import { AllStatsGlobalResponse, ImportExportService, IndexMappingResponse } from './importExport.service';
import * as Papa from 'papaparse';
// import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

interface FieldMapping {
  isSelected: boolean;
  originalName: string;
  newName: string;
  isArrayField: boolean;
  isNew?: boolean;
}

interface RelationMapping {
  enabled: boolean;
  relationTo: string | null;
  searchingField: string | null;
  relationData?: any[];
}

interface InfoDetails {
  index: string;
  separator: string;
  fields: FieldMapping[];
  relationsList: RelationMapping[];
}

@Component({
  selector: 'app-import-export',
  templateUrl: './importExport.component.html',
  styleUrls: ['./importExport.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MtxSelectModule,
    JsonPipe,
    NgFor,
    TranslateModule,
  ],
})
export class ImportExportComponent implements OnInit {

  // Proprietà per la sezione "Import from REST"
  showMappingBridgeRule: boolean = false;
  method: string = 'GET';
  mapping: string = JSON.stringify(
    { ID: '__id', TYPE: '__type', _index: '_index', _source: '_source' },
    null,
    '\t'
  );
  import_result: any;
  activeTab = 'export';

  // Proprietà per la sezione "Import from CSV"
  importFromCSV: boolean = false;
  showResultWizard: boolean = false;
  currentStep: number = 1;
  customSeparator: boolean = false;

  // Dati del wizard
  infoDetails: InfoDetails = {
    index: '',
    separator: '',
    fields: [],
    relationsList: [{ enabled: false, relationTo: '', searchingField: '' }]
  };

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  listEntities: string[] = [];
  CSVData: any[] = [];
  CSVFields: string[] = [];
  MappedData: any[] = [];
  metadata: any;
  selectedFile: File | null = null;
  selectedFileName: string | null = null;
  errors: any[] = [];
  isDragOver: boolean = false;

  // Proprietà per la sezione "Export"
  selectedEntity: string | null = null;
  myDropdownOptions: any[] = [];
  myDropdownModel: any[] = [];

  constructor(
    private importExportService: ImportExportService,
    private cdr: ChangeDetectorRef,
    // private snackBar: MatSnackBar,
    private readonly toast: ToastrService,
    private translate: TranslateService // <--- aggiungi qui
  ) { }

  ngOnInit(): void {
    this.importExportService.getAllStatsGlobal().subscribe({
      next: (retE: AllStatsGlobalResponse) => {
        this.listEntities = retE.data.indices
          .map((e: { index: string; }) => e.index)
          .filter((index: string) => index !== 'entity_relation');
        this.cdr.markForCheck();
      },
      error: (e: any) => {
        console.error('error: ', e);
        this.toast.error(e.message)
      },
    });
  }

  // Metodi per "Import from REST"
  importEntFl(host: string, port: string, path: string): void {
    if (!host || !port || !path || host.startsWith('data:image')) {
      console.error('Host, port e path sono obbligatori per l\'import REST.');
      this.import_result = { error: 'Host, port e path sono obbligatori.' };
      this.cdr.markForCheck();
      return;
    }
    let mappingObject: any;
    try {
      mappingObject = JSON.parse(this.mapping);
    } catch (e) {
      console.error('Error parsing mapping JSON:', e);
      this.import_result = { error: 'Invalid mapping JSON' };
      this.toast.error('Invalid mapping JSON')
      return;
    }
    let fullUrl = host.startsWith('http') ? host : `http://${host}`;
    fullUrl += port ? `:${port}` : '';
    fullUrl += path.startsWith('/') ? path : `/${path}`;

    this.importExportService.importFromREST(fullUrl, this.method as 'GET' | 'POST', mappingObject).subscribe({
      next: (ret: any) => {
        if (ret && ret.error) {
          this.import_result = { error: this.translate.instant('importexport.service_unreachable'), details: ret };
          // this.snackBar.open(this.translate.instant('importexport.service_unreachable'), 'Chiudi', { duration: 4000, panelClass: ['mat-warn'] });
          this.toast.error(this.translate.instant('importexport.service_unreachable'))
        } else {
          this.import_result = ret;
        }
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        let errorMsg = 'Errore generico durante l\'import.';
        if (err && err.status === 0) {
          errorMsg = 'Servizio non raggiungibile';
        } else if (err && err.status >= 400) {
          errorMsg = `Errore HTTP ${err.status}: ${err.statusText || ''}`;
        } else if (typeof err === 'string' && err.includes('Invalid URL')) {
          errorMsg = 'URL non valido.';
        }
        this.import_result = { error: errorMsg, details: err };
        // this.snackBar.open(errorMsg, 'Chiudi', { duration: 4000, panelClass: ['mat-warn'] });
        this.toast.error(errorMsg)
        this.cdr.markForCheck();
      }
    });
  }

  // Metodi per il wizard "Import from CSV"
  getIndexStructure(): void {
    if (!this.infoDetails.index) {
      return;
    }

    const index = this.infoDetails.index;

    this.importExportService.getIndexStructure(index).subscribe({
      next: (ret: IndexMappingResponse) => {
        const properties = ret.data[index]?.mappings?.properties;
        if (!properties) {
          console.error('No properties found for index:', index);
          this.infoDetails.fields = [];
          this.toast.error(`No properties found for index: ${index}`)
          return;
        }

        const flattenObject = (obj: any, prefix = ''): string[] => {
          return Object.keys(obj).reduce((acc: string[], k: string) => {
            const pre = prefix.length ? prefix + '.' : '';
            if (obj[k] && typeof obj[k] === 'object' && 'properties' in obj[k]) {
              acc.push(...flattenObject(obj[k].properties, pre + k));
            } else {
              acc.push(pre + k);
            }
            return acc;
          }, []);
        };

        const structure = flattenObject(properties);
        this.infoDetails.fields = structure.map(field => ({
          originalName: field,
          newName: '',
          isNew: false,
          isSelected: false,
          isArrayField: false,
        }));
      },
      error: (e: any) => {
        console.error('Unable to retrieve index fields due to: ', e)
        this.toast.error("Unable to retrieve index fields")
      }
    });
  }

  nextStep(): void {
    if (this.currentStep < 5) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      this.handleFile(element.files[0]);
    } else {
      this.selectedFile = null;
      this.selectedFileName = null;
    }
    this.cdr.markForCheck();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  handleFile(file: File): void {
    this.selectedFile = file;
    this.selectedFileName = this.selectedFile.name;
    this.cdr.markForCheck();
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFieldByCSV(): void {
    if (!this.selectedFile) {
      console.error('CSV Import: Please, select a file');
      this.toast.error('CSV Import: Please, select a file')
      return;
    }

    Papa.parse(this.selectedFile, {
      header: true,
      delimiter: this.infoDetails.separator || '',
      complete: (result: Papa.ParseResult<any>) => {
        this.metadata = {
          delimiter: result.meta.delimiter,
          linebreak: result.meta.linebreak,
          truncated: result.meta.truncated,
          cursor: result.meta.cursor,
        };

        this.CSVFields = result.meta.fields ?? [];
        this.CSVData = result.data;
        this.errors = result.errors;

        this.cdr.markForCheck();
      },
      error: (error: any) => {
        console.error('Error parsing CSV:', error);
        this.toast.error('Error parsing CSV')
      }
    });
  }

  addHeader(): void {
    this.infoDetails.fields.unshift({
      isSelected: true,
      originalName: '',
      newName: '',
      isArrayField: false,
      isNew: true
    });
  }

  removeHeader(index: number): void {
    this.infoDetails.fields.splice(index, 1);
  }

  addRelation(): void {
    this.infoDetails.relationsList.push({
      enabled: false,
      relationTo: '',
      searchingField: ''
    });
  }

  removeRelation(index: number): void {
    this.infoDetails.relationsList.splice(index, 1);
  }

  generateMappedData(): void {
    // Filtra i campi selezionati e li riordina: prima i campi esistenti, poi quelli nuovi.
    // Questo assicura che le nuove colonne appaiano alla fine nell'anteprima dello step 5.
    const selectedFields = this.infoDetails.fields
      .filter(f => f.isSelected && f.newName)
      .sort((a, b) => {
        return (a.isNew ? 1 : 0) - (b.isNew ? 1 : 0);
      });

    // Mappa i dati CSV nella nuova struttura
    this.MappedData = this.CSVData.map(row => {
      const newRow: { [key: string]: any } = {};
      selectedFields.forEach(field => {
        // Se il campo è un nuovo campo, usa il suo nome originale. Altrimenti, usa il nome mappato.
        const targetFieldName = field.isNew ? field.originalName : field.originalName;
        if (row.hasOwnProperty(field.newName)) {
          newRow[targetFieldName] = row[field.newName];
        }
      });
      return newRow;
    });

    const enabledRelations = this.infoDetails.relationsList.filter(r => r.enabled);

    this.nextStep();
  }

  importMappedData(): void {
    // Filtra solo i campi che sono array
    const arrayFields = this.infoDetails.fields
      .filter(f => f.isSelected && f.isArrayField)
      .map(f => f.originalName);

    let relationsPayload = this.infoDetails.relationsList.filter(r => r.enabled);
    if (relationsPayload.length === 0) {
      relationsPayload = [
        {
          enabled: false,
          searchingField: null,
          relationTo: null,
          relationData: new Array(133).fill(null),
        },
      ];
    }
    // Costruisci l'oggetto da inviare
    const dataToImport = {
      index: this.infoDetails.index,
      data: this.MappedData,
      relations: relationsPayload,
      arrayFields: arrayFields
    };
    // Invia i dati al backend tramite il servizio
    this.importExportService.importFromCsv(dataToImport).subscribe({
      next: (ret: any) => {
        console.log('Import successful', ret);
        this.showResultWizard = true;
        this.toast.success('Import successfully started')
      },
      error: (err: any) => {
        console.error('Import failed', err);
        this.toast.error('Import failed')
      }
    });
  }

  // Metodi per "Export"
  selectOptions(): void {
    if (!this.selectedEntity) {
      return;
    }

    this.importExportService.getStructure(this.selectedEntity).subscribe({
      next: (fields: string[]) => {
        this.myDropdownOptions = fields.map(field => ({ id: field, label: field }));
        this.cdr.markForCheck();
      },
      error: (e: any) => {
        console.error('Error: ', e);
        this.toast.error(e.message)
      },
    });
  }

  ExportJSON(): void {
    if (!this.selectedEntity) {
      console.error('No entity selected for export.');
      this.toast.error('No entity selected for export')
      return;
    }

    this.importExportService.exportJSONFormat(this.selectedEntity).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // a.download = `${this.selectedEntity}.json`;
        a.download = `${this.selectedEntity}_json_export.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      },
      error: (err) => {
        console.error('JSON export failed', err)
        this.toast.error('JSON export failed')
      }
    });
  }

  ExportCSV(): void {
    if (!this.selectedEntity) {
      console.error('No entity selected for export.');
      this.toast.error('No entity selected for export')
      return;
    }

    const allFieldIds = this.myDropdownOptions.map(option => option.id);
    const selectedFieldIds = this.myDropdownModel.map(item => item.id);

    const excludedFields = allFieldIds.filter(id => !selectedFieldIds.includes(id));

    this.importExportService.exportCSVFormat(this.selectedEntity, excludedFields).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // a.download = `${this.selectedEntity}.csv`;
        a.download = `${this.selectedEntity}_csv_export.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      },
      error: (err) => {
        console.error('CSV export failed', err)
        this.toast.error('CSV export failed')
      }
    });
  }

  clearExportForm() {
    this.selectedEntity = null;
    this.myDropdownModel = [];
    // this.snackBar.open(this.translate.instant('importexport.form_cleared'), 'Chiudi', { duration: 3000 });
    this.toast.success(this.translate.instant('importexport.form_cleared'));
  }
}
