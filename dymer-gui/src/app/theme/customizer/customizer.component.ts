import { ChangeDetectorRef, Component, HostListener, OnInit, TemplateRef, ViewEncapsulation, inject, signal } from '@angular/core';
import { 
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
 import { MatMenuModule } from '@angular/material/menu'; // <--- AGGIUNGI QUESTO
import { MatDividerModule } from '@angular/material/divider'; // Spesso utile con i menu
import { TranslateModule } from '@ngx-translate/core';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { CommonModule } from '@angular/common'; 
import { ToastrService } from "ngx-toastr";
import { CustomizerService } from './customizer.service';
import { MatRadioButton, MatRadioModule } from '@angular/material/radio';
import { DomSanitizer, SafeHtml, Title } from '@angular/platform-browser';
import { finalize } from 'rxjs/operators'; 
import { HighlightModule, HIGHLIGHT_OPTIONS } from 'ngx-highlightjs';
import { CdkDrag, CdkDragStart } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MtxDrawer, MtxDrawerModule, MtxDrawerRef } from '@ng-matero/extensions/drawer';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';  

import { AiAgentsService } from '../../routes/services/aiconfig/ai-agents.service';
import { AiAgent } from '../../routes/services/models/ai-agent.model';

type Msg = { 
  from: 'user' | 'bot'; 
  text: string | SafeHtml; 
  time: string;
  code?: string;
  codeLanguage?: string;
  copied?: boolean;
  responseCopied?: boolean;
  rawText?: string;
  formattedText?: string;
};
declare function html2json(html: string): any;

(window as any).DEBUG = false;
@Component({
  selector: 'app-customizer',
  templateUrl: './customizer.component.html',
  styleUrl: './customizer.component.scss',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    MatMenuModule,
  MatDividerModule,
  MatIconModule,
  MatButtonModule,
  MatFormFieldModule,
  MatInputModule, 
     FormsModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    MatDividerModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule,
    MatOptionModule,
    MatSelectModule,
    MatMenuModule,
    CommonModule,
     MatRadioModule,
    HighlightModule,
    CdkDrag,
    MatIconModule,
    MatTooltipModule,
    MtxDrawerModule,
    CodemirrorModule,
   ],
  //  providers: [
  //   {
  //     provide: HIGHLIGHT_OPTIONS,
  //     useValue: {
  //       coreLibraryLoader: () => import('highlight.js/lib/core'),
  //        languages: {
  //         html: () => import('highlight.js/lib/languages/xml'),
  //         javascript: () => import('highlight.js/lib/languages/javascript'),
  //         typescript: () => import('highlight.js/lib/languages/typescript'),
  //         css: () => import('highlight.js/lib/languages/css'),
  //       }
  //     }
  //   }
  // ]
})
export class CustomizerComponent implements OnInit {
  messages: Msg[] = [];
  isLoading: boolean = false;
  zeroFormGroup!: FormGroup;

  isOnline: boolean = false;
  availableModels: any[] = [];
  selectedModel: string = 'llama3.1';  
  downloadProgress: number = 0;
  isDownloading: boolean = false;
 
  private agentService = inject(AiAgentsService);
  
  agents = signal<AiAgent[]>([]);
  selectedAgent = signal<AiAgent | null>(null);

  private readonly drawer = inject(MtxDrawer);
  private drawerRef?: MtxDrawerRef;
  private dragging = false;

  agentStatus = signal<'online' | 'offline' | 'checking'>('checking');
  // Variabile per tracciare lo stato del chatbot (pannello drawer)
  public isChatbotOpen = false;
  public isResizingChatbot = false;

  private readonly chatbotDefaultWidth = 400;
  private readonly chatbotMinWidth = 360;
  private chatbotStartX = 0;
  private chatbotStartWidth = this.chatbotDefaultWidth;
  private chatbotPanelElement: HTMLElement | null = null;

