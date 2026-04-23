
import { Injectable, NgZone } from '@angular/core';

declare var Vvveb: any;
declare var $: any;

@Injectable({ providedIn: 'root' })
export class VvvebService {
  constructor(private ngZone: NgZone) { }

  getVvveb(): any {
    return Vvveb;
  }

  getJQuery(): any {
    return $;
  }

  initVvveb(pages: any, editorType: string, callback: () => void): void {
    this.ngZone.runOutsideAngular(() => {

      const firstPage = Array.isArray(pages) ? pages[0] : pages['index'];
      Vvveb.CodeEditor.codemirror = false;
      Vvveb.Components.componentPropertiesElement = '#left-panel .component-properties';
      Vvveb.editorType = editorType; //'models';
      Vvveb.pathservice = editorType == 'models' ? '/api/forms/api/v1/form/' : '/api/templates/api/v1/template/' // '/api/forms/api/v1/form/';

      Vvveb.Builder.init(firstPage.url, () => {
        Vvveb.Gui.init();
        Vvveb.FileManager.init();
        Vvveb.SectionList.init();
        Vvveb.TreeList.init();
        Vvveb.Breadcrumb.init();
        Vvveb.CssEditor.init();
        Vvveb.FileManager.addPages(pages);
        Vvveb.FileManager.loadPage(firstPage.name);
        Vvveb.Gui.toggleRightColumn(false);
        callback();
      });
      //console.log('Vvveb:', Vvveb);
      //console.log('First page:', firstPage);
    });
  }



  resetVvveb(): void {
    this.ngZone.runOutsideAngular(() => {
      try {
        // Rimuove tutti gli elementi injectati nel DOM
        const templateIds = [
          'vvveb-input-textinput',
          'vvveb-input-textareainput',
          'vvveb-input-checkboxinput',
          'vvveb-input-radioinput',
          'vvveb-input-radiobuttoninput',
          'vvveb-input-toggle',
          'vvveb-input-header',
          'vvveb-input-select',
          'vvveb-input-icon-select',
          'vvveb-input-html-list-select',
          'vvveb-input-html-list-dropdown',
          'vvveb-input-dateinput',
          'vvveb-input-listinput',
          'vvveb-input-grid',
          'vvveb-input-textvalue',
          'vvveb-input-rangeinput',
          'vvveb-input-imageinput',
          'vvveb-input-imageinput-gallery',
          'vvveb-input-videoinput-gallery',
          'vvveb-input-colorinput',
          'vvveb-input-bootstrap-color-picker-input',
          'vvveb-input-numberinput',
          'vvveb-input-button',
          'vvveb-input-cssunitinput',
          'vvveb-filemanager-folder',
          'vvveb-filemanager-page',
          'vvveb-filemanager-component',
          'vvveb-breadcrumb-navigaton-item',
          'vvveb-property',
          'vvveb-input-autocompletelist',
          'vvveb-input-tagsinput',
          'vvveb-input-noticeinput',
          'vvveb-section'
        ];

        templateIds.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.remove();
        });

        // Reset Vvveb internamente
        if (typeof Vvveb !== 'undefined') {
          if (Vvveb.FileManager) {
            Vvveb.FileManager.pages = {};
            Vvveb.FileManager.currentPage = null;
          }

          if (Vvveb.Builder?.reset) {
            Vvveb.Builder.reset(); // se esiste
          }

          Vvveb.editorType = null;
          Vvveb.pathservice = null;
        }

        // Pulizia iframe
        const iframe = document.querySelector('#iframe-wrapper iframe');
        if (iframe) {
          iframe.setAttribute('src', 'about:blank');
        }

        console.log('Reset Vvveb completato');
      } catch (err) {
        console.error('Errore nel reset di Vvveb:', err);
      }
    });
  }
}
