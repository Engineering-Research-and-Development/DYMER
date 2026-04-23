import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewEncapsulation, ViewChild, ChangeDetectorRef, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MtxAlertModule } from '@ng-matero/extensions/alert';
import { MtxProgressModule } from '@ng-matero/extensions/progress';
import { TemplatesDocService } from './templatesdoc.service';
import { TranslateModule } from '@ngx-translate/core';
import { MtxGridModule } from '@ng-matero/extensions/grid';
import { PageHeaderComponent } from '@shared';
import { ApiService } from '@core/services/api.service';
import { MatIconModule } from '@angular/material/icon';
import { KpiMinicardComponent } from '@shared';
import { RouterOutlet, RouterLink } from '@angular/router';
import { HighlightDirective } from '@shared/directives/highlight.directive';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import xml from 'highlight.js/lib/languages/xml'; // For HTML

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('html', xml);

@Component({
  selector: 'app-templatesdoc',
  templateUrl: './templatesdoc.component.html',
  styleUrl: './templatesdoc.component.scss',
  encapsulation: ViewEncapsulation.None, // Disabilita l'incapsulamento degli stili
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [TemplatesDocService],
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
      
 
  ],
})
export class TemplatesDocComponent implements OnInit, AfterViewInit {

  public lenderFileExample2!: string;
  public formatDateExample!: string;
  public ifIsNthItemExample!: string;

  @ViewChild('codeBlock1') codeBlock1Ref!: ElementRef;
  @ViewChild('codeBlock2') codeBlock2Ref!: ElementRef;
  @ViewChild('codeBlock3') codeBlock3Ref!: ElementRef;
  @ViewChild('codeBlock4') codeBlock4Ref!: ElementRef;
  @ViewChild('codeBlock5') codeBlock5Ref!: ElementRef;
  @ViewChild('codeBlock6') codeBlock6Ref!: ElementRef;
  @ViewChild('codeBlock7') codeBlock7Ref!: ElementRef;
  templateListExample!: string;
  setVariableExample!: string;
  ifEqualsExample!: string;
  renderFileExample1!: string;

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.templateListExample = `{{setVariable "d_pagination_size" 6}}
{{#each this}}
    <div class="row listrow" d-pagegroup="{{DymerPaginationPageIndex ../this.length @index}}">
        <div data-component-entitystatus="" data-vvveb-disabled="" class="row">{{{EntityStatus this}}}</div>
        <div class="col-3">
            <img class="img-fluid logof" src="{{loadfile _id logo.id}}">
        </div>
        <div class="col-9">
            <h1 class="text-info">{{title}}</h1>
        </div>
        <div class="descrellipse">{{description}}</div>
    {{#if additionalmaterial}}
        <section class=" ">
            <div class="container_section">
                <div class="container-fluid_">
                    <div class="">
                        <div class="">
                            <h2 class="primaryColor primaryTitlesection"><b>Additional material</b></h2>
                        </div>
                        <div class="container-fluid_">
                            <ul>
                                {{#each additionalmaterial}}
                                    <li spellcheckker="false" contenteditable="true">
                                        file id:{{pdf.id}}
                                        {{#if pdf}}
                                            <a title="{{label}}" href="{{loadfile ../../_id pdf.id}}" target="_blank">+{{label}}</a>
                                        {{else}}
                                            <a title="{{url}}" href="{{url}}" target="_blank">{{label}}</a>
                                        {{/if}}
                                    </li>
                                {{/each}}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <section class=" ">
            <div class="container_section">
                <div class="separator"></div>
            </div>
        </section>
    {{/if}}
    {{#if gallery.length}}
        <div class="col-6">
            <div class=" ">
                {{#each gallery}}
                    <div class="carousel-item item {{#ifEquals @index 0}}active{{/ifEquals}}">
                        {{#if img}}
                            <img src="{{loadfile ../../_id img.id}}" alt="">
                        {{else}}
                        <img src="{{url}}" alt="">
                        {{/if}}
                    </div>
                {{/each}}
            </div>
        </div>
    {{/if}}
    <span class="pull-right text-info " style="padding-top: 10px;cursor:pointer" title="{{name}}" onclick="kmsrenderdetail('{{_id}}')">
        View More
    </span>
    </div>
 <hr>
 {{/each}}
 <div data-component-dpagination="" class="row pagination" d-pagination-size="6">{{{DymerPagination this}}}</div>`;

    this.setVariableExample = `{{setVariable "your_variable_name" your_value}}
Example:
{{setVariable "d_pagination_size" 6}}`;
 
    this.ifEqualsExample = `{{#ifEquals your_variable_name your_value}}
    your code
{{else}}
    your code
{{/ifEquals}}
Example:
{{#ifEquals @index 0}}HELLO!!{{/ifEquals}}`;
 
    this.renderFileExample1 = `<img class="img-fluid logof" src="{{loadfile _id your_object_key.id}}">
Example:
<img class="img-fluid logof" src="{{loadfile _id logo.id}}">`;

    this.lenderFileExample2 = `{{#each your_object_array_key}}
    <a title="{{label}}" href="{{loadfile relative_path_root_entity/_id your_object_key.id}}" target="_blank">{{label}}</a>
{{/each }}
Example:
{{#each additionalmaterial}}
    <a title="{{label}}" href="{{loadfile ../../_id pdf.id}}" target="_blank">{{label}}</a>
{{/each }}`;
 
    this.formatDateExample = `{{formatDate your_object_key "date format desired"}}
Example:   Updated {{formatDate properties.changed "dd/MM/yyyy HH:mm"}}`;
 
    this.ifIsNthItemExample = `{{#each this}}
    {{#ifIsNthItem nth=your_number_value}}
        yes
    {{else}}
        no
    {{/ifIsNthItem}}
{{/each }}
Example:
{{#each this}}
    {{#ifIsNthItem nth=8}}
        yes
    {{else}}
        no
    {{/ifIsNthItem}}
{{/each }}`;
  }
 
  ngAfterViewInit(): void {
    // We need to trigger change detection manually to ensure the code blocks are in the DOM
    this.cdr.detectChanges();
 
    hljs.highlightElement(this.codeBlock1Ref.nativeElement);
    hljs.highlightElement(this.codeBlock2Ref.nativeElement);
    hljs.highlightElement(this.codeBlock3Ref.nativeElement);
    hljs.highlightElement(this.codeBlock4Ref.nativeElement);
    hljs.highlightElement(this.codeBlock5Ref.nativeElement);
    hljs.highlightElement(this.codeBlock6Ref.nativeElement);
    hljs.highlightElement(this.codeBlock7Ref.nativeElement);
  }
 
  scrollToTop(event: Event) {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
 
  scrollToAnchor(elementId: string, event: MouseEvent): void {
    event.preventDefault();
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    }
  }

}