import { ChangeDetectorRef, Component, OnInit, TemplateRef, inject, signal } from '@angular/core';
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
};
declare function html2json(html: string): any;

(window as any).DEBUG = false;
@Component({
  selector: 'app-customizer',
  templateUrl: './customizer.component.html',
  styleUrl: './customizer.component.scss',
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

    this.isChatbotOpen = true; // Imposta lo stato su "aperto"
    this.drawerRef = this.drawer.open(templateRef, {
      position: 'right',
      width: '400px', // Puoi aggiustare la larghezza
    });

    // Ascolta l'evento di chiusura per resettare lo stato
    this.drawerRef.afterDismissed().subscribe(() => {
      this.isChatbotOpen = false;
    });
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
  
  // 1. Recuperiamo l'agente dal Signal
  const agent = this.selectedAgent();

  // 2. Validazione Senior: controlliamo messaggio, stato del form e presenza dell'agente
  if (!messageToSend || this.zeroFormGroup.invalid || !agent) {
    if (!agent) this.toast.warning('Seleziona un agente AI per iniziare');
    return;
  }

  // Prepariamo l'interfaccia per lo streaming
  this.isLoading = true;
  inputControl?.disable();

  // Aggiungiamo il messaggio dell'utente alla lista
  this.messages.push({ 
    from: 'user', 
    text: messageToSend, 
    time: new Date().toISOString() 
  });

  // Creiamo il segnaposto per la risposta del bot (sarà popolata dallo stream)
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

  // Chiamata al service passando l'agente completo (ID, Provider, Prompt, etc.)
  this.aiService.streamChat(messageToSend, agent)
    .pipe(
      finalize(() => {
        // Logica di post-processing (estrazione codice) a fine stream
        const botMessage = this.messages[botMessageIndex];
        const { text, code, language } = this.extractCode(fullResponse);

        botMessage.text = text;
        if (code) {
          botMessage.code = code;
          botMessage.codeLanguage = language;
        }

        this.isLoading = false;
        inputControl?.enable();
        this.cdr.detectChanges(); // Essenziale per aggiornare i componenti CodeMirror/UI
      })
    )
    .subscribe({
      next: (chunk) => {
        // Accumuliamo il chunk di testo pulito che arriva da Node
        fullResponse += chunk;
        // Aggiornamento real-time del testo nella bolla della chat
        this.messages[botMessageIndex].text = fullResponse;
        this.cdr.detectChanges(); // Opzionale, ma consigliato per fluidità visiva
      },
      error: (err) => {
        console.error('Errore durante lo streaming:', err);
        this.messages[botMessageIndex].text = "Errore di comunicazione con l'agente.";
        this.isLoading = false;
        inputControl?.enable();
      }
    });
}






}
