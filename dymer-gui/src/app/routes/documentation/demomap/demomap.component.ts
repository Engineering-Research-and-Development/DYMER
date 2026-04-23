import { Component, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MtxAlertModule } from '@ng-matero/extensions/alert';
import { MtxProgressModule } from '@ng-matero/extensions/progress';
import { DemoMapService } from './demomap.service';
import { TranslateModule } from '@ngx-translate/core';
import { MtxGridModule } from '@ng-matero/extensions/grid';
import { PageHeaderComponent } from '@shared';
import { ApiService } from '@core/services/api.service';
import { MatIconModule } from '@angular/material/icon';
import { KpiMinicardComponent } from '@shared';
import { RouterLink, RouterOutlet } from '@angular/router';
import { HighlightDirective } from '@shared/directives/highlight.directive';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import xml from 'highlight.js/lib/languages/xml'; // For HTML

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('html', xml);

@Component({
  selector: 'app-demomap',
  templateUrl: './demomap.component.html',
  styleUrl: './demomap.component.scss',
  encapsulation: ViewEncapsulation.None, // Disabilita l'incapsulamento degli stili
  standalone: true,
  providers: [DemoMapService],
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
export class DemoMapComponent {
  public isModalOpen: { [key: string]: boolean } = {
    myModalRList: false,
    myModalRListD: false,
  };
  public downloadBaseUrl: string;

  // Code samples moved from template to TS to avoid Angular parsing of { }
  public codeLocationSample = `    "location": {
      "type": "Point",
      "coordinates": ["16.5058996","48.2256476"]
    } `;

  public codeJsonDymerConfig = `<script>
var jsonDymerConfig = {
    query: { // define the query to do in dymer
        "instance": {
            "index": "index-entity" ,
            "type": "type-entity" 
        }
    },
    endpoint: 'entity.search', // set the endpoint to execute the query of entities
    viewtype: 'teaserlist', // set to use the 'Preview in List' template
    swapgeop: true,
    dt: { // set data-table columns
        columns: [
          { title: "Title", data: "title" },
          { title: "", data: "_id", 
              render: function (data, type, row) {
                  return '<i class="fa fa-eye" aria-hidden="true" style="cursor:pointer;color:#17a2b8" onclick="kmsrenderdetail(\\'' + data + '\\')"></i>';	},
            className: 'text-center', "orderable": false}		
          ]
  },
   target: {
        fullcontent: {// configure where and how to render the detail of an entity
            id: "#cont-MyEnt", // the Map & DataTablewill be rendered inside the element with id "#cont-MyList"
            action: "html" // set the method to insert the content (html/append/prepend)
            },
        map:{  id: "#cont-TotalMap"// configure id map container (if map/dt view) 
        },
        dt:{  id: "#cont-Dt"// cconfigure id dataTable container (if map/dt view)
        },
        list:{  id: "#cont-MyList"// configure id list container (if list view)
        }
        }
    }
};
function mainDymerView() {
    generateMapDT(jsonDymerConfig);
}
</script>`;

  public codeDymerUrl = ` <script id="dymerurl" src="<dymerip>/public/cdn/js/dymer.map.js"> </script>`;

  public codeDomContainers = ` <div class="container" id="cont-TotalMap">
    <div id="divEagleFilter" class="col-3  ">
    this html block will be shown in the fullscreen map
    </div>
    <div id="cont-Map">
    </div>
</div>

 <div id="cont-Dt"></div>
 <div id="cont-MyEnt"> </div>`;

  public codeDymerConf = ` var d_uid = '<user-id>'; // user id
var d_gid = '<group-id>'; // group id
var dymerconf = { // disable import bootstrap & jquery
  notImport : ["bootstrap","jquery"]
};`;

  public codeMapDtAdvanced = `map:{ 
    dt: {
        columns: [{ 
            defaultContent: "",
            className: ' noselectfilter',//onlyDateSearch, noautofilter , tdEllipse
            visible: false
            } ] 
        }
    } `;

  public codeMapMarkers = `map:{ 
    markers:{ 
        'index_entity':[ { 							
                            default: true,
                            icon: 'fa-circle', 
                            prefix: 'fa', 
                            markerColor: 'blue'  
                        },
                        { 
                          key: 'key-to-compare', 
                          value: 'value-to compare', 
                          icon: 'fa-circle', 
                          prefix: 'fa',
                          markerColor: 'blue',
                          iconColor: 'black'
                        },//example multi option
                        {
                            key: 'category',
                            value: ["editing", "analysis" ],
                            icon: 'fa-circle', 
                            prefix: 'fa', 
                            markerColor: 'green-red' 
                            }  
                    ] 
        }
    } `;

  public codeMapStyle = `map:{ 
  style: 'insert-style'
  ...
}`;

  public codeMapSetting = `map:{ 
  setting: {
    zoomSnap: 0.25,
    "center": [39.4965947435828, 15.745697902296786],
    "zoom": 6.5,
    "maxBounds": [
      [-135, -270],
      [135, 270]
    ],
    "groupmarkers": <value> // true/false -> not mandatory , default value is true
  }
  ...
}`;

  public codeMapDefaults = `  {
        zoomSnap: 0.5,
  "background": "osmec",
  "center": [46.01222384063236, 21.401367187500004],
  "zoom": 4,
  "maxZoom": 16,
  "minZoom": 2,
  "maxBounds": [
    [-135, -270],
    [135, 270]
  ],
        "groupmarkers":true
}`;

  constructor(private apiService: ApiService) {
    // The baseUrl from ApiService is like 'http://localhost:8080/api'
    // We remove the '/api' part to get the root of the backend server for the download link.
    this.downloadBaseUrl = this.apiService.baseUrl.replace('/api', '');
  }

  /**
   * Apre un modale basato sul suo ID.
   * @param modalId L'ID del modale da aprire.
   */
  openModal(modalId: string): void {
    this.isModalOpen[modalId] = true;
  }

  /**
   * Chiude un modale basato sul suo ID.
   * @param modalId L'ID del modale da chiudere.
   */
  closeModal(modalId: string): void {
    this.isModalOpen[modalId] = false;
  }

  scrollToTop(): void {
    const mainPanel = document.querySelector('.main-panel') as HTMLElement;
    if (mainPanel) {
      mainPanel.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Scrolls to an anchor element within the '.main-panel' container.
   * @param elementId The ID of the element to scroll to.
   * @param event The mouse event to prevent default behavior.
   */
  scrollToAnchor(elementId: string, event: MouseEvent): void {
    event.preventDefault();
    const mainPanel = document.querySelector('.main-panel');
    const element = document.getElementById(elementId);

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    }
  }
}