import { ChangeDetectionStrategy, Component, ViewEncapsulation, OnInit, AfterViewInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MtxAlertModule } from '@ng-matero/extensions/alert';
import { MtxProgressModule } from '@ng-matero/extensions/progress';
import { DemoSearchBarService } from './demosearchbar.service';
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
  selector: 'app-demosearchbar',
  templateUrl: './demosearchbar.component.html',
  styleUrl: './demosearchbar.component.scss',
  encapsulation: ViewEncapsulation.None, // Disabilita l'incapsulamento degli stili
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [DemoSearchBarService],
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
export class DemoSearchBarComponent implements OnInit, AfterViewInit {

  public isModalOpen: { [key: string]: boolean } = {
    myModalRList: false,
    myModalRList1: false,
    myModalRList2: false,
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

  // Code samples moved from template to avoid Angular parsing of { }
  public codeSnippetSearchJs: string = `function mainDymerView() {//prepareFrame();//, "demproduct"
  query: {
    instance: { index: 'index-entity', type: 'type-entity' }
  },
  endpoint: 'entity.search',
  viewtype: 'teaserlist',
  searchbar: {
    filters: [
      { key: 'title', operator: 'must', boost: 2 },
      { key: 'description', operator: 'must' },
      { key: 'category', operator: 'filter' }
    ]
  },
  target: {
    fullcontent: { id: "#cont-MyEnt", action: "html" },
    list: { id: "#cont-MyList" }
  }
};
function mainDymerView() {
    var index = 'demproduct';
    loadModelListToModal($('#cont-addentity'), index);
    var obj = getAllUrlParams(); //recupera i parametri presenti nell'url (passati in get)
    var elId = obj["d_eid"]; //d_eid : lo scegli tu da portlet
    if (elId != undefined)
        drawEntityByIdUrl("#cont-MyList", "d_eid"); //d_eid : lo scegli tu da portlet , "#cont-MyList": è il contenitore dove
    renderizzare
    else
    drawEntities(jsonConfig); //rimane tale
    //FINE
    var indexFilter = "demproduct";
    setTimeout(function() {
    dTagFilter = $('#dTagFilter');
    dTagFilter.dymertagsinput({
    //indexmodelfilter:"hubcapmodel",
    indexterms: {
            "bool": {
                "must": [{
                    "terms": {
                        "_index": [ "demproduct"]
                        }
                    }]
                }
            },
    allowDuplicates: true,
    freeInput: false,
    itemValue: 'id', // this will be used to set id of tag
    itemText: 'label' // this will be used to set text of tag
    });
    if (!dTagFilter.dymertagsinput('getOptionFreeInput'))
        dTagFilter.on('beforeItemRemove', function(event) {
    $('#d_entityfilter [filter-relid="' + event.item.id + '"').prop("checked", false);
    });
    
    }, 2000);
    console.log('dTagFilter', dTagFilter);
    loadFilterModel(indexFilter, dTagFilter);
}`;

  public codeModalFilterHtml: string = `<div id="dymer_filtercontent">
    <div class="row">
        <div class="col-12">
            <div class="input-group" id="adv-search" style_="display: none;">
                <input id="dTagFilter" type="text" data-role="tagsinput" placeholder="Search for snippets, click on caret"
                class="freetext_">
                <div class="input-group-btn">
                    <div class="btn-group" role="group">
                        <div class="dropdown dropdown-lg">
                            <button type="button" id="dFilterClearAll" class="btn freetext_"><i class="fas fa-eraser"
                            onclick="clearDFilter()"></i></button>
                            <!----><button type="button" id="dFilterDropdown" class="btn btn-default dropdown-toggle"
                            data-toggle="dropdown"><span class="caret"></span></button>
                            <!-- -->
                            <div id="d_entityfilter" class="dropdown-menu dropdown-menu-right " useplaceholder="true" role="menu">
                            Hello
                            <div class="grpfilter">
                            <div><label class="kms-title-label">Nearby Resources (in meters)</label></div> <input
                            type="text" class="form-control col-12 span12" name="data[distance]"
                            searchable-label="Distance (m)" required="" filter-id="distance">
                            <div class="switch_container pull-right"> <i class="fa fa-refresh filterSingRefresh"
                            aria-hidden="true" title="refresh filter value" filter-relid="distance"
                            filter-rel="data[distance]" filter-labeltext="" filter-label="Distance (m)"
                            filter-multiple="false" onclick="refreshDTagFilter( $(this))"></i> <label
                            class="switch switchfilter " title="active filter"><input type="checkbox"
                            filter-relid="distance" filter-rel="data[distance]"
                            filter-label="Distance (m)" filter-labeltext="" filter-multiple="false"
                            onclick="manageDTagFilter( $(this))"> <span class="slider round"></span>
                            </label> </div>
                            </div>
                        </div>
                    </div>
                    <button type="button" class="btn btn-primary" onclick="switchByFilter(dTagFilter)"><i class="fa fa-search"
                    aria-hidden="true"></i></button>
                    <!-- <button type="button" class="btn btn-primary" onclick="switchByGeneralText()"><i class="fa fa-ship"
                    aria-hidden="true"></i></button>-->
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>`;

  public codeFlatFilterHtml: string = `<div id="dymer_filtercontent">
    <div class="row">
        <div class="col-12">
            <div class="input-group" id="adv-search" style_="display: none;">
                <input id="dTagFilter" type="text" data-role="tagsinput" placeholder="Search for snippets, click on caret"
                 class="freetext_">
                <div class="input-group-btn">
                    <div class="btn-group" role="group">
                        <div class="dropdown dropdown-lg">
                            <button type="button" id="dFilterClearAll" class="btn freetext_"><i class="fas fa-eraser"
                            onclick="clearDFilter()"></i></button>
                            <!----><button type="button" id="dFilterDropdown" class="btn btn-default dropdown-toggle"
                            onclick="toggleFilter()" ><span class="caret"></span></button>
                            <!-- -->              
                        </div>
                        <button type="button" class="btn btn-primary" onclick="switchByFilter(dTagFilter)"><i class="fa fa-search"
                        aria-hidden="true"></i></button>
                        <!-- <button type="button" class="btn btn-primary" onclick="switchByGeneralText()"><i class="fa fa-ship"
                        aria-hidden="true"></i></button>-->
                    </div>
                </div>
            </div>
        </div>
        <div class="col-12">
             <div id="d_entityfilter" class="expanded" useplaceholder="true" style="display: block;" > </div>
        </div>
    </div>
</div>`;
  public codeDymerSearchJs: string = `function mainDymerView() {
    dsearch = new dymerSearch({
        "objname": "dsearch", //same object name -> Mandatory
        "formid": "myfilter", //id of your form -> Mandatory
        "filterModel":"demproduct", // index model to load searchables elements -> Not Mandatory
        "innerContainerid": "contform", // id div element indise form -> Mandatory
        "groupfilterclass": "col-12", // class to add on filters -> Not Mandatory , default value = "span12 col-12"
        "conditionQuery": "OR", // AND or OR  -> Not Mandatory, default value = "AND"
        "addfreesearch":true, // will add global search input, true/false -> Not Mandatory, default value = false
        "showFilterBtn":true, // will add button for advanced filter, true/false -> Not Mandatory, default value = false
        "showAdvOptionBtn":true, // will add button for advanced option, true/false -> Not Mandatory, default value = false
        "translations": { // with the following structure, you can translate the individual entries -> Not Mandatory, default value = as reported
                "und": {
                    "freesearch": {
                        "label": "Search",
                        "placeholder": "Enter any term"
                    },
                    "submit": {
                        "text": "SEARCH"
                    }
                }
            },
        "query": { // base query for search
            "bool": {
                "must": [{
                        "terms": { "_index": ["demproduct"] }
                        }]
                    }
            }
        });
}`;
  public codeDymerSearchForm: string = `<form id="myfilter" class="dymerSearch">
//here you can add custom filters
    <div id="contform" class="row">//the sorted auto filters will be added here </div>
//here you can add custom filters
</form>`;
  public codeCustomCondition: string = `<div class="grpfilter col-12" style="display: none;" data-filterpos="100">
    <label class="condition">Condition search</label>
    <select class="selectpicker  form-control col-12 span12" onchange="dsearch.setConditioQuery(this.value)">
        <option value="or">OR</option>
        <option value="and">AND</option>
    </select>
</div>`;

  constructor(private apiService: ApiService) {
    // The baseUrl from ApiService is like 'http://localhost:8080/api'
    // We remove the '/api' part to get the root of the backend server for the download link.
    this.downloadBaseUrl = this.apiService.baseUrl.replace('/api', '');
  }

  ngOnInit(): void {
    // Initialize component if needed
  }

  ngAfterViewInit(): void {
    // Highlight code blocks after view is rendered
    document.querySelectorAll('pre code').forEach((el) => {
      hljs.highlightElement(el as HTMLElement);
    });
  }

  /**
   * Apre un modale basato sul suo ID.
   * @param modalId L'ID del modale da aprire.
   */
  openModal(modalId: string): void {
    this.isModalOpen[modalId] = true;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Chiude un modale basato sul suo ID.
   * @param modalId L'ID del modale da chiudere.
   */
  closeModal(modalId: string): void {
    this.isModalOpen[modalId] = false;
  }

  /**
   * Scrolls to an anchor element on the page.
   * @param elementId The ID of the element to scroll to.
   * @param event The mouse event.
   */
  scrollToAnchor(elementId: string, event: MouseEvent): void {
    event.preventDefault();
    const element = document.querySelector('#' + elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    }
  }
}