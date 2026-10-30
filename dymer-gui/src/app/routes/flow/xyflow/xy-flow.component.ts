import { Component, ElementRef, signal, computed, viewChild, HostListener } from '@angular/core';
import { XYNode, XYEdge } from './types';
import { XyNodeComponent } from './xy-node.component';
import { routeOrthogonalAvoidObstacles } from './edge-router';

@Component({
  selector: 'xy-flow',
  imports: [XyNodeComponent],
  template: `
    <div #container class="relative w-full h-full overflow-hidden bg-[#fafafa] select-none outline-none"
         tabindex="0"
         [class.cursor-grab]="!isPanning && spacebarPressed()"
         [class.cursor-grabbing]="isPanning"
         [class.cursor-default]="!isPanning && !spacebarPressed()"
         (mousedown)="onPanStart($event)"
         (mousemove)="onMouseMove($event)"
         (window:mouseup)="onMouseUp()"
         (dragover)="onDragOver($event)"
         (drop)="onDrop($event)"
         (wheel)="onWheel($event)">

      <!-- Grid Background / Trama a punti -->
      <div class="absolute inset-0 pointer-events-none"
           [style.background-image]="'radial-gradient(#d6d3d1 1px, transparent 0)'"
           [style.background-position]="transform().x + 'px ' + transform().y + 'px'"
           [style.background-size]="(24 * transform().zoom) + 'px ' + (24 * transform().zoom) + 'px'">
      </div>

      <!-- Transform Layer (Zoom & Pan) -->
      <div class="absolute origin-top-left inset-0 will-change-transform pointer-events-none"
           [style.transform]="'translate(' + transform().x + 'px, ' + transform().y + 'px) scale(' + transform().zoom + ')'">

           <!-- Edges (SVG Lines) -->
           <svg class="overflow-visible absolute inset-0 pointer-events-none" style="z-index: 5;">
              @for(edge of edgePaths(); track edge.id) {
                 <path [attr.d]="edge.path" 
                       fill="none" stroke="#a8a29e" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
              }
              <!-- Drag-to-connect active edge -->
              @if(conn().sourceNodeId) {
                 <path [attr.d]="getTempEdgePath()" 
                       fill="none" class="stroke-stone-400 stroke-2 pointer-events-none" 
                       stroke-linejoin="round"
                       stroke-dasharray="6,4" stroke-linecap="round" />
              }
           </svg>

           <!-- Nodes Layer -->
           <div class="absolute inset-0 z-10 pointer-events-none">
             <div class="pointer-events-auto">
               @for(node of nodes(); track node.id) {
                  <xy-node [node]="node" [zoom]="transform().zoom"
                     (nodeDrag)="handleNodeDrag($event)"
                     (connectionStart)="handleConnectionStart($event)"
                     (connectionEnd)="handleConnectionEnd($event)"
                     (dataChange)="handleNodeDataChange($event)">
                  </xy-node>
               }
             </div>
           </div>
      </div>
      
      <!-- Overlay UI Controls -->
      <div class="absolute bottom-6 left-6 flex flex-col gap-2 z-50 bg-white p-3 border border-stone-200 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
         <div class="flex justify-between items-center mb-1 border-b border-stone-100 pb-2">
            <div class="text-xs font-bold uppercase tracking-widest text-stone-600">Controls</div>
         </div>
         
         <div class="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] text-stone-500 font-medium mb-2">
            <div class="flex justify-between gap-4"><span>Add Node:</span> <kbd class="font-mono bg-stone-100 px-1 py-0.5 rounded text-stone-800">A</kbd></div>
            <div class="flex justify-between gap-4"><span>Save:</span> <kbd class="font-mono bg-stone-100 px-1 py-0.5 rounded text-stone-800">Ctrl+S</kbd></div>
            <div class="flex justify-between gap-4"><span>Zoom:</span> <kbd class="font-mono bg-stone-100 px-1 py-0.5 rounded text-stone-800">+/-</kbd></div>
            <div class="flex justify-between gap-4"><span>Pan:</span> <kbd class="font-mono bg-stone-100 px-1 py-0.5 rounded text-stone-800">Arrows</kbd></div>
         </div>

         <div class="flex gap-2">
            <button class="w-10 h-10 flex items-center justify-center rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 hover:border-stone-400 text-stone-700 font-bold transition-all shadow-sm" (click)="zoomIn()" title="Zoom In (+)">+</button>
            <button class="w-10 h-10 flex items-center justify-center rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 hover:border-stone-400 text-stone-700 font-bold transition-all shadow-sm" (click)="zoomOut()" title="Zoom Out (-)">-</button>
            <button class="w-auto px-4 h-10 flex items-center justify-center rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 hover:border-stone-400 text-stone-700 font-semibold text-sm transition-all shadow-sm" (click)="fitView()" title="Center Canvas">Fit</button>
            <button class="w-auto px-4 h-10 flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-700 font-semibold text-sm transition-all shadow-sm ml-1" (click)="addNode()">Add Node</button>
         </div>
      </div>

      <!-- Toast Notification -->
      @if(toastMessage()) {
        <div class="absolute top-6 right-6 bg-stone-900 text-white px-5 py-3 rounded-lg shadow-2xl font-medium text-sm flex items-center gap-3 z-50 animate-bounce">
          <span class="material-icons text-emerald-400 text-[18px]">check_circle</span>
          {{ toastMessage() }}
        </div>
      }
    </div>
  `
})
export class XyFlowComponent {
  containerRef = viewChild.required<ElementRef<HTMLDivElement>>('container');

