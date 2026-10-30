import { Component, OnInit, inject, signal, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MtxGridModule, MtxGridColumn } from '@ng-matero/extensions/grid';
import { DashboardService } from './dashboard.service';
import { LogsService } from '../logs/logs.service';
import { CustomizerService } from '../../theme/customizer/customizer.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { te } from 'date-fns/locale';


import { AiAgentsService } from '../services/aiconfig/ai-agents.service';
import { RelationsDialogComponent } from './dashboard.relations-dialog.component';
interface LogEntry {
  timestamp: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  service: string;
  fullLine?: string;
}


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatTabsModule, MatIconModule, MtxGridModule, TranslateModule, MatDialogModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DashboardService]
})
export class DashboardComponent implements OnInit { 
  private dashboardSrv = inject(DashboardService);
  private translate = inject(TranslateService);
  private logsService = inject(LogsService);
  private aiAgentsService = inject(AiAgentsService);
  private customizerService = inject(CustomizerService);
  private dialog = inject(MatDialog);

  // Stato reattivo
  stats = signal({ indexes: 0, models: 0, templates: 0, entities: 0, relations: 0, agents: 0 });
  systemInfo = signal({ uuid: '', version: '', updated: '' });
  aiAgents = signal<any[]>([]);
  latestEntities = signal<any[]>([]);
  relationsData = signal<any>(null);
  allCountRelations = signal(0);

  // Widget Microservizi
  services = signal<{ name: string; status: string; latency: string }[]>([]);

  latestData = signal<any[]>([]);
  activeTab: string = 'lastEntities';
 
  isLoadingLogs = signal(false);
 // --- STATO LOG (SIGNAL TIPIZZATI) ---
  currentLogFile = signal<string>('webserver');
  
  // Specifichiamo <LogEntry[]> invece di lasciare l'array vuoto generico
  allLogs = signal<LogEntry[]>([]);
  
  logFilters = signal<{ error: boolean; warning: boolean; info: boolean }>({
    error: false,
    warning: false,
    info: false
  });

 
  filteredLogs = computed(() => {
    const filters = this.logFilters();
    const logs = this.allLogs();
    const anyActive = filters.error || filters.warning || filters.info;

    if (!anyActive) {
      return logs;
    }

    return logs.filter(log => {
      if (log.type === 'error' && filters.error) return true;
      if (log.type === 'warning' && filters.warning) return true;
      if (log.type === 'info' && filters.info) return true;
      return false;
    });
  });

   
//  columns: MtxGridColumn[] = [
//     { header: 'Index/Source', field: '_index', width: '160px', class: 'font-mono text-[10px] text-slate-400' },
//     { header: 'Title', field: '_source.title', minWidth: 200, formatter: (data) => data._source?.title || 'n/a' },
//     { header: 'TypStatuse', field: '_source.type', type: 'tag', tag: { 'document': { text: 'DOC', color: 'blue-100' }, 'ai_gen': { text: 'AI', color: 'purple-100' } } },
//     { header: 'Created', field: '_source.properties.created', type: 'date', width: '150px' }
//   ];
columns: MtxGridColumn[] = [
  { 
    header: 'Index', 
    field: '_index', 
    width: '130px',
    class: 'font-mono text-xs text-slate-500' // Stile Vercel: font mono per dati tecnici
  },
  { 
    header: 'Entity Title', 
    field: '_source.title', 
    minWidth: 200,
    formatter: (data) => data._source?.title || 'No title'
  },
  { 
    header: 'Owner', 
    field: '_source.properties.owner.uid', 
    minWidth: 200,
    formatter: (data) => data._source?.properties?.owner?.uid || 'No owner'
  },
   
  { 
    header: 'Creation date', 
    field: '_source.properties.created', 
    type: 'date',
    typeParameter: { format: 'dd/MM/yyyy HH:mm' }
  },
  {
    header: 'Actions',
    field: 'actions',
    type: 'button',
    buttons: [
      // { icon: 'edit', tooltip: 'Edit', click: (record) => this.editEntity(record) },
      // { icon: 'code', tooltip: 'View JSON', click: (record) => this.viewJson(record) }
    ]
  }
];


