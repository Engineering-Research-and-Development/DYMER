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
import { ModelsDocService } from './modelsdoc.service';
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
  selector: 'app-modelsdoc',
  templateUrl: './modelsdoc.component.html',
  styleUrl: './modelsdoc.component.scss',
  encapsulation: ViewEncapsulation.None, // Disabilita l'incapsulamento degli stili
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [ModelsDocService],
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
        MatIconModule
  ],
})
export class ModelsDocComponent implements OnInit, AfterViewInit {

  public codeBlockExample1!: string;
  public codeBlockValidation1!: string;
  public codeBlockValidation2!: string;
  public codeBlockValidation3!: string;

  @ViewChild('codeBlock1') codeBlock1Ref!: ElementRef;
  @ViewChild('codeBlock2') codeBlock2Ref!: ElementRef;
  @ViewChild('codeBlock3') codeBlock3Ref!: ElementRef;
  @ViewChild('codeBlock4') codeBlock4Ref!: ElementRef;

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.codeBlockExample1 = `<div class="form-group repeatable first-repeatable">
    <label for="description" class=" ">Aspects that needed improvement</label>
    <select class="form-control" name="data[tipomio][0]" searchable-label="Organization" searchable-multiple="true" searchable-override="data[tipomio]">
        <option value="RTO">RTO</option>
        <option value="LE">LE</option>
        <option value="SME">SME</option>
        <option value="LEA">LEA</option>
        <option value="Public Body">Public Body</option>
        <option value="NPO">NPO</option>
        <option value="NGO">NGO</option>
        <option value="Association">Association</option>
        <option value="Think Tank">Think Tank</option>
        <option value="LEA due">LEA due</option>
    </select>
    <div class="action-br">
        <span class="btn  btn-outline-primary  btn-sm" onclick="cloneRepeatable($(this))">+</span>
        <span class="btn  btn-outline-danger  btn-sm act-remove" onclick="removeRepeatable($(this))">-</span>
    </div>
</div>
`;
    this.codeBlockValidation1 = `<form id="entityForm" class="senderForm  needs-validation" novalidate=""></form>`;
    this.codeBlockValidation2 = `<div class="invalid-feedback">test invalid</div>`;
    this.codeBlockValidation3 = `<textarea dymer-model-element="" dymer-model-visibility="private" dymer-element-validation="testdescr" type="textarea"
        class="form-control  col-12 span12" name="data[description]" minlength="10" maxlength="20"></textarea>

function testdescr(el){
if(el.val().length >12){
    return true;
}else{
    return false;
}
}
`;
  }
  
  ngAfterViewInit(): void {
    // We need to trigger change detection manually to ensure the code blocks are in the DOM
    this.cdr.detectChanges();

    hljs.highlightElement(this.codeBlock1Ref.nativeElement);
    hljs.highlightElement(this.codeBlock2Ref.nativeElement);
    hljs.highlightElement(this.codeBlock3Ref.nativeElement);
    hljs.highlightElement(this.codeBlock4Ref.nativeElement);
  }

  scrollToTop(event: Event) { // Corrected: This method was outside the class.
    event.preventDefault();
    const mainPanel = document.querySelector('.main-panel');
    if (mainPanel) {
      mainPanel.scrollTop = 0;
    }
  }

  scrollToAnchor(elementId: string, event: MouseEvent): void {
    event.preventDefault();
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    }
  }

}