  // Stato: nodi ed edges iniziali
  nodes = signal<XYNode[]>([
    { id: '1', width: 260, data: { label: 'Entity Form Webhook', action: 'Listen POST /webhook', dataSource: 'Form Payload', output: 'Raw Entity JSON', color: '#8b5cf6', provider: 'API Gateway' }, position: { x: 50, y: 200 } },
    { id: '2', width: 260, data: { label: 'Conditional Switch', action: 'Evaluate Rules', dataSource: 'Raw Entity JSON', output: 'Routed Payload', color: '#64748b', jsonIndex: 'data.role == "admin"' }, position: { x: 400, y: 200 } },
    { id: '3', width: 260, data: { label: 'MQTT Publisher', action: 'Publish Topic', dataSource: 'Routed Payload', output: 'ACK Message', color: '#ff0055', provider: 'Mosquitto' }, position: { x: 800, y: -20 } },
    { id: '4', width: 260, data: { label: 'Qdrant Embed & Upsert', action: 'Vectorize Info', dataSource: 'Entity.text', output: 'Vector ID', color: '#e11d48', provider: 'Qdrant DB' }, position: { x: 800, y: 140 } },
    { id: '5', width: 260, data: { label: 'AI Data Processor', action: 'Analyze Entity', dataSource: 'Raw Entity JSON', output: 'Structured Intel', color: '#c026d3', provider: 'OpenAI / Gemini' }, position: { x: 800, y: 300 } },
    { id: '6', width: 260, data: { label: 'Admin Notifications', action: 'Send Role Alerts', dataSource: 'Target Role "Admin"', output: 'Delivery Status', color: '#f59e0b', provider: 'Firebase Push' }, position: { x: 800, y: 460 } },
  ]);

  edges = signal<XYEdge[]>([
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3' },
    { id: 'e2-4', source: '2', target: '4' },
    { id: 'e2-5', source: '2', target: '5' },
    { id: 'e2-6', source: '2', target: '6' },
  ]);

  // Stato Canvas
  transform = signal({ x: 0, y: 0, zoom: 1 });
  spacebarPressed = signal(false);
  
  isPanning = false;
  private panStartX = 0;
  private panStartY = 0;

  // Edge Paths Calculation for Orthogonal Routing
  edgePaths = computed(() => {
    const ns = this.nodes();
    const es = this.edges();
    const obstacles = ns.map(n => ({x: n.position.x, y: n.position.y, w: n.width ?? 260, h: n.height ?? 140}));
    
    return es.map(edge => {
      const source = ns.find(n => n.id === edge.source);
      const target = ns.find(n => n.id === edge.target);
      if (!source || !target) return {id: edge.id, path: ''};
      
      const sx = source.position.x + (source.width ?? 260);
      const sy = source.position.y + 20;
      const tx = target.position.x;
      const ty = target.position.y + 20;
      
      return {
        id: edge.id,
        path: routeOrthogonalAvoidObstacles(sx, sy, tx, ty, obstacles)
      };
    });
  });
  conn = signal<{sourceNodeId: string | null, startX: number, startY: number, currentX: number, currentY: number}>({
    sourceNodeId: null, startX: 0, startY: 0, currentX: 0, currentY: 0
  });