  switchTab(tabName: string) {
    this.activeTab = tabName;
  }

  ngOnInit() {
    this.loadAllData();
    this.fetchLogs('all');
  }

  private loadServiceStatuses(): void {
    forkJoin({
      webserver: this.logsService.checkService(),
      entities: this.logsService.checkEntitiesService(),
      dservice: this.logsService.checkServices(),
      forms: this.logsService.checkFormsService(),
      templates: this.logsService.checkTemplatesService(),
      multitenancy: this.logsService.multitenancyState()
    }).subscribe({
      next: ({ webserver, entities, dservice, forms, templates, multitenancy }) => {
        this.services.set([
          { name: 'Webserver', status: this.resolveServiceStatus(webserver), latency: this.resolveUptimeStatus(webserver) },
          { name: 'Entities', status: this.resolveServiceStatus(entities), latency: this.resolveUptimeStatus(entities) },
          { name: 'Service', status: this.resolveServiceStatus(dservice), latency: this.resolveUptimeStatus(dservice) },
          { name: 'Forms', status: this.resolveServiceStatus(forms), latency: this.resolveUptimeStatus(forms) },
          { name: 'Templates', status: this.resolveServiceStatus(templates), latency: this.resolveUptimeStatus(templates) },
          { name: 'Multitenancy', status: this.resolveServiceStatus(multitenancy), latency: '--' }
        ]);
      },
      error: (error) => {
        console.error('Failed to load service statuses', error);
        this.services.set([
          { name: 'Webserver', status: 'offline', latency: '--' },
          { name: 'Entities', status: 'offline', latency: '--' },
          { name: 'Service', status: 'offline', latency: '--' },
          { name: 'Forms', status: 'offline', latency: '--' },
          { name: 'Templates', status: 'offline', latency: '--' },
          { name: 'Multitenancy', status: 'offline', latency: '--' }
        ]);
      }
    });
  }


    private resolveUptimeStatus(response: any): string {
    if (!response) {
      return 'offline';
    }

    const uptimeValue = response.data?.uptime || response.uptime || '';
    const uptimeText = String(uptimeValue).toLowerCase();
    return uptimeValue;
  }
  private resolveServiceStatus(response: any): string {
    if (!response) {
      return 'offline';
    }
     
    const statusValue =
      response.data?.state ||
      response.data?.status ||
      response.state ||
      response.message ||
      response.status ||
      '';

    const statusText = String(statusValue).toLowerCase();
    

    if (statusText.includes('multitenancy state')){
          return response.data.entity === 'true' ? 'online' : 'offline';
     }
    if (statusText.includes('down') || statusText.includes('offline') || statusText.includes('error') || statusText.includes('fail')) {
      return 'offline';
    }
    if (statusText.includes('degrad')) {
      return 'degraded';
    }
    if (statusText.includes('up') || statusText.includes('online') || statusText.includes('run') || statusText.includes('ok') || statusText.includes('success')) {
      return 'online';
    }
    if (response.success === true || response.success === 'true') {
      return 'online';
    }
    return 'offline';
  }

  openRelationsGraph() {
    if (this.relationsData()) {
      this.dialog.open(RelationsDialogComponent, {
        width: '900px',
        data: this.relationsData()
      });
    }
  }

