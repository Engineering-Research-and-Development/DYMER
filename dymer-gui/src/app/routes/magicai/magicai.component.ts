import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { 
  FormBuilder,
  FormGroup,
  FormArray,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  FormControl,
} from "@angular/forms";
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card'; 
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
 
import { BreadcrumbComponent } from '@shared';
import { PageHeaderComponent } from '@shared';
import { TranslateModule } from '@ngx-translate/core';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common'; 
import { ToastrService } from "ngx-toastr";
import { MagicaiService } from './magicai.service';
import { MatRadioButton, MatRadioModule } from '@angular/material/radio';
// import { OllamaService } from '@core/services/ollama.service';
import { DomSanitizer, SafeHtml, Title } from '@angular/platform-browser';
import { finalize } from 'rxjs/operators'; 
import { HighlightModule, HIGHLIGHT_OPTIONS } from 'ngx-highlightjs';

type Msg = { 
  from: 'user' | 'bot'; 
  text: string | SafeHtml; 
  time: string;
  code?: string;
  codeLanguage?: string;
  copied?: boolean; // <-- aggiunto
};
declare function html2json(html: string): any;

(window as any).DEBUG = false;
@Component({
  selector: 'app-magicai',
  templateUrl: './magicai.component.html',
  styleUrl: './magicai.component.scss',
  standalone: true,
  imports: [
     FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
  
    MatFormFieldModule,
    MatInputModule,
    
   
    TranslateModule,
    MatOptionModule,
    MatSelectModule,
    MatCheckboxModule,
    CommonModule,
   
    MatRadioModule,
    HighlightModule
   ],
   providers: [
    {
      provide: HIGHLIGHT_OPTIONS,
      useValue: {
        coreLibraryLoader: () => import('highlight.js/lib/core'),
         languages: {
          html: () => import('highlight.js/lib/languages/xml'),
          javascript: () => import('highlight.js/lib/languages/javascript'),
          typescript: () => import('highlight.js/lib/languages/typescript'),
          css: () => import('highlight.js/lib/languages/css'),
        }
      }
    }
  ]
})
export class MagicAiComponent implements OnInit {
  
  messages: Msg[] = [];
  isLoading: boolean = false;
  zeroFormGroup!: FormGroup;
  constructor(
    private aiService: MagicaiService,
    private readonly toast: ToastrService, 
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
    ) {}
  ngOnInit() {
    this.zeroFormGroup = this.fb.group({
      userInput: ['', Validators.required]
    });
  }

  clearPromptInput(): void {
    this.messages = [];
  }

  copyCode(messageOrCode: any): void {
    const text = typeof messageOrCode === 'string' ? messageOrCode : (messageOrCode && messageOrCode.code) || '';
    if (!text) { return; }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (typeof messageOrCode === 'object') {
          messageOrCode.copied = true;
          setTimeout(() => messageOrCode.copied = false, 2000);
        }
      }).catch(() => this._fallbackCopy(text, messageOrCode));
    } else {
      this._fallbackCopy(text, messageOrCode);
    }
  }

  private _fallbackCopy(text: string, messageObj?: any) {
    const ta = document.createElement('textarea');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      if (messageObj) {
        messageObj.copied = true;
        setTimeout(() => messageObj.copied = false, 2000);
      }
    } catch (e) {
      console.error('copy failed', e);
    }
    document.body.removeChild(ta);
  }

  private extractCode(response: string): { text: string, code: string, language: string } {
    const codeBlockRegex = /```(\w+)?\s*([\s\S]*?)```/;
    const match = response.match(codeBlockRegex);

    if (match) {
      const language = match[1] || 'plaintext';
      const code = match[2].trim();
      const text = response.replace(codeBlockRegex, '').trim();
      return { text, code, language };
    }

    return { text: response, code: '', language: '' };
  }

sendMessage() {
  const inputControl = this.zeroFormGroup.get('userInput');
  const messageToSend = inputControl?.value?.trim();
  if (!messageToSend || this.zeroFormGroup.invalid) return;

  // Add user message
  this.messages.push({ from: 'user', text: messageToSend, time: new Date().toISOString() });
  inputControl?.reset();
  inputControl?.disable();
  // Add an empty bot message to stream into
  const botMessageIndex = this.messages.length;
  this.messages.push({ from: 'bot', text: '', time: new Date().toISOString() });
  let fullResponse = '';

  this.isLoading = true;

  this.aiService.streamChat(messageToSend)
    .pipe(finalize(() => {
      const botMessage = this.messages[botMessageIndex];
      const { text, code, language } = this.extractCode(fullResponse);

      botMessage.text = text;
      if (code) {
        botMessage.code = code;
        botMessage.codeLanguage = language;
      }

      this.isLoading = false;
      inputControl?.enable(); // Re-enable the input field
      this.cdr.detectChanges(); // Forza il rilevamento delle modifiche
    }))
    .subscribe({
      next: (chunk) => {
        fullResponse += chunk;
        this.messages[botMessageIndex].text = fullResponse; // Mostra lo stream in tempo reale
      },
      error: (err) => {
        console.error('Errore durante lo streaming:', err);
        this.messages[botMessageIndex].text = "Si è verificato un errore durante la comunicazione.";
      }
    });
}
}