  toastMessage = signal<string | null>(null);

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    const activeTag = document.activeElement?.tagName;
    const isInputFocused = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

    if (e.code === 'Space' && !isInputFocused) {
      e.preventDefault();
      this.spacebarPressed.set(true);
      return;
    }

    // Shortcut: Save (Ctrl+S / Cmd+S)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      this.saveFlow();
      return;
    }

    // Ignore single-character bindings if user is typing in an input field
    if (isInputFocused) return;

    switch (e.key) {
      case '=': // Support both = and + for zoom in
      case '+':
        this.zoomIn();
        break;
      case '-':
      case '_':
        this.zoomOut();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.transform.update(t => ({ ...t, y: t.y + 50 }));
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.transform.update(t => ({ ...t, y: t.y - 50 }));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.transform.update(t => ({ ...t, x: t.x + 50 }));
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.transform.update(t => ({ ...t, x: t.x - 50 }));
        break;
      case 'a':
      case 'A':
        this.addNode();
        break;
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(e: KeyboardEvent) {
    if (e.code === 'Space') {
      this.spacebarPressed.set(false);
    }
  }

  saveFlow() {
    const dumpedPayload = { nodes: this.nodes(), edges: this.edges() };
    console.log('[XYFlow] Saved Configuration', dumpedPayload);
    this.toastMessage.set('Flow saved successfully! (Check console)');
    setTimeout(() => this.toastMessage.set(null), 3500);
  }

  getFlowState() {
    return { nodes: this.nodes(), edges: this.edges() };
  }

  loadFlowState(state: { nodes: XYNode[], edges: XYEdge[] }) {
    this.nodes.set(state.nodes || []);
    this.edges.set(state.edges || []);
    this.fitView();
  }

  handleNodeDrag(event: { id: string, x: number, y: number }) {
    this.nodes.update(ns => ns.map(n => n.id === event.id ? { ...n, position: { x: event.x, y: event.y } } : n));
  }

  handleNodeDataChange(event: { id: string, data: any }) {
    this.nodes.update(ns => ns.map(n => n.id === event.id ? { ...n, data: { ...n.data, ...event.data } } : n));
  }

  handleConnectionStart(event: { id: string, startX: number, startY: number }) {
    this.conn.set({
      sourceNodeId: event.id,
      startX: event.startX,
      startY: event.startY,
      currentX: event.startX,
      currentY: event.startY
    });
  }

  handleConnectionEnd(event: { id: string }) {
    const sourceId = this.conn().sourceNodeId;
    if (sourceId && sourceId !== event.id) {
      // Create new edge ignoring duplicates
      const newEdgeId = `e${sourceId}-${event.id}`;
      if (!this.edges().some(e => e.source === sourceId && e.target === event.id)) {
        this.edges.update(es => [...es, { id: newEdgeId, source: sourceId, target: event.id }]);
      }
    }
    this.conn.update(c => ({...c, sourceNodeId: null}));
  }

  onPanStart(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const isNode = target.closest('xy-node');
    const isControl = target.closest('.z-50'); // UI controls

    // Prevent panning if interacting with UI controls
    if (isControl) return;

    // Se si clicca su un nodo ma lo spazio non è premuto, non fa pan, fa drag del nodo.
    // Altrimenti, se lo spazio è premuto, il drag pan è prioritario per permettere movimento con la tastiera
    if (isNode && !this.spacebarPressed() && e.button !== 1) {
      return;
    }

    if (e.button !== 0 && e.button !== 1) return; // Permetti pan con left o middle click

    this.isPanning = true;
    this.panStartX = e.clientX - this.transform().x;
    this.panStartY = e.clientY - this.transform().y;
  }

  onMouseMove(e: MouseEvent) {
    if (this.isPanning) {
      this.transform.update(t => ({
        ...t,
        x: e.clientX - this.panStartX,
        y: e.clientY - this.panStartY
      }));
    } else if (this.conn().sourceNodeId) {
      // Aggiorna la route temporanea se stiamo tracciando un collegamento
      const rect = this.containerRef().nativeElement.getBoundingClientRect();
      const cx = (e.clientX - rect.left - this.transform().x) / this.transform().zoom;
      const cy = (e.clientY - rect.top - this.transform().y) / this.transform().zoom;
      this.conn.update(c => ({...c, currentX: cx, currentY: cy}));
    }
  }

  onMouseUp() {
    this.isPanning = false;
    // Annulla il trace della connessione se non finiamo su un edge
    if (this.conn().sourceNodeId) {
      this.conn.update(c => ({...c, sourceNodeId: null}));
    }
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    if (!e.dataTransfer) return;
    try {
       const jData = e.dataTransfer.getData('application/json');
       if (!jData) return;
       const parseData = JSON.parse(jData);
       
       const rect = this.containerRef().nativeElement.getBoundingClientRect();
       const x = (e.clientX - rect.left - this.transform().x) / this.transform().zoom;
       const y = (e.clientY - rect.top - this.transform().y) / this.transform().zoom;

       this.nodes.update(ns => [...ns, {
         id: Math.random().toString(36).substring(2, 9),
         position: { x, y },
         width: 260,
         data: parseData
       }]);
    } catch(err) {
       console.error("Drop Parse Error:", err);
    }
  }

  onWheel(e: WheelEvent) {
    e.preventDefault();
    
    // Modalità Panning (Trackpad 2-dita / Rotella del mouse liscia senza modificatori)
    if (!e.ctrlKey && !e.metaKey) {
      // Regola la sensibilità del trackpad/rotella per pan
      const panSpeed = e.shiftKey ? 2 : 1;
      const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX; // Supporta rotella standard + shift per scrollare orizzontale
      const dy = e.shiftKey && !e.deltaX ? 0 : e.deltaY;
      
      this.transform.update(t => ({
        ...t,
        x: t.x - (dx * panSpeed),
        y: t.y - (dy * panSpeed)
      }));
      return;
    }

    // Modalità Zoom: Trackpad pinch-to-zoom (ctrlKey su Mac) o Ctrl+Rotella
    // Calcoliamo un delta più fluido per il pinch
    const delta = -e.deltaY * 0.01;
    const currentZoom = this.transform().zoom;
    // Fissa i limiti di zoom 
    const newZoom = Math.min(Math.max(currentZoom * Math.exp(delta), 0.15), 3.5);
    
    // Zoom tramite focal point (centrato sul cursore del mouse)
    const rect = this.containerRef().nativeElement.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const dx = (mouseX - this.transform().x) / currentZoom;
    const dy = (mouseY - this.transform().y) / currentZoom;

    const newX = mouseX - dx * newZoom;
    const newY = mouseY - dy * newZoom;

    this.transform.set({ x: newX, y: newY, zoom: newZoom });
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }

  zoomIn() { this.transform.update(t => ({...t, zoom: Math.min(t.zoom + 0.2, 3)})); }
  zoomOut() { this.transform.update(t => ({...t, zoom: Math.max(t.zoom - 0.2, 0.2)})); }
  
  fitView() { 
    this.transform.set({ x: 0, y: 0, zoom: 1 }); 
  }

  addNode() {
    this.nodes.update(ns => [...ns, { 
      id: Math.random().toString().substring(2, 6), 
      data: { label: 'Next Step' }, 
      position: { 
        x: -this.transform().x + window.innerWidth / 2 - 75, 
        y: -this.transform().y + window.innerHeight / 2 - 24 
      } 
    }]);
  }

  // --- Calcolo Fallback / Interattivo ---

  getTempEdgePath() {
    const c = this.conn();
    const source = this.nodes().find(n => n.id === c.sourceNodeId);
    let sx = c.startX, sy = c.startY, w = 260, h = 140;
    if (source) {
      sx = source.position.x + (source.width ?? 260);
      sy = source.position.y + 20;
      w = source.width ?? 260; h = source.height ?? 140;
    }
    const obstacles = this.nodes().map(n => ({x: n.position.x, y: n.position.y, w: n.width ?? 260, h: n.height ?? 140}));
    return routeOrthogonalAvoidObstacles(sx, sy, c.currentX, c.currentY, obstacles);
  }
}