  private getStoredChatbotWidth(): number {
    const storedWidth = Number(localStorage.getItem('dymer.chatbot.width'));
    return Number.isFinite(storedWidth)
      ? Math.max(this.chatbotMinWidth, Math.min(storedWidth, window.innerWidth * 0.8))
      : this.chatbotDefaultWidth;
  }

  constructor(
    private aiService: CustomizerService,
    private readonly toast: ToastrService, 
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  getCodeMirrorOptions(language: string) {
    return {
      lineNumbers: true,
      theme: 'material', 
      mode: this.mapLanguageToMode(language),
      readOnly: true,
      lineWrapping: true
    };
  }
  private mapLanguageToMode(lang: string): string {
    const modes: { [key: string]: string } = {
      'javascript': 'javascript',
      'typescript': 'javascript',  
      'html': 'xml',
      'css': 'css',
      'python': 'python',
      'json': 'application/json'
    };
    return modes[lang?.toLowerCase()] || 'javascript';
  }
  ngOnInit() {
    this.loadAgents();

    this.zeroFormGroup = this.fb.group({
      userInput: ['', Validators.required]
    });
   /* this.loadActiveAgents();
    this.zeroFormGroup = this.fb.group({
      userInput: ['', Validators.required],
      model: ['llama3.1']
    });
    this.checkOllamaStatus();
    this.loadModels(); */

  }

 
  loadAgents() {
    this.agentService.getAll().subscribe(data => {
      console.log('Agenti ricevuti dal backend:', data);
      const active = data.filter(a => a.isActive);
      this.agents.set(active);
      if (active.length > 0) this.selectedAgent.set(active[0]);
    });
  }

  checkOllamaStatus() {
    this.aiService.checkStatus().subscribe({
      next: (res) => this.isOnline = res.success,
      error: () => this.isOnline = false
    });
  }

  loadModels() {
    this.aiService.getModels().subscribe(res => {
      if (res.success) this.availableModels = res.models;
    });
  }

  loadActiveAgents() {
    this.agentService.getAll().subscribe(data => {
      const activeOnes = data.filter(a => a.isActive);
      this.agents.set(activeOnes);
      if (activeOnes.length > 0) {
        this.selectedAgent.set(activeOnes[0]); // Imposta il primo come default
      }
    });
  }

  onDragStart(event: CdkDragStart) {
    this.dragging = true;
  }

  openPanel(templateRef: TemplateRef<any>) {
    if (this.dragging) {
      this.dragging = false;
      return;
    }

    // Se il chatbot è già aperto, non fare nulla
    if (this.isChatbotOpen) {
      return;
    }

    // Ricarica gli agenti quando si apre il panel per avere i dati sempre aggiornati
    this.loadAgents();

    this.isChatbotOpen = true; // Imposta lo stato su "aperto"
    this.drawerRef = this.drawer.open(templateRef, {
      position: 'right',
      width: `${this.getStoredChatbotWidth()}px`,
    });

    // Ascolta l'evento di chiusura per resettare lo stato
    this.drawerRef.afterDismissed().subscribe(() => {
      this.isChatbotOpen = false;
    });
  }

  startChatbotResize(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const container = (event.currentTarget as HTMLElement).closest('.magicai-container') as HTMLElement | null;
    const overlayPane = container?.closest('.cdk-overlay-pane') as HTMLElement | null;
    this.chatbotPanelElement = overlayPane || container;

    if (!this.chatbotPanelElement) return;

    this.isResizingChatbot = true;
    this.chatbotStartX = event.clientX;
    this.chatbotStartWidth = this.chatbotPanelElement.getBoundingClientRect().width;
    document.body.classList.add('chatbot-resizing');
  }

  @HostListener('document:mousemove', ['$event'])
  resizeChatbot(event: MouseEvent): void {
    if (!this.isResizingChatbot || !this.chatbotPanelElement) return;

    const maxWidth = Math.max(this.chatbotMinWidth, window.innerWidth * 0.8);
    const requestedWidth = this.chatbotStartWidth + (this.chatbotStartX - event.clientX);
    const width = Math.max(this.chatbotMinWidth, Math.min(requestedWidth, maxWidth));

    this.chatbotPanelElement.style.width = `${Math.round(width)}px`;
  }

  @HostListener('document:mouseup')
  stopChatbotResize(): void {
    if (!this.isResizingChatbot) return;

    this.isResizingChatbot = false;
    document.body.classList.remove('chatbot-resizing');

    if (this.chatbotPanelElement) {
      const width = Math.round(this.chatbotPanelElement.getBoundingClientRect().width);
      localStorage.setItem('dymer.chatbot.width', String(width));
    }

    this.chatbotPanelElement = null;
  }

  resetChatbotWidth(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const container = (event.currentTarget as HTMLElement).closest('.magicai-container') as HTMLElement | null;
    const overlayPane = container?.closest('.cdk-overlay-pane') as HTMLElement | null;
    const panel = overlayPane || container;

    if (panel) panel.style.width = `${this.chatbotDefaultWidth}px`;
    localStorage.removeItem('dymer.chatbot.width');
  }

  onPromptKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey) return;

