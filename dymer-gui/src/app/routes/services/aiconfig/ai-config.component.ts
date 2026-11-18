import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  AiAgentsService,
  McpAccess,
  McpServerInfo,
  McpTool
} from './ai-agents.service';
import { AiAgent, AiProvider } from '../models/ai-agent.model';
import { ToastrService } from 'ngx-toastr';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MtxButtonModule } from '@ng-matero/extensions/button';
import { PageHeaderComponent } from '@shared';

type AgentWithMcp = AiAgent & { mcpAccess?: McpAccess[] };

@Component({
  selector: 'app-ai-config',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    MtxButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSlideToggleModule,
    MatProgressBarModule
  ],
  templateUrl: './ai-config.component.html',
  styleUrls: ['./ai-config.component.scss']
})
export class AiConfigComponent implements OnInit {
  private fb = inject(FormBuilder);
  private agentService = inject(AiAgentsService);
  private toast = inject(ToastrService);

  agents = signal<AiAgent[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  selectedId = signal<string | null>(null);

  mcpEnabled = signal(false);
  mcpLoading = signal(false);
  mcpError = signal<string | null>(null);
  mcpServer = signal<McpServerInfo | null>(null);
  mcpTools = signal<McpTool[]>([]);
  selectedMcpTools = signal<string[]>([]);

  allMcpToolsSelected = computed(() => {
    const tools = this.mcpTools();
    return tools.length > 0 && this.selectedMcpTools().length === tools.length;
  });

  agentForm = this.fb.group({
    name: ['', [Validators.required]],
    provider: ['ollama' as AiProvider, Validators.required],
    model: ['', Validators.required],
    settings: this.fb.group({
      baseUrl: [''],
      apiKey: ['']
    }),
    systemPrompt: ['', Validators.required],
    isActive: [true]
  });

  ngOnInit() {
    this.loadAgents();
    this.loadMcpTools();

    this.agentForm.get('provider')?.valueChanges.subscribe(value => {
      this.adjustValidators(value as AiProvider);
    });

    this.adjustValidators(this.agentForm.get('provider')?.value as AiProvider);
  }

  loadAgents() {
    this.isLoading.set(true);
    this.agentService.getAll().subscribe({
      next: data => this.agents.set(data),
      error: () => {
        this.isLoading.set(false);
        this.toast.error('Errore nel caricamento agenti');
      },
      complete: () => this.isLoading.set(false)
    });
  }

  loadMcpTools() {
    this.mcpLoading.set(true);
    this.mcpError.set(null);

    this.agentService.getMcpTools().subscribe({
      next: response => {
        this.mcpServer.set(response.data.server);
        this.mcpTools.set(response.data.tools || []);
        this.removeUnavailableSelections();
      },
      error: error => {
        this.mcpError.set(
          error?.error?.message || 'Server MCP non raggiungibile'
        );
        this.mcpServer.set(null);
        this.mcpTools.set([]);
        this.mcpLoading.set(false);
      },
      complete: () => this.mcpLoading.set(false)
    });
  }

  adjustValidators(provider: AiProvider) {
    const settings = this.agentForm.get('settings');

    if (provider === 'openai') {
      settings?.get('apiKey')?.setValidators(Validators.required);
      settings?.get('baseUrl')?.clearValidators();
    } else {
      settings?.get('baseUrl')?.setValidators(Validators.required);
      settings?.get('apiKey')?.clearValidators();
    }

    settings?.get('apiKey')?.updateValueAndValidity();
    settings?.get('baseUrl')?.updateValueAndValidity();
  }

  deleteAgent(id: string | undefined) {
    if (!id) return;

    if (confirm('Sei sicuro di voler eliminare questa configurazione?')) {
      this.agentService.delete(id).subscribe({
        next: () => {
          this.toast.success('Deleted Agent');
          this.loadAgents();
        },
        error: error => console.error('Errore eliminazione:', error)
      });
    }
  }

  selectAgent(agent: AiAgent) {
    const agentWithMcp = agent as AgentWithMcp;
    const dymerAccess = (agentWithMcp.mcpAccess || []).find(
      access => access.serverId === 'dymer' && access.enabled !== false
    );

    this.selectedId.set(agent._id!);
    this.agentForm.patchValue(agent);
    this.mcpEnabled.set(Boolean(dymerAccess));
    this.selectedMcpTools.set([...(dymerAccess?.allowedTools || [])]);
    this.removeUnavailableSelections();
  }

  reset() {
    this.selectedId.set(null);
    this.agentForm.reset({
      provider: 'ollama',
      isActive: true,
      systemPrompt: 'Sei un assistente AI esperto.',
      settings: {
        baseUrl: '',
        apiKey: ''
      }
    });
    this.mcpEnabled.set(false);
    this.selectedMcpTools.set([]);
  }

  toggleMcp(enabled: boolean) {
    this.mcpEnabled.set(enabled);

    if (!enabled) {
      this.selectedMcpTools.set([]);
      return;
    }

    if (this.mcpTools().length === 0 && !this.mcpLoading()) {
      this.loadMcpTools();
    }
  }

  isToolSelected(toolName: string): boolean {
    return this.selectedMcpTools().includes(toolName);
  }

  toggleTool(toolName: string, checked: boolean) {
    const selected = new Set(this.selectedMcpTools());

    if (checked) {
      selected.add(toolName);
    } else {
      selected.delete(toolName);
    }

    this.selectedMcpTools.set([...selected]);
  }

  toggleAllTools(checked: boolean) {
    this.selectedMcpTools.set(
      checked ? this.mcpTools().map(tool => tool.name) : []
    );
  }

  trackTool(_index: number, tool: McpTool): string {
    return tool.name;
  }

  save() {
    if (this.agentForm.invalid) {
      this.agentForm.markAllAsTouched();
      return;
    }

    if (this.mcpEnabled() && this.selectedMcpTools().length === 0) {
      this.toast.warning('Seleziona almeno un tool MCP oppure disabilita MCP');
      return;
    }

    this.isSaving.set(true);

    const mcpAccess: McpAccess[] = this.mcpEnabled()
      ? [
          {
            serverId: this.mcpServer()?.id || 'dymer',
            enabled: true,
            allowedTools: [...this.selectedMcpTools()]
          }
        ]
      : [];

    const data = {
      ...this.agentForm.getRawValue(),
      mcpAccess
    } as AgentWithMcp;

    const request = this.selectedId()
      ? this.agentService.update(this.selectedId()!, data as AiAgent)
      : this.agentService.create(data as AiAgent);

    request.subscribe({
      next: () => {
        this.toast.success('Agente salvato');
        this.loadAgents();
        this.reset();
      },
      error: error => {
        this.isSaving.set(false);
        this.toast.error(error?.error?.message || 'Errore salvataggio');
      },
      complete: () => this.isSaving.set(false)
    });
  }

  private removeUnavailableSelections() {
    const available = new Set(this.mcpTools().map(tool => tool.name));
    this.selectedMcpTools.set(
      this.selectedMcpTools().filter(toolName => available.has(toolName))
    );
  }
}
