import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, Renderer2, inject, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AddEntityService, RawEsEntity } from './addentity.service';
import { Observable, Subject, of, forkJoin, lastValueFrom, tap, Subscription, finalize } from 'rxjs';
import { map, startWith, catchError, takeUntil, debounceTime } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import { SafePipe } from '../../../shared/pipes/safe.pipe';
import { ToastrService } from 'ngx-toastr';
import * as JQuery from 'jquery';

@Component({
  selector: 'app-addentity',
  templateUrl: './addentity.component.html',
  styleUrls: ['./addentity.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatInputModule,
    MatTooltipModule,
    MatListModule,
    TranslateModule,
    
  ],
})
export class AddEntityComponent implements OnInit, OnDestroy, AfterViewChecked, AfterViewInit {
  private addEntityService = inject(AddEntityService);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  private sanitizer = inject(DomSanitizer);
  private toastr = inject(ToastrService);
  private renderer = inject(Renderer2);
  private el = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private destroy$ = new Subject<void>();

  searchControl = new FormControl('');
  allModels: RawEsEntity[] = [];
  filteredModels$!: Observable<RawEsEntity[]>;

  selectedIndex: number | null = null;
  formtitle = '';
  formHtml: SafeHtml | null = null;
  otherFilesToLoad: any[] = [];
  isLoading = false;
  private relationOptionsCache: Map<string, RawEsEntity[]> = new Map();
  private subscriptions = new Subscription();
  private loadedScriptsAndStyles: (HTMLScriptElement | HTMLLinkElement)[] = [];
  private _jq: JQueryStatic;