    event.preventDefault();
    if (!this.isLoading && this.zeroFormGroup.valid) {
      this.sendMessage();
    }
  }

  clearPromptInput(): void {
    this.messages = [];
  }

  onAgentChange(agent: AiAgent) {
    this.selectedAgent.set(agent);
    console.log('Agente selezionato:', agent);
    this.messages = []; 
    this.checkCurrentAgentStatus(agent._id!);
  }

  checkCurrentAgentStatus(id: string) {
    this.agentStatus.set('checking');
    this.agentService.checkStatus(id).subscribe({
      next: (res) => this.agentStatus.set(res.status as any),
      error: () => this.agentStatus.set('offline')
    });
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

  copyResponse(message: Msg): void {
    const text = message.rawText || this.toPlainText(String(message.text || ''));
    if (!text) return;

    const onSuccess = () => {
      message.responseCopied = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        message.responseCopied = false;
        this.cdr.detectChanges();
      }, 1800);
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(onSuccess)
        .catch(() => this.fallbackCopyResponse(text, onSuccess));
    } else {
      this.fallbackCopyResponse(text, onSuccess);
    }
  }

  private fallbackCopyResponse(text: string, onSuccess: () => void): void {
    const ta = document.createElement('textarea');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      if (document.execCommand('copy')) onSuccess();
    } catch (error) {
      console.error('copy response failed', error);
    } finally {
      document.body.removeChild(ta);
    }
  }

  private toPlainText(value: string): string {
    const withBreaks = value
      .replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n');
    const container = document.createElement('div');
    container.innerHTML = withBreaks;
    return (container.textContent || container.innerText || '')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  private formatAssistantResponse(value: string): string {
    const lines = this.toPlainText(value).split('\n');
    const html: string[] = [];

    for (const originalLine of lines) {
      const trimmed = originalLine.trim();
      if (!trimmed) continue;
      const safe = this.escapeHtml(trimmed);

      if (trimmed.startsWith('Criteri applicati:')) {
        const criteria = trimmed.substring('Criteri applicati:'.length).trim();
        html.push(`<section class="answer-summary"><span class="answer-eyebrow">Criteri applicati</span><strong>${this.escapeHtml(criteria)}</strong></section>`);
      } else if (trimmed.startsWith('Entity sorgente trovate:')) {
        const count = trimmed.substring('Entity sorgente trovate:'.length).trim();
        html.push(`<div class="answer-count"><span>${this.escapeHtml(count)}</span> entity sorgente trovate</div>`);
      } else if (/^(Dettaglio completo per|Corrispondenze per)/i.test(trimmed)) {
        html.push(`<h3 class="answer-section-title">${safe}</h3>`);
      } else if (/^Nessuna entity/i.test(trimmed)) {
        html.push(`<div class="answer-notice">${safe}</div>`);
      } else if (/^\s{2,}\d+\.\s+/.test(originalLine)) {
        html.push(`<div class="answer-related-item">${safe.replace(/^\d+\.\s+/, '')}</div>`);
      } else if (/^\d+\.\s+/.test(trimmed)) {
        html.push(`<h3 class="answer-entity-title">${safe}</h3>`);
      } else if (/^Entity collegate \(\d+\):/i.test(trimmed)) {
        html.push(`<h4 class="answer-related-title">${safe}</h4>`);
      } else {
        const metadataMatch = trimmed.match(/^(Catalogo|ID|Origine corrispondenza|Stato):\s*(.*)$/i);
        if (metadataMatch) {
          const label = this.escapeHtml(metadataMatch[1]);
          const metadataValue = this.escapeHtml(metadataMatch[2] || 'Non disponibile');
          const active = metadataMatch[1].toLowerCase() === 'stato' && metadataMatch[2] === '1' ? ' is-active' : '';
          html.push(`<div class="answer-meta"><span>${label}</span><code class="${active}">${metadataValue}</code></div>`);
        } else if (/^Descrizione:/i.test(trimmed)) {
          html.push(`<p class="answer-description">${this.escapeHtml(trimmed.substring(trimmed.indexOf(':') + 1).trim())}</p>`);
        } else {
          html.push(`<p class="answer-paragraph">${safe}</p>`);
        }
      }
    }
    return html.join('');
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

sendMessage_Original() {
  const inputControl = this.zeroFormGroup.get('userInput');
  const messageToSend = inputControl?.value?.trim();

  const modelControl = this.zeroFormGroup.get('model');
  const currentAgent = this.selectedAgent();
  
  const selectedModel = modelControl?.value || 'llama3.1'

  const model = this.zeroFormGroup.get('model')?.value;
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

  this.aiService.streamChat(messageToSend, currentAgent!)
    .pipe(finalize(() => {
      const botMessage = this.messages[botMessageIndex];
      const { text, code, language } = this.extractCode(fullResponse);

      botMessage.text = text;
        botMessage.rawText = this.toPlainText(text);
        botMessage.formattedText = this.formatAssistantResponse(text);
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
sendMessage() {
  const inputControl = this.zeroFormGroup.get('userInput');
  const messageToSend = inputControl?.value?.trim();
  const agent = this.selectedAgent();

  if (!messageToSend || this.zeroFormGroup.invalid || !agent) {
    if (!agent) this.toast.warning('Seleziona un agente AI per iniziare');
    return;
  }

  this.isLoading = true;
  inputControl?.disable();

  this.messages.push({ from: 'user', text: messageToSend, time: new Date().toISOString() });

  const botMessageIndex = this.messages.length;
  this.messages.push({
    from: 'bot',
    text: '',
    time: new Date().toISOString(),
    code: '',
    codeLanguage: ''
  });

  inputControl?.reset();
  let fullResponse = '';
  let requestFailed = false;

  this.aiService.streamChat(messageToSend, agent)
    .pipe(
      finalize(() => {
        const botMessage = this.messages[botMessageIndex];

        if (!requestFailed) {
          const { text, code, language } = this.extractCode(fullResponse);
          botMessage.text = text;

        botMessage.rawText = this.toPlainText(text);
        botMessage.formattedText = this.formatAssistantResponse(text);
          if (code) {
            botMessage.code = code;
            botMessage.codeLanguage = language;
          }
        }

        this.isLoading = false;
        inputControl?.enable();
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: chunk => {
        fullResponse += chunk;
        this.messages[botMessageIndex].text = fullResponse;
        this.cdr.detectChanges();
      },
      error: error => {
        requestFailed = true;
        const message =
          error instanceof Error && error.message
            ? error.message
            : 'Non è stato possibile completare la richiesta.';

        console.error('Errore durante la chat:', error);
        this.messages[botMessageIndex].text = message;
        this.toast.warning(message);
        this.cdr.detectChanges();
      }
    });
}

}