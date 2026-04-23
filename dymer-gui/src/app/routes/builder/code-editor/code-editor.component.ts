import { Component, inject, ElementRef, ViewChild, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BuilderService } from '../builder.service';
import { MatIconModule } from '@angular/material/icon';
import * as Prism from 'prismjs';

@Component({
  selector: 'app-code-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="flex flex-col h-full bg-gray-900 text-white font-mono text-sm">
      <div class="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span class="font-semibold text-gray-300">HTML Source</span>
        <button (click)="close()" class="text-gray-400 hover:text-white">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div class="flex-1 relative overflow-hidden">
        <!-- Editor Area -->
        <textarea 
          #textarea
          [ngModel]="htmlContent()" 
          (ngModelChange)="updateHtml($event)"
          (scroll)="syncScroll()"
          class="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white p-4 outline-hidden resize-none font-mono leading-relaxed z-10"
          spellcheck="false"
        ></textarea>
        
        <!-- Syntax Highlight Layer -->
        <pre 
          #pre
          class="absolute inset-0 w-full h-full m-0 p-4 pointer-events-none font-mono leading-relaxed overflow-hidden"
          aria-hidden="true"
        ><code #code class="language-html" [innerHTML]="highlightedCode"></code></pre>
      </div>
      <div class="px-4 py-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-500">
        Pressing keys updates the canvas in real-time.
      </div>
    </div>
  `,
  styles: [`
    /* Basic Prism Theme for Dark Mode */
    ::ng-deep code[class*="language-"],
    ::ng-deep pre[class*="language-"] {
      color: #f8f8f2;
      text-shadow: 0 1px rgba(0, 0, 0, 0.3);
      font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
      text-align: left;
      white-space: pre-wrap;
      word-spacing: normal;
      word-break: normal;
      word-wrap: normal;
      line-height: 1.5;
      tab-size: 4;
      hyphens: none;
    }

    ::ng-deep .token.comment,
    ::ng-deep .token.prolog,
    ::ng-deep .token.doctype,
    ::ng-deep .token.cdata {
      color: #8292a2;
    }

    ::ng-deep .token.punctuation {
      color: #f8f8f2;
    }

    ::ng-deep .token.namespace {
      opacity: .7;
    }

    ::ng-deep .token.property,
    ::ng-deep .token.tag,
    ::ng-deep .token.constant,
    ::ng-deep .token.symbol,
    ::ng-deep .token.deleted {
      color: #f92672;
    }

    ::ng-deep .token.boolean,
    ::ng-deep .token.number {
      color: #ae81ff;
    }

    ::ng-deep .token.selector,
    ::ng-deep .token.attr-name,
    ::ng-deep .token.string,
    ::ng-deep .token.char,
    ::ng-deep .token.builtin,
    ::ng-deep .token.inserted {
      color: #a6e22e;
    }

    ::ng-deep .token.operator,
    ::ng-deep .token.entity,
    ::ng-deep .token.url,
    ::ng-deep .language-css .token.string,
    ::ng-deep .style .token.string,
    ::ng-deep .variable {
      color: #f8f8f2;
    }

    ::ng-deep .token.atrule,
    ::ng-deep .token.attr-value,
    ::ng-deep .token.function,
    ::ng-deep .token.class-name {
      color: #e6db74;
    }

    ::ng-deep .token.keyword {
      color: #66d9ef;
    }

    ::ng-deep .token.regex,
    ::ng-deep .token.important {
      color: #fd971f;
    }
  `]
})
export class CodeEditorComponent implements AfterViewInit {
  builderService = inject(BuilderService);
  htmlContent = this.builderService.htmlContent;
  
  @ViewChild('textarea') textarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('pre') pre!: ElementRef<HTMLElement>;
  @ViewChild('code') code!: ElementRef<HTMLElement>;

  highlightedCode = '';

  constructor() {
    effect(() => {
      const html = this.htmlContent();
      this.highlight(html);
    });
  }

  ngAfterViewInit() {
    this.highlight(this.htmlContent());
  }

  updateHtml(value: string) {
    this.builderService.updateContent(value);
    this.highlight(value);
  }

  highlight(code: string) {
    // Escape HTML for the code block (Prism expects raw text but we bind innerHTML)
    // Actually Prism.highlight returns HTML string.
    this.highlightedCode = Prism.highlight(code, Prism.languages['html'], 'html');
  }

  syncScroll() {
    if (this.textarea && this.pre) {
      this.pre.nativeElement.scrollTop = this.textarea.nativeElement.scrollTop;
      this.pre.nativeElement.scrollLeft = this.textarea.nativeElement.scrollLeft;
    }
  }

  close() {
    this.builderService.toggleCodeEditor();
  }
}
