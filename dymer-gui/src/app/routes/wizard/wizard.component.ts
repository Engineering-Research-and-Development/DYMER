import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import { BreadcrumbComponent } from '@shared';
import { PageHeaderComponent } from '@shared';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { WizardService } from './wizard.service';
import { MatRadioButton, MatRadioModule } from '@angular/material/radio';
declare function html2json(html: string): any;

(window as any).DEBUG = false;
@Component({
  selector: 'app-wizard',
  templateUrl: './wizard.component.html',
  styleUrl: './wizard.component.scss',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    PageHeaderComponent,
    TranslateModule,
    MatOptionModule,
    MatSelectModule,
    MatCheckboxModule,
    CommonModule,
    MatRadioButton,
    MatRadioModule,
    MatIconModule
  ],
})
export class WizardComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  isLinear = true;
  zeroFormGroup!: FormGroup;
  firstFormGroup!: FormGroup;
  secondFormGroup!: FormGroup;
  thirdFormGroup!: FormGroup;
  @ViewChild('promptInput') promptInputRef!: ElementRef<HTMLInputElement>;
  templates = [
    { value: 'list', label: 'List', image: 'assets/images/wizard/list.png' },
    { value: 'card', label: 'Card', image: 'assets/images/wizard/card.png' },
    { value: 'map', label: 'Map', image: 'assets/images/wizard/map.png' },
  ];
  isDragOver: boolean = false;
  selectedFile: File | null = null;
  selectedFileName: string | null = null;
  constructor(
    private readonly wizardService: WizardService,
    private readonly toast: ToastrService
  ) { }
  ngOnInit() {
    this.zeroFormGroup = this.formBuilder.group({
    });
    this.firstFormGroup = this.formBuilder.group({
      nameCtrl: ['', Validators.required],
      indexCtrl: ['', Validators.required],
      descriptionCtrl: ['', Validators.required]
    });
    this.secondFormGroup = this.formBuilder.group({
      fieldsArray: this.formBuilder.array([this.createFieldGroup()], Validators.minLength(1)),
      selectVocabularyCtrl: this.formBuilder.array([]),
      selectRelationCtrl: this.formBuilder.array([]),
    });
    this.thirdFormGroup = this.formBuilder.group({
      selectTemplateCtrl: ['', Validators.required]
    });
    this._loadAndPopulateVocabularies();
    this._loadRelations();

  }
  clearPromptInput(): void {
    if (this.promptInputRef && this.promptInputRef.nativeElement) {
      this.promptInputRef.nativeElement.value = '';

    }
  }
  get fieldsArray(): FormArray {
    return this.secondFormGroup.get('fieldsArray') as FormArray;
  }
  get fieldsArrayControls(): AbstractControl[] {
    return this.fieldsArray.controls;
  }
  get selectVocabularyFormArray(): FormArray {
    return this.secondFormGroup.get('selectVocabularyCtrl') as FormArray;
  }
  get selectRelationFormArray(): FormArray {
    return this.secondFormGroup.get('selectRelationCtrl') as FormArray;
  }
  public isFieldTypeTaxonomy(fieldControl: AbstractControl): boolean {
    const selectTypeCtrl = fieldControl?.get('selectTypeCtrl');
    return !!selectTypeCtrl && selectTypeCtrl.value === 'taxonomy';
  }
  public isFieldTypeRelation(fieldControl: AbstractControl): boolean {
    const selectTypeCtrl = fieldControl?.get('selectTypeCtrl');
    return !!selectTypeCtrl && selectTypeCtrl.value === 'relation';
  }
  createFieldGroup(): FormGroup {
    return this.formBuilder.group({
      titleCtrl: ['', Validators.required],
      selectTypeCtrl: ['text', Validators.required],
      taxCtrl: ['Select One'],
      requiredCtlr: [false],
      repeatableCtlr: [false],
      searchableCtlr: [false],
      relationtoCtrl: ""
    });
  }
  private _loadAndPopulateVocabularies(): void {
    this.wizardService.getVocabularies().subscribe(
      (vocabulariesResponse: any) => {
        const mappedVocabularies = vocabulariesResponse.data.map((element: { _id: any; title: any; }) => ({
          vocabularyId: element._id,
          vocabularyTitle: element.title
        }));
        const selectVocabularyFormArray = this.secondFormGroup.get('selectVocabularyCtrl') as FormArray;
        selectVocabularyFormArray.clear();
        mappedVocabularies.forEach((vocab: any) => {
          selectVocabularyFormArray.push(this.formBuilder.control(vocab));
        });
      },
      (error: any) => {
        console.error('Error loading vocabularies ===>', error);
        this.toast.error('Error loading vocabularies', 'GET');
      }
    );
  }
  private _loadRelations(): void {
    this.wizardService.getRelations().subscribe(
      (relationsResponse: any) => {
        const mappedRelations = relationsResponse.data.map((element: { _id: any; title: any; }) => ({
          relationalModelId: element._id,
          relationalModelTitle: element.title
        }));
        const selectRelationFormArray = this.secondFormGroup.get('selectRelationCtrl') as FormArray;
        selectRelationFormArray.clear();
        mappedRelations.forEach((vocab: any) => {
          selectRelationFormArray.push(this.formBuilder.control(vocab));
        });
      },
      (error: any) => {
        console.error('Error loading relations ===>', error);
        this.toast.error('Error loading relations', 'GET');
      }
    );
  }
  transformRelationTitle(title: string): string {
    return title.replace(/[^a-zA-Z]/g, "").toLowerCase();
  }
  cloneFormGroup(index: number): void {
    const clonedGroup = this.createFieldGroup();
    this.fieldsArray.insert(index + 1, clonedGroup);
  }
  removeConfig(index: number): void {
    this.fieldsArray.removeAt(index);
  }
  /**
   * @param formData 
   * @param data
   * @param parentKey
   */
  private appendFormData(formData: FormData, data: any, parentKey?: string): void {
    if (data !== null && typeof data === 'object' && !(data instanceof File) && !(data instanceof Blob)) {
      Object.keys(data).forEach(key => {
        const value = data[key];
        const propName = parentKey ? `${parentKey}[${key}]` : key;
        if (value !== null && typeof value === 'object' && !(value instanceof File) && !(value instanceof Blob)) {
          this.appendFormData(formData, value, propName);
        } else {
          if (value !== undefined && value !== null) {
            formData.append(propName, value);
          } else if (value === null) {
            formData.append(propName, '');
          }
        }
      });
    } else if (parentKey) {
      if (data !== undefined && data !== null) {
        formData.append(parentKey, data);
      } else if (data === null) {
        formData.append(parentKey, '');
      }
    }
  }
  csvError: string | null = null;
  parseCsv(csvData: string): any[] {
    const rows = csvData.split('\n');
    const headers = rows[0].split(',');
    return rows.slice(1).map((row) => {
      const values = row.split(',');
      const result: any = {};
      headers.forEach((header, index) => {
        result[header.trim()] = values[index]?.trim();
      });
      return result;
    });
  }
  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  onCsvFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (!file.name.endsWith('.csv')) {
        this.csvError = 'Invalid file type. Please upload a CSV file.';
        return;
      }
      this.csvError = null;
      const reader = new FileReader();
      reader.onload = () => {
        const csvData = reader.result as string;
        try {
          const parsedData = this.parseCsv(csvData);
          this.processCsvData(parsedData);
        } catch (error) {
          console.error('Error parsing CSV:', error);
          this.csvError = 'Error parsing CSV file.';
        }
      };
      reader.readAsText(file);
    }
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

  }
  removeEmptyFields(): void {
    const fieldsArray = this.fieldsArray;
    for (let i = fieldsArray.length - 1; i >= 0; i--) {
      const fieldGroup = fieldsArray.at(i) as FormGroup;
      const titleValue = fieldGroup.get('titleCtrl')?.value;
      if (!titleValue || titleValue.trim() === '') {
        fieldsArray.removeAt(i);
      }
    }
  }
  processCsvData(data: any[]): void {
    data.forEach((row) => {
      const fieldGroup = this.createFieldGroup();
      fieldGroup.patchValue({
        titleCtrl: row['Title'] || '',
        selectTypeCtrl: row['Type'] || 'text',
        taxCtrl: row['Taxonomy'] || '',
        requiredCtlr: row['Required'] === 'true',
        repeatableCtlr: row['Repeatable'] === 'true',
        searchableCtlr: row['Searchable'] === 'true',
        relationtoCtrl: row['Relation'] || '',
      });
      this.fieldsArray.push(fieldGroup);
    });
    this.removeEmptyFields();
  }
  createModelTemplate() {
    let modelName = this.firstFormGroup.value.nameCtrl.replace(/\W+/g, '-').toLowerCase();
    modelName = modelName.replace(/[^A-Za-z0-9\.\/]+/g, '-').toLowerCase();
    let modelIndex = this.firstFormGroup.value.indexCtrl.replace(/[^a-zA-Z]/g, "").toLowerCase();
    /*Acquisico l'html del modello*/
    this.wizardService.getModelHtml().subscribe((modelHtml: any) => {
      let modelTemplate = modelHtml.replaceAll("{{titolo}}", this.firstFormGroup.value.nameCtrl);
      modelTemplate = modelTemplate.replaceAll("{{instance}}", modelIndex);
      let newFields = "";
      let title = "";
      let repeatable = "";
      let required = "";
      let searchable = "";
      let taxonomy = false;
      let relation = false;
      this.secondFormGroup.value.fieldsArray.forEach((field: any) => {
        title = field.titleCtrl.replace(/\W+/g, '-').toLowerCase();
        title = title.replace(/[^A-Za-z0-9\.\/]+/g, '-').toLowerCase();
        repeatable = "";
        required = "";
        searchable = "";
        let actionButtons = ""; // AC fix repeteable
        if (field.requiredCtlr) {
          required = "required";
        }
        if (field.repeatableCtlr) {
          repeatable = "repeatable first-repeatable";
          // AC START
          actionButtons = `
      <div class="action-br">
        <span class="btn btn-outline-primary btn-sm" onclick="cloneRepeatable($(this))">+</span>
        <span class="btn btn-outline-danger btn-sm act-remove" onclick="removeRepeatable($(this))">-</span>
      </div>
    `;

          // AC END
        }
        if (field.searchableCtlr) {
          searchable = 'searchable-override="data[' + title + ']" searchable-label="' + title + '" searchable-element="true"'
        }
        if (field.selectTypeCtrl == "string" || field.selectTypeCtrl == "text") {
          newFields += '<div class="form-group ' + repeatable + '">\n<label class="kms-title-label">' + field.titleCtrl + '</label>\n<input type="text" dymer-model-element="" class="form-control col-12 span12" ' + searchable + ' name="data[' + title + ']" ' + required + '>' + actionButtons + '\n</div>\n';
        }
        if (field.selectTypeCtrl == "date") {
          newFields += '<div class="form-group ' + repeatable + '">\n<label class="kms-title-label">' + field.titleCtrl + ' (min 01-01-1900)</label>\n<input type="date" data-date="" data-date-format="DD MMMM YYYY" min="1900-01-01" dymer-model-element="" class="form-control col-12 span12" ' + searchable + ' name="data[' + title + ']" ' + required + '>' + actionButtons + '\n</div>\n';
        }
        if (field.selectTypeCtrl == "number") {
          newFields += '<div class="form-group ' + repeatable + '">\n<label class="kms-title-label">' + field.titleCtrl + ' (min 1 - max 99)</label>\n<input type="number" min="1" max="99" dymer-model-element="" class="form-control col-12 span12" ' + searchable + ' name="data[' + title + ']" ' + required + '>' + actionButtons + '\n</div>\n';
        }
        if (field.selectTypeCtrl == "image") {
          newFields += '<div class="form-group ' + repeatable + '">\n<label class="kms-title-label">' + field.titleCtrl + ' (.png,.jpg)</label>\n<input type="file" dymer-model-element="" class="form-control col-12 span12" ' + searchable + ' accept=".png,.jpg" name="data[' + title + ']" ' + required + '>' + actionButtons + '\n</div>\n';
        }
        if (field.selectTypeCtrl == "file") {
          newFields += '<div class="form-group ' + repeatable + '">\n<label class="kms-title-label">' + field.titleCtrl + ' (.doc,.pdf,.xml,.csv,.txt,.ppt)</label>\n<input type="file" dymer-model-element="" class="form-control col-12 span12" ' + searchable + ' accept=".doc,.pdf,.xml,.csv,.txt,.ppt" name="data[' + title + ']" ' + required + '>' + actionButtons + '\n</div>\n';
        }
        if (field.selectTypeCtrl == "textarea") {
          newFields += '<div class="form-group ' + repeatable + '">\n<label class="kms-title-label">' + field.titleCtrl + '</label>\n<textarea type="textarea" dymer-model-element="" class="form-control  col-12 span12" ' + searchable + ' name="data[' + title + ']" ' + required + '></textarea>' + actionButtons + '\n</div>\n';
        }
        if (field.selectTypeCtrl == "selectlist") {
          newFields += '<div class="form-group ' + repeatable + '">\n<label class="kms-title-label">' + field.titleCtrl + '</label>\n<select class="form-control" dymer-model-element="" ' + searchable + ' name="data[' + title + ']" ' + required + '></select>' + actionButtons + '\n</div>\n';
        }
        if (field.selectTypeCtrl == "email") {
          newFields += '<div class="form-group ' + repeatable + '">\n<label class="kms-title-label">' + field.titleCtrl + '</label>\n<input type="email" dymer-model-element="" class="form-control col-12 span12" ' + searchable + ' name="data[' + title + ']" ' + required + '>' + actionButtons + '\n</div>\n';
        }
        if (field.selectTypeCtrl == "taxonomy") {
          searchable = 'searchable-label="' + field.titleCtrl + '" searchable-text="' + field.titleCtrl + '" searchable-element="true" searchable-multiple="true"';
          repeatable = 'multiple="multiple"';
          newFields += '<div class="form-group collectionField" style="min-height: 100px;">\n<label for="description" class="kms-title-label">Taxonomy ' + field.titleCtrl + '</label>\n<small class="form-text text-muted"><b></b> </small><div><div data-component-kmstaxonomy=""  ' + searchable + ' ' + repeatable + ' ' + required + ' class="form-group dymertaxonomy" data-totaxonomy="' + field.taxCtrl + ' " data-max-options="10" style="height:3px" searchable-element="true">\n</div>\n</div>\n</div>\n';
          taxonomy = true;
        }
        if (field.selectTypeCtrl == "relation") {
          searchable = 'searchable-label="' + field.titleCtrl + '" searchable-text="' + field.titleCtrl + '" searchable-element="true" searchable-multiple="true"';
          repeatable = 'multiple="multiple"';
          newFields += '<div class="form-group">\n<label for="description" class="kms-title-label">Relation</label>\n<div><div data-component-dymrelation="" class="form-group dymerselectpicker" data-torelation="' + field.relationtoCtrl + '"  ' + searchable + ' ' + repeatable + ' ' + required + '  data-actions-box="true" data-max-options=""><span class="inforelation">Relation</span>\n <i class="fa fa-code-fork rotandflip inforelation" aria-hidden="true"></i> <span contenteditable="false" class="torelation inforelation">' + field.relationtoCtrl + '</span>\n</div>\n</div>\n</div>\n ';
          relation = true;
        }
        if (field.selectTypeCtrl == "geo") {
          newFields += '<div class="geopointcontgrp form-group field-description ">\n<label for="description" class="kms-title-label">Geo Point ' + field.titleCtrl + '</label>\n<div>  <div data-component-geopoint class="form-group  ">\n<input type="hidden" dymer-model-element="" class= "form-control" name="data[location][type]" value="Point">\n<label class="kms-title-label">Longitude</label>\n<input type="number" dymer-model-element="" class="form-control" name="data[location][coordinates][0]" ' + required + '>\n<label class="kms-title-label">Latitudine</label>\n<input type="number" dymer-model-element="" class="form-control" name="data[location][coordinates][1]" ' + required + '>\n</div>\n</div>\n</div>';
        }
      });
      modelTemplate = modelTemplate.replaceAll("{{newFields}}", newFields);
      /*Creo il modello con il template aggiornato*/
      let modelData: any = {
        title: this.firstFormGroup.value.nameCtrl,
        description: this.firstFormGroup.value.descriptionCtrl,
        name: modelName,
        author: "Dymer Administrator",
        instance: [{
          "_index": modelIndex
        }],
        file: {
          originalname: modelName + ".html",
          src: modelTemplate,
          ctype: "text/html"
        },
        posturl: "",
      };
      let createModelData = new FormData();
      delete modelData.file;
      this.appendFormData(createModelData, { "data": modelData });
      createModelData.append('data[file]', new File([new Blob([modelTemplate])], modelName + ".html", { type: "text/html" }));
      this.wizardService.createModel(createModelData).subscribe((createModelRet: any) => {
        this.toast.success('Model successfully generated', 'CREATE');
        /*Acquisico i campi dymer-model-element e aggiorno la struttura del modello*/
        let modelId = createModelRet.data[0]._id;
        let htmlId = createModelRet.data[0].files[0]._id;
        let html = "";
        const tempElement = document.createElement('div');
        tempElement.innerHTML = modelTemplate;
        const dymerElements = tempElement.querySelectorAll('[dymer-model-element]');
        dymerElements.forEach(element => {
          html += element.outerHTML;
        });
        let structure = JSON.stringify(html2json(html));
        let updateModelStructure = new FormData();
        updateModelStructure.append('data[pageId]', modelId);
        updateModelStructure.append('data[structure]', structure);
        this.wizardService.updateModelStructure(updateModelStructure).subscribe((updateModelStructureRet: any) => {
          this.toast.success('Model Structure successfully updated', 'UPDATE');
          /*Eseguo l'update asset del modello*/
          let updateModelAsset = new FormData();
          updateModelAsset.append('data[file]', new File([new Blob([modelTemplate])], modelName + ".html", { type: "text/html" }));
          updateModelAsset.append('data[pageId]', modelId);
          updateModelAsset.append('data[assetId]', htmlId);
          this.wizardService.updateModelAsset(updateModelAsset).subscribe((updateModelAssetRet: any) => {
            this.toast.success('Model Asset successfully updated', 'UPDATE');
            /*Acquisico il modello creato e aggiorno l'html del template Full Content con i campi dymer-model-element*/
            this.wizardService.getModelDetail(modelIndex).subscribe((fullContentTemplateHtmlRet: any) => {
              let dtReturnHTML = fullContentTemplateHtmlRet.data;
              if (taxonomy) {
                dtReturnHTML += '<div class="card card-primary">\n<div class="card-header"></div>\n<div class="card-body"> \n<strong><i class="fas fa-pencil-alt mr-1"></i>Vocabularies</strong>\n <p class="text-muted"> {{#each taxonomy }} \n<span class="tag tag-success"> {{this}}  </span> \n    {{/each }}\n    </p> \n   </div> \n     </div> \n';
              }
              if (relation) {
                dtReturnHTML += '<div class="card card-primary">\n<div class="card-header"></div>\n<div class="card-body"> \n<strong><i class="fas fa-pencil-alt mr-1"></i>Relation</strong>\n <p class="text-muted"> {{#each relations }} \n<span class="tag tag-success"> {{title}}  </span> \n    {{/each }}\n    </p> \n   </div> \n     </div> \n';
              }
              /*Eseguo la creazione del template Full Content*/
              let fullContentTemplateData: any = {
                title: this.firstFormGroup.value.nameCtrl + '_templateFull',
                description: this.firstFormGroup.value.descriptionCtrl,
                name: modelName + '_templateFull',
                author: "Dymer Administrator",
                instance: [{
                  "_index": modelIndex
                }],
                file: {
                  originalname: modelName + "_fullTemplate.html",
                  src: dtReturnHTML,
                  ctype: "text/html"
                },
                posturl: "",
                viewtype: [{ "rendertype": "fullcontent" }]
              };
              let createFullContentTemplateData = new FormData();
              delete fullContentTemplateData.file;
              this.appendFormData(createFullContentTemplateData, { "data": fullContentTemplateData });
              createFullContentTemplateData.append('data[file]', new File([new Blob([dtReturnHTML])], modelName + "_fullTemplate" + ".html", { type: "text/html" }));
              this.wizardService.createTemplate(createFullContentTemplateData).subscribe((createFullContentTemplateRet: any) => {
                this.toast.success('Full Content Template successfully generated', 'CREATE');
                let templateType = "";
                let templateName = "";
                if (this.thirdFormGroup.value.selectTemplateCtrl == "card") {
                  templateType = "teaser";
                  templateName = "Card";
                }
                if (this.thirdFormGroup.value.selectTemplateCtrl == "list") {
                  templateType = "teaserlist";
                  templateName = "List";
                }
                if (this.thirdFormGroup.value.selectTemplateCtrl == "map") {
                  templateType = "teasermap";
                  templateName = "Map";
                }
                /*Acquisico l'html del template selezionato*/
                this.wizardService.getTemplateHtml(templateType).subscribe((templateHtmlRet: any) => {
                  /*Eseguo la creazione del template selezionato*/
                  let templateData: any = {
                    title: this.firstFormGroup.value.nameCtrl + '_template' + templateName,
                    description: this.firstFormGroup.value.descriptionCtrl,
                    name: modelName + '_template' + templateName,
                    author: "Dymer Administrator",
                    instance: [{
                      "_index": modelIndex
                    }],
                    file: {
                      originalname: modelName + '_template' + templateName + '.html',
                      src: templateHtmlRet,
                      ctype: "text/html"
                    },
                    posturl: "",
                    viewtype: [{ "rendertype": templateType }]
                  };
                  let postTemplateData = new FormData();
                  delete templateData.file;
                  this.appendFormData(postTemplateData, { "data": templateData });
                  postTemplateData.append('data[file]', new File([new Blob([templateHtmlRet])], modelName + "_template" + templateName + ".html", { type: "text/html" }));
                  this.wizardService.createTemplate(postTemplateData).subscribe((postTemplateDataRet: any) => {
                    this.toast.success('Template successfully generated', 'CREATE');
                  },
                    error => {
                      console.error('Error creating template ===>', error);
                      this.toast.error('Error creating template', 'CREATE');
                    }
                  )
                },
                )
              },
                error => {
                  console.error('Error creating full content template ===>', error);
                  this.toast.error('Error creating full content template', 'CREATE');
                }
              )
            }
            );
          },
            error => {
              console.error('Error updating model asset ===>', error);
              this.toast.error('Error updating model asset', 'UPDATE');
            }
          );
        },
          error => {
            console.error('Error updating model structure ===>', error);
            this.toast.error('Error updating model structure', 'UPDATE');
          }
        );
      },
        error => {
          console.error('Error creating model ===>', error);
          this.toast.error('Error creating model', 'CREATE');
        }
      );
    });
  }
}