  fetchLogs(serviceName: string) {
    this.currentLogFile.set(serviceName);
    this.isLoadingLogs.set(true);
    this.allLogs.set([]);

    const types: ('info' | 'error' | 'warning')[] = ['info', 'error', 'warning'];
    const services = serviceName === 'all' ? ['webserver', 'entities', 'ai-srv'] : [serviceName];

    const observables = services.flatMap(svc =>
      types.map(type =>
        this.getLogObservable(svc, type).pipe(
          map(res => ({ lines: res.lines || [], type, svc })),
          catchError(() => of({ lines: [], type, svc }))
        )
      )
    );

    forkJoin(observables).subscribe(results => {
      let combined: LogEntry[] = [];
      results.forEach(res => {
        const entries = res.lines.map((l: string) => this.parseLogLine(l, res.type, res.svc));
        combined = [...combined, ...entries];
      });
      this.allLogs.set(combined.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 200));
      this.isLoadingLogs.set(false);
    });
  }

  private getLogObservable(service: string, type: 'info' | 'error' | 'warning') {
    if (service === 'webserver') return this.dashboardSrv.getWebServerLogs(type);
    if (service === 'entities') return this.dashboardSrv.getEntitiesLogs(type);
    if (service === 'ai-srv') return this.dashboardSrv.getAILogs(type);
    return of({ lines: [] });
  }

  toggleFilter(type: 'error' | 'warning' | 'info') {
    this.logFilters.update(f => ({ ...f, [type]: !f[type] }));
  }

private parseLogLine(line: string, fallbackType: 'info' | 'error' | 'warning', serviceName?: string): LogEntry {
  try {
    // 1. Pulizia iniziale da eventuali spazi bianchi
    const rawLine = line.trim();
    if (!rawLine) return this.createEmptyLog(fallbackType, serviceName);

    // 2. Estrazione del Tipo: cerchiamo parole chiave nella riga o usiamo il fallback
    const lowerLine = rawLine.toLowerCase();
    const detectedType = 
      lowerLine.includes('error') ? 'error' : 
      (lowerLine.includes('warn') || lowerLine.includes('warning')) ? 'warning' : 
      lowerLine.includes('info') ? 'info' : fallbackType;
    
    // 3. Estrazione Timestamp (formato ISO: YYYY-MM-DD HH:mm:ss.SSS)
    // Cerchiamo la parte che assomiglia a una data (dopo il primo ': ')
    const parts = rawLine.split(': ');
    let timestamp = 'N/A';
    let message = rawLine;

    if (parts.length >= 2) {
      // Il timestamp di solito è lungo 23-24 caratteri
      timestamp = parts[1].substring(0, 23);
      // Il resto è il messaggio vero e proprio (file.js | function | url...)
      message = parts.slice(2).join(': ');
    }

    return {
      timestamp: timestamp,
      type: detectedType as 'info' | 'error' | 'warning',
      message: message || 'No message content',
      service: serviceName || this.currentLogFile(), // Il servizio che stiamo visualizzando ora
      fullLine: rawLine
    };
  } catch (err) {
    // In caso di errore nel parsing, restituiamo comunque un oggetto valido per non rompere il @for
    console.error("Parsing error for line:", line);
    return {
      timestamp: 'Error',
      type: fallbackType,
      message: line,
      service: 'parser'
    };
  }
}