  constructor() {
    this._jq = JQuery.default;
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.addEntityService
      .getModels()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading models', error);
          this.snackBar.open(this.translate.instant('menu.entities.add.loadError'), this.translate.instant('close'), {
            duration: 5000,
          });
          this.isLoading = false;
          return of({ data: [] });
        })
      )
      .subscribe(response => {
        this.allModels = response.data;
        this.setupFiltering();
        this.isLoading = false;
      });
  }

  ngAfterViewInit(): void {
    (window as any).cloneRepeatable = (htmlElement: HTMLElement) => {
      this.cloneRepeatableLogic(this._jq(htmlElement));
    };
    (window as any).removeRepeatable = (htmlElement: HTMLElement) => {
      this.removeRepeatableLogic(this._jq(htmlElement));
    };
    (window as any).actionPostMultipartForm = (
      type: string,
      el: any,
      datapost: any,
      senderFormSelector: string,
      callback: any,
      callerForm: any,
      useGritter: boolean,
      callbackEstraData: any
    ) => {
      this.actionPostMultipartForm(type, el, datapost, senderFormSelector, callback, callerForm, useGritter, callbackEstraData);
    };
    (window as any).closeDymerModal = (id: string, r?: boolean) => {
      this.closeDymerModal(id, r);
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearDynamicallyLoadedAssets();
    if ((window as any).cloneRepeatable) {
      delete (window as any).cloneRepeatable;
    }
    if ((window as any).removeRepeatable) {
      delete (window as any).removeRepeatable;
    }
    if ((window as any).actionPostMultipartForm) {
      delete (window as any).actionPostMultipartForm;
    }
    if ((window as any).closeDymerModal) {
      delete (window as any).closeDymerModal;
    }
  }

  private clearDynamicallyLoadedAssets(): void {
    this.loadedScriptsAndStyles.forEach(el => {
      if (el.parentNode) {
        this.renderer.removeChild(el.parentNode, el);
      }
    });
    this.loadedScriptsAndStyles = [];
  }

  private loadScriptsAndStyles(): Promise<void> {
    this.clearDynamicallyLoadedAssets();
    const doc = document;

    const scripts = this.otherFilesToLoad.filter(f => f.domtype === 'script');
    const styles = this.otherFilesToLoad.filter(f => f.domtype === 'link');

    styles.forEach(file => {
      const link: HTMLLinkElement = this.renderer.createElement('link');
      this.renderer.setAttribute(link, 'rel', 'stylesheet');
      this.renderer.setAttribute(link, 'type', 'text/css');
      this.renderer.setAttribute(link, 'href', file.filename);
      this.renderer.appendChild(doc.head, link);
      this.loadedScriptsAndStyles.push(link);
    });

    // Sequentially load scripts by creating <script> tags and waiting for them to load.
    // This avoids CORS issues with HttpClient and bypasses Angular's HTTP interceptors,
    // which is desirable for loading external libraries or raw script files.
    return new Promise<void>(resolve => {
      const loadNextScript = (index: number) => {
        if (index >= scripts.length) {
          resolve();
          return;
        }

        const file = scripts[index];
        const scriptEl: HTMLScriptElement = this.renderer.createElement('script');
        this.renderer.setAttribute(scriptEl, 'src', file.filename);

        scriptEl.onload = () => {
          this.loadedScriptsAndStyles.push(scriptEl);
          loadNextScript(index + 1);
        };

        scriptEl.onerror = error => {
          console.error(`Failed to load script: ${file.filename}`, error);
          loadNextScript(index + 1);
        };

        this.renderer.appendChild(doc.body, scriptEl);
      };

      loadNextScript(0);
    });
  }

  ngAfterViewChecked(): void {
    // Logic moved to loadHtmlForm to ensure DOM manipulation happens before rendering.
    // This hook can be kept for other potential future uses or removed if not needed.
  }

  private setupFiltering(): void {
    this.filteredModels$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      map(value => this._filter(value || ''))
    );
  }

  private _filter(value: string): RawEsEntity[] {
    const filterValue = value.toLowerCase();
    return this.allModels.filter(model => model.title?.toLowerCase().includes(filterValue));
  }

  private cloneRepeatableLogic(clickedElement: JQuery<HTMLElement>): void {
    const repeatableGroup = clickedElement.closest('.repeatable');
    if (!repeatableGroup || repeatableGroup.length === 0) {
      console.error('CloneRepeatable: Could not find parent ".repeatable" group.');
      return;
    }
    // Determina il tipo di relazione dal gruppo che si sta clonando
    const isRelation = repeatableGroup.find('input[type="hidden"][name*="[relation]"]').length > 0;
    let identifier: string | null = null;

    if (isRelation) {
      const sourceHiddenInput = repeatableGroup.find('input[type="hidden"][name*="[relation]"]');
      const sourceNameAttr = sourceHiddenInput.attr('name');
      const match = sourceNameAttr?.match(/data\[relation\]\[([^\]]+)\]/);
      identifier = match ? match[1] : null;
      if (!identifier) {
        console.error('CloneRepeatable: Impossibile determinare il tipo di relazione dall\'elemento:', repeatableGroup);
        return;
      }
    } else {
      const firstInput = repeatableGroup.find('input[name], textarea[name], select[name]').first();
      const name = firstInput.attr('name');
      const match = name?.match(/^(data\[[^\]]+\])/);
      identifier = match ? match[0] : null;
    }

    const clone = repeatableGroup.clone(false);

    // Pulisce tutti i campi nel gruppo clonato
    clone.find('input, textarea, select').each((index: number, el: HTMLElement) => {
      const inputEl = this._jq(el);
      if (inputEl.is(':checkbox') || inputEl.is(':radio')) {
        inputEl.prop('checked', false);
      } else if (inputEl.is('select')) {
        if (isRelation) {
          inputEl.prop('selectedIndex', -1);
          inputEl.find('option').removeAttr('selected');
        } else {
          inputEl.prop('selectedIndex', 0);
        }
      } else {
        inputEl.val('');
      }
      inputEl.removeAttr('oldval');
      if (inputEl.attr('type') === 'file') {
        inputEl.removeAttr('onchange');
      }
    });

    if (isRelation) {
      const labelElement = clone.find('label');
      if (labelElement.length) {
        labelElement.text(this.translate.instant('menu.entities.listentities.editModal.newRelationLabel'));
      }
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
            options.forEach((optEntity: RawEsEntity) => {
              const optionElement = document.createElement('option');
              optionElement.value = optEntity._id;
              optionElement.textContent = `${optEntity.title || optEntity._id} `;
              jqSelect.append(optionElement);
            });
            // Imposta il valore dell'input nascosto al valore predefinito della select (il placeholder vuoto)
            hiddenInputForSelect.val(jqSelect.val() as string);
          } else {
            jqSelect.empty();
            const errorOption = document.createElement('option');
            errorOption.textContent = this.translate.instant('menu.entities.listentities.editModal.errorLoadingOptions');
            jqSelect.append(errorOption);
            console.warn(`Opzioni per il tipo di relazione '${relationType}' non trovate nella cache.`);
          }
        }
      });
    }
    clone.find('[fileid][attachref]').remove();
    clone.find('div[id^="contattach_data"]').remove();
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
    
    const parentContainer = repeatableGroup.parent();
    if (identifier) {
      // Re-indicizza il gruppo per garantire che i nomi degli input siano sequenziali
      this.reindexRepeatableGroup(parentContainer, identifier, isRelation);
      
      // Mostra i pulsanti di rimozione per tutti gli elementi di questo tipo se sono più di uno
      const selector = isRelation ? `[name*="[relation][${identifier}]"]` : `[name^="${identifier}"]`;
      parentContainer.find('.repeatable').filter((_i, el) => this._jq(el).find(selector).length > 0).find('.act-remove').show();
    }
  }

  private removeRepeatableLogic(clickedElement: JQuery<HTMLElement>): void {
    const repeatableGroup = clickedElement.closest('.repeatable');
    if (!repeatableGroup || repeatableGroup.length === 0) {
      console.error('RemoveRepeatable: Could not find parent ".repeatable" group.');
      return;
    }
    const parentContainer = repeatableGroup.parent();
    const isRelation = repeatableGroup.find('input[type="hidden"][name*="[relation]"]').length > 0;
    let identifier: string | null = null;

    if (isRelation) {
      const sourceHiddenInput = repeatableGroup.find('input[type="hidden"][name*="[relation]"]');
      const sourceNameAttr = sourceHiddenInput.attr('name');
      const match = sourceNameAttr?.match(/data\[relation\]\[([^\]]+)\]/);
      identifier = match ? match[1] : null;
    } else {
      const firstInput = repeatableGroup.find('input[name], textarea[name], select[name]').first();
      const name = firstInput.attr('name');
      const match = name?.match(/^(data\[[^\]]+\])/);
      identifier = match ? match[0] : null;
    }

    const siblingsOfType = parentContainer.find('.repeatable').filter((_i, el) => {
      const group = this._jq(el);
      const selector = isRelation ? `[name*="[relation][${identifier}]"]` : `[name^="${identifier}"]`;
      return group.find(selector).length > 0;
    });

    // Se è l'unico elemento del suo tipo, non rimuoverlo ma svuota i suoi campi.
    if (siblingsOfType.length <= 1) {
      repeatableGroup.find('input, textarea, select').each((index: number, el: HTMLElement) => {
        const inputEl = this._jq(el);
        if (inputEl.is(':checkbox') || inputEl.is(':radio')) {
          inputEl.prop('checked', false);
        } else {
          inputEl.val('');
          if (inputEl.is('select')) {
            inputEl.prop('selectedIndex', 0);
          }
        }
      });
      this.toastr.info(this.translate.instant('menu.entities.listentities.removeRelationError'));
      return;
    }

    repeatableGroup.remove();
    if (identifier) {
      this.reindexRepeatableGroup(parentContainer, identifier, isRelation);
      
      // Se è rimasto solo un elemento del suo tipo, nascondi il suo pulsante di rimozione
      const selector = isRelation ? `[name*="[relation][${identifier}]"]` : `[name^="${identifier}"]`;
      const remainingOfType = parentContainer.find('.repeatable').filter((_i, el) => this._jq(el).find(selector).length > 0);
      if (remainingOfType.length === 1) {
        remainingOfType.find('.act-remove').hide();
      }
    }
  }

  private reindexRepeatableGroup(container: JQuery<HTMLElement>, identifier: string, isRelation: boolean): void {
    // Re-indicizza i nomi e gli ID degli input all'interno di un container di elementi ripetibili.
    // Questo è fondamentale per l'invio corretto dei dati del form al backend.
    let currentIndex = 0;
    const selector = isRelation ? `[name*="[relation][${identifier}]"]` : `[name^="${identifier}"]`;

    // Itera su tutti i gruppi ripetibili nel container
    container.find('.repeatable').each((_idx: number, groupEl: HTMLElement) => {
      const jqGroup = this._jq(groupEl);
      // Controlla se questo gruppo appartiene al tipo che stiamo re-indicizzando
      if (jqGroup.find(selector).length > 0) {
        jqGroup.find('input[name], textarea[name], select[name]').each((_inputIdx: number, inputEl: HTMLElement) => {
          const jqInput = this._jq(inputEl);
          const oldName = jqInput.attr('name');
          let oldNameMatch;
          if (isRelation) {
            oldNameMatch = oldName?.match(new RegExp(`(data\\[relation\\]\\[${identifier}\\]\\[)(\\d+)(\\].*)`));
          } else {
            oldNameMatch = oldName?.match(new RegExp(`(${this.escapeRegex(identifier)}\\[)(\\d+)(\\].*)`));
          }

          if (oldNameMatch && oldNameMatch.length >= 4) {
            const currentBaseName = oldNameMatch[1];
            const currentSuffix = oldNameMatch[3];
            const newName = `${currentBaseName}${currentIndex}${currentSuffix || ''}`;
            jqInput.attr('name', newName);
            const oldId = jqInput.attr('id');
            if (oldId) {
              const oldIdMatch = oldId.match(/^(.*_)\d+$/);
              if (oldIdMatch) {
                const idBase = oldIdMatch[1];
                const newId = `${idBase}${currentIndex}`;
                jqInput.attr('id', newId);
                jqGroup.find(`label[for="${oldId}"]`).attr('for', newId);
              }
            }
          }
        });
        currentIndex++;
      }
    });
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async loadHtmlForm(model: RawEsEntity, index: number): Promise<void> {
    this.selectedIndex = index;
    this.formtitle = model.title ?? '';
    this.formHtml = null;
    this.otherFilesToLoad = [];
    this.isLoading = true;
    this.relationOptionsCache.clear();

    try {
      let rawHtml: string | null = null;
      const formScripts: any[] = [];
      const formStyles: any[] = [];

      if (model.files && Array.isArray(model.files)) {
        model.files.forEach((element: any) => {
          if (element.contentType === 'text/html') {
            rawHtml = element.data;
          } else {
            const contentType = element.contentType || '';
            const splmime = contentType.split('/');
            let ftype = splmime.length > 1 ? splmime[1] : '';
            const lkpath = `/api/forms/api/v1/form/content/${model._index}/${element._id}`;

            if (contentType === 'application/javascript' || contentType === 'text/javascript') {
              ftype = 'script';
            } else {
              ftype = ftype === 'css' ? 'link' : ftype;
            }

            if (ftype !== 'octet-stream') {
              const fileInfo = {
                domtype: ftype,
                filename: lkpath,
                extrattr: [{ key: 'tftemp', value: 'rt' }],
              };
              if (ftype === 'script') {
                formScripts.push(fileInfo);
              } else if (ftype === 'link') {
                formStyles.push(fileInfo);
              }
            }
          }
        });
      }

      // Prepend jQuery, then add other scripts, then styles
      this.otherFilesToLoad = [
        {
          domtype: 'script',
          filename: 'https://code.jquery.com/jquery-3.6.0.min.js',
          extrattr: [],
        },
        ...formScripts,
        ...formStyles,
      ];

      if (!rawHtml) {
        this.isLoading = false;
        return;
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml, 'text/html');

      doc.querySelectorAll('[data-torelation]').forEach(placeholder => {
        const relationGroup = placeholder.closest('.relationcontgrp.repeatable');
        if (relationGroup) {
          const staticActionBr = relationGroup.querySelector(':scope > .action-br');
          if (staticActionBr) {
            staticActionBr.remove();
          }
        }
      });

      const allPotentialRelationTypes = new Set<string>();

      doc.querySelectorAll('[data-torelation]').forEach(el => {
        const relationIndex = el.getAttribute('data-torelation');
        if (relationIndex) {
          allPotentialRelationTypes.add(relationIndex);
        }
      });

      if (model.relations && Array.isArray(model.relations)) {
        for (const relation of model.relations) {
          if (relation.relation_index) {
            allPotentialRelationTypes.add(relation.relation_index);
          }
        }
      }

      const prefetchPromises: Promise<any>[] = [];
      allPotentialRelationTypes.forEach(type => {
        prefetchPromises.push(
          lastValueFrom(this.addEntityService.getRelationships(type).pipe(
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

      await this.loadScriptsAndStyles();

      doc.querySelectorAll('[data-torelation]').forEach(container => {
        container.innerHTML = '';
      });

      const relationsToRender: Partial<RawEsEntity>[] = [];
      allPotentialRelationTypes.forEach(type => {
        if (type) {
          relationsToRender.push({ _index: type, _id: '', title: '' });
        }
      });

      relationsToRender.sort((a, b) => (a._index || '').localeCompare(b._index || ''));

      if (relationsToRender.length > 0) {
        const relationTypeCounts: { [key: string]: number } = {};
        const firstRepeatableAddedForType = new Set<string>();

        const relationProcessingPromises = relationsToRender.map(async (relation, index) => {
          const relationType = relation._index;
          if (!relationType) {
            return null;
          }
          const specificRelationsContainer = doc.querySelector(`[data-torelation="${relationType}"]`);
          if (!specificRelationsContainer) {
            return null;
          }
          const relationIndex = relationTypeCounts[relationType] || 0;
          relationTypeCounts[relationType] = relationIndex + 1;

          const clonedRelationElement = doc.createElement('div');
          clonedRelationElement.setAttribute('data-torelation-generated-item', relation._index || `relation-${index}`);
          clonedRelationElement.classList.add('repeatable', 'form-group');

          if (!firstRepeatableAddedForType.has(relationType)) {
            clonedRelationElement.classList.add('first-repeatable');
            firstRepeatableAddedForType.add(relationType);
          }

          const labelElement = doc.createElement('label');
          const selectElement = doc.createElement('select');
          const hiddenInput = doc.createElement('input');
          hiddenInput.type = 'hidden';
          hiddenInput.name = `data[relation][${relationType}][${relationIndex}][to]`;
          hiddenInput.value = '';

          labelElement.textContent = this.translate.instant('menu.entities.listentities.editModal.newRelationLabel');

          selectElement.id = `relation_select_${relationType}_${relationIndex}`;
          labelElement.setAttribute('for', selectElement.id);

          const options = this.relationOptionsCache.get(relationType) || [];
          const placeholderOption = doc.createElement('option');
          placeholderOption.value = '';
          placeholderOption.textContent = `--- ${this.translate.instant('menu.entities.listentities.editModal.selectRelationPlaceholder')} ---`;
          selectElement.appendChild(placeholderOption);

          options.forEach((optEntity: RawEsEntity) => {
            const optionElement = doc.createElement('option') as HTMLOptionElement;
            optionElement.value = optEntity._id;
            optionElement.textContent = `${optEntity.title || optEntity._id} `;
            selectElement.appendChild(optionElement);
          });

          const actionBrDiv = doc.createElement('div');
          actionBrDiv.classList.add('action-br');
          const cloneButton = doc.createElement('span');
          cloneButton.classList.add('btn', 'btn-outline-primary', 'btn-sm');
          cloneButton.textContent = ' +';
          cloneButton.setAttribute('onclick', 'cloneRepeatable(this)');
          const removeButton = doc.createElement('span');
          removeButton.classList.add('btn', 'btn-outline-danger', 'btn-sm', 'act-remove');
          removeButton.textContent = '-';
          removeButton.setAttribute('onclick', 'removeRepeatable(this)');

          removeButton.style.display = 'none';

          actionBrDiv.appendChild(cloneButton);
          actionBrDiv.appendChild(removeButton);

          clonedRelationElement.appendChild(labelElement);
          clonedRelationElement.appendChild(selectElement);
          clonedRelationElement.appendChild(hiddenInput);
          clonedRelationElement.appendChild(actionBrDiv);

          specificRelationsContainer.appendChild(clonedRelationElement);

          return null;
        })

        await Promise.all(relationProcessingPromises);
      }

      doc.querySelectorAll('[onclick*="cloneRepeatable("], [onclick*="removeRepeatable("]').forEach(button => {
        const onclickAttr = button.getAttribute('onclick');
        if (onclickAttr) {
          button.setAttribute('onclick', onclickAttr.replace(/\$\(this\)/g, 'this'));
        }
      });

      // Sostituisce le select multiple con gruppi di checkbox
      doc.querySelectorAll('select[multiple]').forEach((selectElAsElement: Element, selectIndex: number) => {
        const selectEl = selectElAsElement as HTMLSelectElement;
        const options: { value: string; label: string }[] = [];
        selectEl.querySelectorAll('option').forEach(opt => {
          if (opt.value) {
            options.push({ value: opt.value, label: opt.textContent || opt.value });
          }
        });

        const checkboxContainer = doc.createElement('div');
        checkboxContainer.classList.add('checkbox-group-container');

        options.forEach((opt, optIndex) => {
          const checkboxId = `cb-add-${selectIndex}-${optIndex}`;
          const checkboxWrapper = doc.createElement('div');
          checkboxWrapper.classList.add('mat-checkbox-wrapper');

          const checkbox = doc.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.id = checkboxId;
          checkbox.value = opt.value;
          checkbox.setAttribute('data-original-select-name', selectEl.name);

          const label = doc.createElement('label');
          label.setAttribute('for', checkboxId);
          label.textContent = opt.label;

          checkboxWrapper.appendChild(checkbox);
          checkboxWrapper.appendChild(label);
          checkboxContainer.appendChild(checkboxWrapper);
        });

        selectEl.style.display = 'none'; // Nasconde la select originale
        selectEl.parentElement?.insertBefore(checkboxContainer, selectEl.nextSibling);
      });

      this.formHtml = this.sanitizer.bypassSecurityTrustHtml(doc.body.innerHTML);
      this.isLoading = false;
      this.cdr.detectChanges();

      setTimeout(() => {
        const formContainer = this._jq('#cont-RenderForm');
        if (formContainer.length) {
          formContainer.off('change.relationSelect');
          formContainer.on('change.relationSelect', 'select', (event) => {
            const currentJqSelect = this._jq(event.currentTarget);
            const hiddenInput = currentJqSelect.siblings('input[type="hidden"][name*="[relation]"]');
            if (hiddenInput.length) {
              const selectedValue = currentJqSelect.val() as string;
              hiddenInput.val(selectedValue);
              const label = currentJqSelect.siblings('label');
              if (label.length) {
                if (selectedValue) {
                  const selectedOptionText = currentJqSelect.find('option:selected').text().trim();
                  label.text(this.translate.instant('menu.entities.listentities.editModal.existingRelationLabel', { relationTitle: selectedOptionText }));
                } else {
                  label.text(this.translate.instant('menu.entities.listentities.editModal.newRelationLabel'));
                }
              }
            }
          });
        }
      }, 0);
    } catch (error) {
      this.isLoading = false;
      console.error('An unexpected error occurred in loadHtmlForm', error);
    }
  }

  public closeDymerModal(id: string, r?: boolean): void {
    if (this.formHtml) {
      const confirmed = r === undefined ? confirm(this.translate.instant('menu.entities.add.confirmClose')) : r;
      if (confirmed) {
        this.formHtml = null;
        this.selectedIndex = null;
        this.formtitle = '';
        this.searchControl.setValue('');
        this.clearDynamicallyLoadedAssets();
        this.cdr.detectChanges();
      }
    }
  }

  private checkDymerValidForm(formElement: HTMLFormElement): boolean {
    this._jq(formElement).find('.is-invalid').removeClass('is-invalid');
    let customIsValid = true;
    let firstInvalidElement: HTMLElement | null = null;

    // 1. Custom validation for dymer-element-validation
    this._jq(formElement).find('[dymer-element-validation]').each((_index, el) => {
      const jqEl = this._jq(el);
      const validationFnName = jqEl.attr('dymer-element-validation');
      if (validationFnName && typeof (window as any)[validationFnName] === 'function') {
        const isElValid = (window as any)[validationFnName](jqEl);
        if (!isElValid) {
          jqEl.addClass('is-invalid');
          customIsValid = false;
          if (!firstInvalidElement) {
            firstInvalidElement = el;
          }
        }
      }
    });

    // 2. Standard HTML5 validation
    const nativeIsValid = formElement.checkValidity();

    formElement.classList.add('was-validated');

    const isFormValid = customIsValid && nativeIsValid;

    if (!isFormValid) {
      if (firstInvalidElement) {
        (firstInvalidElement as HTMLElement).focus();
      } else {
        const firstNativeInvalidEl = this._jq(formElement).find(':invalid').first().get(0);
        if (firstNativeInvalidEl) {
          (firstNativeInvalidEl as HTMLElement).focus();
        }
      }
    }
    return isFormValid;
  }

  public actionPostMultipartForm(
    type: string,
    el: any,
    datapost: any,
    senderFormSelector: string,
    callback: any,
    callerForm: any,
    useGritter: boolean,
    callbackEstraData: any
  ): void {
    const typeEnt = type.split('/');
    const modelIndex = typeEnt.length > 1 ? typeEnt[1] : typeEnt[0];

    if (!modelIndex) {
      this.toastr.error('Entity type (model index) is missing.');
      return;
    }

    let formSelector = senderFormSelector;
    if (!formSelector && el) {
      const jqEl = this._jq(el);
      const senderForm = jqEl.closest('.senderForm');
      if (senderForm.length > 0) {
        let formId = senderForm.attr('id');
        if (!formId) {
          formId = `kmstemp_${new Date().getTime()}`;
          senderForm.attr('id', formId);
        }
        formSelector = `#${formId}`;
      }
    }

    const formElement = document.querySelector(formSelector) as HTMLFormElement;
    if (!formElement) {
      this.toastr.error(this.translate.instant('menu.entities.listentities.editModal.formNotFound', { selector: formSelector }));
      console.error(`Form with selector "${formSelector}" not found.`);
      return;
    }

    // Validate the form before proceeding
    if (!this.checkDymerValidForm(formElement)) {
      this.toastr.error(this.translate.instant('menu.entities.add.validationError'));
      return;
    }

    const formData = new FormData();

    if (datapost) {
      if (typeof datapost === 'string') {
        try {
          datapost = JSON.parse(datapost);
        } catch (e) {
          console.error('Error parsing datapost JSON', e);
          this.toastr.error('Invalid data format for datapost.');
          return;
        }
      }
      const appendData = (prefix: string, data: any) => {
        if (data === null || data === undefined) return;
        if (typeof data === 'object' && !(data instanceof File) && !(data instanceof Blob)) {
          Object.keys(data).forEach(key => {
            appendData(prefix ? `${prefix}[${key}]` : key, data[key]);
          });
        } else {
          formData.append(prefix, data);
        }
      };
      appendData('', datapost);
    }

    // Usa formData.set() per 'instance[index]' per garantire che sia unico e non un array.
    // Questo risolve l'errore del backend "Invalid index: expected a string".
    formData.set('instance[index]', modelIndex);

    // Aggiorna le select multiple nascoste in base alle checkbox selezionate
    const checkboxGroups: { [key: string]: string[] } = {};
    this._jq(formElement).find('input[type="checkbox"][data-original-select-name]:checked').each((_, el) => {
      const checkbox = this._jq(el);
      const originalName = checkbox.attr('data-original-select-name');
      const value = checkbox.val() as string;
      if (originalName) {
        if (!checkboxGroups[originalName]) checkboxGroups[originalName] = [];
        checkboxGroups[originalName].push(value);
      }
    });
    Object.keys(checkboxGroups).forEach(name => {
      this._jq(formElement).find(`select[name="${name}"]`).val(checkboxGroups[name]);
    });

    // Process all standard inputs, textareas, and single-selects
    this._jq(formElement).find('input:not([type="file"]), textarea, select:not([multiple])').each((_index, el) => {
      const input = this._jq(el);
      const name = input.attr('name');
      if (name) {
        // Salta 'instance[index]' perché è già stato impostato in modo univoco.
        if (name === 'instance[index]') return;
        const value = input.val() as string;
        if (name.includes('[relation]') && !value) {
          // Non inviare relazioni vuote
        } else {
          formData.append(name, value);
        }
      }
    });

    // Process multi-selects
    this._jq(formElement).find('select[multiple]').each((_index, el) => {
      const select = this._jq(el);
      const name = select.attr('name');
      const selectedValues = select.val() as string[] | null;
      if (name && selectedValues && selectedValues.length > 0) {
        const arrayName = name.endsWith('[]') ? name : `${name}[]`;
        selectedValues.forEach(value => {
          formData.append(arrayName, value);
        });
      }
    });

    // Process file inputs
    this._jq(formElement).find('input[type="file"]').each((_index, el) => {
      const fileInput = el as HTMLInputElement;
      const name = fileInput.name;
      if (name && fileInput.files && fileInput.files.length > 0) {
        formData.append(name, fileInput.files[0], fileInput.files[0].name);
      }
    });

    this.isLoading = true;
    this.cdr.detectChanges();

    const createSubscription = this.addEntityService.createEntity(type, formData)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (ret: any) => {
          if (useGritter) {
            this.toastr.success(ret.message || this.translate.instant('menu.entities.add.createSuccess'));
          }
          this.formHtml = null;
          this.selectedIndex = null;
          this.searchControl.setValue('');
        },
        error: (err) => {
          const errorMessage = err.error?.message || err.message || this.translate.instant('menu.entities.add.createError');
          if (useGritter) {
            this.toastr.error(errorMessage);
          }
        }
      });
    this.subscriptions.add(createSubscription);
  }
}
