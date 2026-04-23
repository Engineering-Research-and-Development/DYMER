import { Component, OnInit, inject, signal, ChangeDetectionStrategy,computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MtxGridModule, MtxGridColumn } from '@ng-matero/extensions/grid';
import { DashboardService } from './dashboard.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { te } from 'date-fns/locale';


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
  imports: [CommonModule, MatButtonModule, MatCardModule, MatTabsModule, MatIconModule, MtxGridModule, TranslateModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DashboardService]
})
export class DashboardComponent implements OnInit {
  private dashboardSrv = inject(DashboardService);
  private translate = inject(TranslateService);

  // Stato reattivo
  stats = signal({ indexes: 0, models: 0, templates: 0, entities: 0, relations: 0, agents: 0 });
  systemInfo = signal({ uuid: '', version: '', updated: '' });
  aiAgents = signal<any[]>([]);
  latestEntities = signal<any[]>([]);

  // Widget Microservizi
  services = signal([
    { name: 'API Gateway', status: 'online', latency: '24ms' },
    { name: 'Entity Engine', status: 'online', latency: '110ms' },
    { name: 'Search Service', status: 'degraded', latency: '850ms' },
    { name: 'Identity Provider', status: 'online', latency: '45ms' }
  ]);

  latestData = signal<any[]>([]);
  activeTab: string = 'lastEntities';
 
 // --- STATO LOG (SIGNAL TIPIZZATI) ---
  currentLogFile = signal<string>('webserver');
  
  // Specifichiamo <LogEntry[]> invece di lasciare l'array vuoto generico
  allLogs = signal<LogEntry[]>([]);
  
  logFilters = signal<{ error: boolean; warning: boolean; info: boolean }>({
    error: true,
    warning: true,
    info: true
  });

 
  filteredLogs = computed(() => {
    const filters = this.logFilters();
    return this.allLogs().filter(log => {
      if (log.type === 'error' && !filters.error) return false;
      if (log.type === 'warning' && !filters.warning) return false;
      if (log.type === 'info' && !filters.info) return false;
      return true;
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
    header: 'Sorgente (Index)', 
    field: '_index', 
    width: '130px',
    class: 'font-mono text-xs text-slate-500' // Stile Vercel: font mono per dati tecnici
  },
  { 
    header: 'Titolo Entità', 
    field: '_source.title', 
    minWidth: 200,
    formatter: (data) => data._source?.title || 'Senza Titolo'
  },
  { 
    header: 'Tipo', 
    field: '_source.type', 
    type: 'tag',
    tag: {
      // Mappatura dinamica opzionale o fissa
      'user': { text: 'Utente', color: 'blue-100' },
      'document': { text: 'Doc', color: 'purple-100' }
    }
  },
  { 
    header: 'Data Creazione', 
    field: '_source.properties.created', 
    type: 'date',
    typeParameter: { format: 'dd/MM/yyyy HH:mm' }
  },
  {
    header: 'Azioni',
    field: 'actions',
    type: 'button',
    buttons: [
      // { icon: 'edit', tooltip: 'Modifica', click: (record) => this.editEntity(record) },
      // { icon: 'code', tooltip: 'Vedi JSON', click: (record) => this.viewJson(record) }
    ]
  }
];


  switchTab(tabName: string) {
    this.activeTab = tabName;
  }

  ngOnInit() {
    this.loadAllData();
    this.fetchLogs('webserver'); // Caricamento iniziale dei log
  }

 fetchLogs(serviceName: string) {
    this.currentLogFile.set(serviceName);
    this.dashboardSrv.getWebServerLogs().subscribe({
      next: (res: any) => {
        const formattedLogs: LogEntry[] = res.lines.map((line: string) => {
          const typePart = line.split(':')[0].toLowerCase();
          const type = typePart.includes('error') ? 'error' : 
                       typePart.includes('warn') ? 'warning' : 'info';
          
          const parts = line.split(': ');
          const timestamp = parts[1] ? parts[1].substring(0, 23) : 'N/A';
          const message = line.split(': ').slice(2).join(': ');

          return {
            timestamp,
            type,
            message,
            service: serviceName
          };
        });
        this.allLogs.set(formattedLogs);
      }
    });
  }

  toggleFilter(type: 'error' | 'warning' | 'info') {
  // Aggiorniamo lo stato del pillar
  this.logFilters.update(f => ({ ...f, [type]: !f[type] }));

  // Se l'utente ha attivato il pillar, carichiamo i dati relativi
  if (this.logFilters()[type]) {
    this.dashboardSrv.getWebServerLogs(type).subscribe(res => {
      const newLogs = res.lines.map((line: string) => this.parseLogLine(line, type));
      
      // Uniamo i nuovi log a quelli esistenti e li ordiniamo per data
      this.allLogs.update(current => [...current, ...newLogs].sort((a,b) => 
        b.timestamp.localeCompare(a.timestamp)
      ).slice(0, 100)); // Teniamo solo gli ultimi 100 totali
    });
  }
}

private parseLogLine(line: string, fallbackType: 'info' | 'error' | 'warning'): LogEntry {
  try {
    // 1. Pulizia iniziale da eventuali spazi bianchi
    const rawLine = line.trim();
    if (!rawLine) return this.createEmptyLog(fallbackType);

    // 2. Estrazione del Tipo (quello che c'è prima del primo ':')
    // Se la riga non ha ':', usiamo il fallbackType passato dalla chiamata API
    const hasColon = rawLine.includes(':');
    const typePart = hasColon ? rawLine.split(':')[0].toLowerCase() : fallbackType;
    
    const type: 'info' | 'error' | 'warning' = 
      typePart.includes('error') ? 'error' : 
      (typePart.includes('warn') || typePart.includes('warning')) ? 'warning' : 'info';

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
      type: type,
      message: message || 'No message content',
      service: this.currentLogFile(), // Il servizio che stiamo visualizzando ora
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
private createEmptyLog(type: any): LogEntry {
  return { timestamp: '-', type: type, message: '---', service: '' };
}

  getStatusClass(status: string) {
    const s = status?.toLowerCase();
    if (s === 'running' || s === 'online') return 'bg-emerald-500 text-white';
    if (s === 'error' || s === 'offline') return 'bg-red-500 text-white';
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
      console.log('Dashboard data loaded:', res);
      this.stats.set({
        indexes: res.stats.data.indices.length,
        models: res.forms.data.length,
        templates: res.templates.data.length,
        entities: res.stats.total,
        agents: res.agents.length, 
        relations: res.relation.data.length
      });
      this.systemInfo.set({
        uuid: res.uuid.data.uuid,
        version: res.info.version,
        updated: res.info.updated
      });
      this.aiAgents.set(res.agents);
      this.latestEntities.set(res.latest.data);
      this.latestData.set(res.latest.data);
    });
  }
   
}