// Helper per gestire righe vuote
private createEmptyLog(type: any, serviceName?: string): LogEntry {
  return { timestamp: '-', type: type, message: '---', service: serviceName || '' };
}

  getStatusClass(status: string) {
    if (status === 'true' || status === 'online') return 'bg-emerald-500 text-white';
    if (status === 'false' || status === '') return 'bg-red-500 text-white';
    return 'bg-slate-200 text-slate-600';
  }
  
  private loadAllData() {
    forkJoin({
      stats: this.dashboardSrv.allStats(),
      forms: this.dashboardSrv.allForms(),
      info: this.dashboardSrv.info(),
      uuid: this.dashboardSrv.uuid(),
      relation: this.dashboardSrv.allRelations(),
      agents: this.dashboardSrv.getAiAgents(),
      templates: this.dashboardSrv.allTemplates(),
      latest: this.dashboardSrv.latestEntities(['properties.created:desc'])
    }).subscribe(res => {
      
      this.relationsData.set(res.relation);
      let totalCount = 0;
      if (res.relation && res.relation.data) {
        for(let relation of res.relation.data) {
          totalCount += relation.doc_count;
        }
      }
      this.allCountRelations.set(totalCount);
      console.log('Dashboard data loaded:', res);

      let entitiesList = [];
      let countrela = 0;
      entitiesList = res.stats.data.indices;
      let lisrl = entitiesList.filter(function (el:any) {
          return el.index == "entity_relation";
      })[0];
      if (lisrl != undefined) {
          countrela = lisrl["count"];
      }
      this.stats.set({
        indexes: res.stats.data.indices.length,
        models: res.forms.data.length,
        templates: res.templates.data.length,
        entities: res.stats.data.total - countrela,
        agents: res.agents.length, 
        relations: res.relation.data.length
      });
      this.systemInfo.set({
        uuid: res.uuid.data.uuid,
        version: res.info.version,
        updated: res.info.updated
      });
      const normalizedAgents = (res.agents || []).map((agent: any) => ({
        ...agent,
        isActive: this.normalizeAgentActive(agent),
      }));

      this.aiAgents.set(normalizedAgents);
      this.loadAgentStatuses(normalizedAgents);
      this.latestEntities.set(res.latest.data);
      this.loadServiceStatuses();
      this.latestData.set(res.latest.data);
    });
  }
  
  private loadAgentStatuses(agents: any[]): void {
    if (!agents || agents.length === 0) {
      return;
    }

    const statusObservables = agents.map((agent: any) => {
      const agentId = this.resolveAgentId(agent);
      if (!agentId) {
        return of({ _id: undefined, serviceStatus: 'offline' });
      }

      // Usa il service specifico per OLLAMA, altrimenti quello degli agenti
      const statusObservable = agent.provider === 'ollama'
        ? this.customizerService.checkStatus().pipe(
            map((res: any) => ({ _id: agentId, serviceStatus: res.success ? 'online' : 'offline' })),
            catchError(() => of({ _id: agentId, serviceStatus: 'offline' }))
          )
        : this.aiAgentsService.checkStatus(agentId).pipe(
            map((res: any) => ({ _id: agentId, serviceStatus: this.normalizeAgentServiceStatus(res.status) })),
            catchError(() => of({ _id: agentId, serviceStatus: 'offline' }))
          );

      return statusObservable;
    });

    forkJoin(statusObservables).subscribe((statuses: any[]) => {
      const updatedAgents = (this.aiAgents() || []).map(agent => {
        const agentId = this.resolveAgentId(agent);
        const match = agentId ? statuses.find(s => s._id === agentId) : null;
        return {
          ...agent,
          serviceStatus: match ? match.serviceStatus : (agent.isActive ? 'online' : 'offline')
        };
      });
      this.aiAgents.set(updatedAgents);
    });
  }

  private resolveAgentId(agent: any): string | undefined {
    return agent?._id || agent?.id;
  }

  private normalizeAgentServiceStatus(status: any): string {
    const statusText = String(status || '').toLowerCase();
    if (statusText.includes('down') || statusText.includes('offline') || statusText.includes('error') || statusText.includes('fail')) {
      return 'offline';
    }
    if (statusText.includes('degrad')) {
      return 'degraded';
    }
    if (statusText.includes('up') || statusText.includes('online') || statusText.includes('run') || statusText.includes('ok') || statusText.includes('success') || statusText.includes('active')) {
      return 'online';
    }
    return 'offline';
  }

  private normalizeAgentActive(agent: any): boolean {
    if (!agent) {
      return false;
    }

    if (typeof agent.isActive === 'boolean') {
      return agent.isActive;
    }

    const status = String(agent.status || '').toLowerCase();
    if (status.includes('online') || status.includes('up') || status.includes('run') || status.includes('active')) {
      return true;
    }

    return false;
  }
   
}