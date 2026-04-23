import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import hljs from 'highlight.js/lib/core';

@Directive({
  selector: '[appHighlight]',
  standalone: true,
})
export class HighlightDirective implements OnChanges {
  @Input('appHighlight') code: string | undefined | null = '';
  @Input() language: string | undefined | null = '';

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Esegui l'highlight solo se abbiamo sia il codice che il linguaggio
    // e se uno dei due è cambiato in questo ciclo.
    if ((changes['code'] || changes['language']) && this.code && this.language) {
      if (hljs.getLanguage(this.language)) {
        this.elementRef.nativeElement.innerHTML = hljs.highlight(this.code, { language: this.language }).value;
      }
    }
  }
}