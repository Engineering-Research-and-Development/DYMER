import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MtxAlertModule } from '@ng-matero/extensions/alert';
import { MtxProgressModule } from '@ng-matero/extensions/progress';
import { DemoSingleService } from './demosingle.service';
import { TranslateModule } from '@ngx-translate/core';
import { MtxGridModule } from '@ng-matero/extensions/grid';
import { PageHeaderComponent } from '@shared';
import { ApiService } from '@core/services/api.service';
import { MatIconModule } from '@angular/material/icon';
import { KpiMinicardComponent } from '@shared';
import { RouterOutlet } from '@angular/router'; 
import { HighlightDirective } from '@shared/directives/highlight.directive';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import xml from 'highlight.js/lib/languages/xml'; // For HTML

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('html', xml);

@Component({
  selector: 'app-demosingle',
  templateUrl: './demosingle.component.html',
  styleUrl: './demosingle.component.scss',
  encapsulation: ViewEncapsulation.None, // Disabilita l'incapsulamento degli stili
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [DemoSingleService],
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatListModule,
    MatGridListModule,
    MatTableModule,
    MatTabsModule,
    MtxProgressModule,
    MtxAlertModule,
    TranslateModule,
    MtxGridModule,
    
    MatIconModule,
    HighlightDirective,
  ],
})
export class DemoSingleComponent {

  public isModalOpen: { [key: string]: boolean } = {
    myModalRList: false,
    myModalRListD: false,
  };
  public downloadBaseUrl: string;

  codeBlock1 = `<script>
    var jsonDymerConfig = {
        query: { // define the query to do in dymer
            "query": {
              "query": {
                  "match": {
                      "_id": "_r6JvGoBD8fk-DDNrTCJ" // entity Id
                  }
              }
          }
        },
        endpoint: 'entity.search', // set the endpoint to execute the query of entities
        viewtype: 'fullcontent', // set to use the 'Fullcontent' template
        target: {
            fullcontent: {// configure where and how to render the detail of an entity
                id: "#cont-MyList", // the entity will be rendered inside the element with id "#cont-MyList"
                action: "html", // set the method to insert the content (html/append/prepend)
                reload: false // if false the query will be executed only on page load
              }
        }
    };
    function mainDymerView() {
        drawEntities(jsonDymerConfig);
    }
<` + `/script>`;

  codeBlock2 = `<script id="dymerurl" src="{dymerip}/public/cdn/js/dymer.viewer.js"><` + `/script>`;

  codeBlock3 = `<div id="cont-MyList"></div>`;

  codeBlock4 = `<script>
 var d_uid = '{user-id}'; // user id
 var d_gid = '{group-id}'; // group id
 var dymerconf = { // disable import bootstrap & jquery
    notImport : ["bootstrap","jquery"]
 };
<` + `/script>`;

  constructor(private apiService: ApiService) {
    // The baseUrl from ApiService is like 'http://localhost:8080/api'
    // We remove the '/api' part to get the root of the backend server for the download link.
    this.downloadBaseUrl = this.apiService.baseUrl.replace('/api', '');
  }

  /**
   * Apre un modale basato sul suo ID.
   * @param modalId L'ID del modale da aprire.
   */

  /**
   * Chiude un modale basato sul suo ID.
   * @param modalId L'ID del modale da chiudere.
   */
  closeModal(modalId: string): void {
    this.isModalOpen[modalId] = false;
  }
}