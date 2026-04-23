import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AiAgentsService } from './ai-agents.service';
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

@Component({
  selector: 'app-ai-config',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, PageHeaderComponent, MtxButtonModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatListModule, MatSlideToggleModule, MatProgressBarModule
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
    // Reazione al cambio provider per validazione dinamica
    this.agentForm.get('provider')?.valueChanges.subscribe(val => this.adjustValidators(val as AiProvider));
  }

  loadAgents() {
    this.isLoading.set(true);
    this.agentService.getAll().subscribe({
      next: (data) => this.agents.set(data),
      error: () => this.toast.error('Errore nel caricamento agenti'),
      complete: () => this.isLoading.set(false)
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

  selectAgent(agent: AiAgent) {
    this.selectedId.set(agent._id!);
    this.agentForm.patchValue(agent);
  }

  reset() {
    this.selectedId.set(null);
    this.agentForm.reset({ provider: 'ollama', isActive: true, systemPrompt: 'Sei un assistente AI esperto.' });
  }

  save() {
    if (this.agentForm.invalid) return;
    this.isSaving.set(true);
    const data = this.agentForm.value as AiAgent;
    
    const request = this.selectedId() 
      ? this.agentService.update(this.selectedId()!, data)
      : this.agentService.create(data);

    request.subscribe({
      next: () => {
        this.toast.success('Agente salvato');
        this.loadAgents();
        this.reset();
      },
      error: () => this.toast.error('Errore salvataggio'),
      complete: () => this.isSaving.set(false)
    });
  }
}