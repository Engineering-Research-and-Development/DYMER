import { Component, input, output, HostListener } from '@angular/core';
import { XYNode, XYNodeData } from './types';

@Component({
  selector: 'xy-node',
  template: `
    <div class="absolute bg-white border border-stone-200 shadow-[0_4px_12px_rgba(0,0,0,0.05)] select-none hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-shadow will-change-transform flex flex-col group"
         [style.width]="(node().width || 260) + 'px'" 
         [style.min-height]="(node().height || 140) + 'px'"
         style="border-radius: 10px; z-index: 10;"
         [style.transform]="'translate(' + node().position.x + 'px, ' + node().position.y + 'px)'"
         (mousedown)="onDragStart($event)">
      
      <!-- Node Label Data (Header) -->
      <div class="h-10 border-b border-stone-100 flexitems-center px-4 font-bold text-sm text-stone-800 pointer-events-none rounded-t-lg relative overflow-hidden flex items-center bg-stone-50/50">
         <div class="absolute left-0 top-0 bottom-0 w-[6px]" [style.background-color]="node().data.color || '#3b82f6'"></div>
         {{ node().data.label }}
      </div>

      <!-- Node Details Body -->
      <div class="p-4 text-xs flex flex-col gap-3 pointer-events-none bg-white rounded-b-lg">
        
        <div class="flex items-center justify-between">
          <span class="font-bold text-stone-400 tracking-wider text-[10px] uppercase">Data Source</span>
          <span class="text-stone-700 font-medium bg-stone-100 px-2 py-0.5 rounded-sm">{{ node().data.dataSource || 'N/A' }}</span>
        </div>

        <div class="flex flex-col gap-1">
          <span class="font-bold text-stone-400 tracking-wider text-[10px] uppercase">Action</span>
          <span class="text-stone-700 font-medium flex items-center bg-stone-50 p-1.5 rounded-md border border-stone-100">
            <span class="material-icons text-stone-500 text-[14px] mr-1.5 align-middle">bolt</span>
            {{ node().data.action || 'Default Action' }}
          </span>
        </div>

        <div class="flex flex-col border-t border-stone-100 pt-3 mt-1">
          <span class="font-bold text-stone-400 tracking-wider text-[10px] uppercase mb-1">Output</span>
          <span class="text-emerald-700 font-mono font-medium text-[11px] truncate" [title]="node().data.output">{{ node().data.output || 'void' }}</span>
        </div>

        @if(node().data.jsonIndex !== undefined) {
          <div class="flex flex-col border-t border-stone-100 pt-2 mt-1">
            <span class="font-bold text-stone-400 tracking-wider text-[10px] uppercase mb-1">JSON Path / Index</span>
            <input type="text" [value]="node().data.jsonIndex" 
                   (mousedown)="$event.stopPropagation()"
                   (input)="onJsonIndexChange($event)"
                   class="bg-stone-50 border border-stone-200 text-xs px-2 py-1.5 rounded w-full text-stone-700 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" 
                   placeholder="ex: data.payload.items[0]">
          </div>
        }
        @if(node().data.provider !== undefined) {
           <div class="flex justify-between items-center border-t border-stone-100 pt-2 mt-1">
             <span class="font-bold text-stone-400 tracking-wider text-[10px] uppercase">Routing</span>
             <span class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold tracking-tight">{{node().data.provider}}</span>
           </div>
        }
      </div>

      <!-- Target Handle (Left) - For incoming edges -->
      <div class="absolute w-4 h-4 bg-stone-100 border-[3px] border-stone-300 rounded-full hover:bg-emerald-400 hover:border-emerald-600 transition-colors"
           style="left: -8px; top: 12px; cursor: crosshair; z-index: 20;"
           (mousedown)="$event.stopPropagation()"
           (mouseup)="onTargetMouseUp($event)"></div>

      <!-- Source Handle (Right) - For outgoing edges -->
      <div class="absolute w-4 h-4 bg-stone-100 border-[3px] border-stone-300 rounded-full hover:bg-emerald-400 hover:border-emerald-600 transition-colors"
           style="right: -8px; top: 12px; cursor: crosshair; z-index: 20;"
           (mousedown)="onSourceMouseDown($event)"
           (mouseup)="$event.stopPropagation()"></div>
    </div>
  `,
  styles: [`:host { display: block; position: absolute; top: 0; left: 0; }`]
})
export class XyNodeComponent {
  node = input.required<XYNode>();
  zoom = input.required<number>();

  nodeDrag = output<{ id: string, x: number, y: number }>();
  connectionStart = output<{ id: string, startX: number, startY: number }>();
  connectionEnd = output<{ id: string }>();
  dataChange = output<{ id: string, data: Partial<XYNodeData> }>();

  onJsonIndexChange(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    this.dataChange.emit({ id: this.node().id, data: { jsonIndex: val } });
  }

  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private initialNodeX = 0;
  private initialNodeY = 0;

  onDragStart(e: MouseEvent) {
    if (e.button !== 0) return; // Only left click allowed for drag
    e.stopPropagation();
    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.initialNodeX = this.node().position.x;
    this.initialNodeY = this.node().position.y;
  }

  @HostListener('window:mousemove', ['$event'])
  onDragMove(e: MouseEvent) {
    if (!this.isDragging) return;
    // Account for zoom when dragging so the node stays right under the cursor
    const dx = (e.clientX - this.dragStartX) / this.zoom();
    const dy = (e.clientY - this.dragStartY) / this.zoom();
    this.nodeDrag.emit({ 
      id: this.node().id, 
      x: this.initialNodeX + dx, 
      y: this.initialNodeY + dy 
    });
  }

  @HostListener('window:mouseup')
  onDragEnd() {
    this.isDragging = false;
  }

  onSourceMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    e.stopPropagation(); // Preveniamo il drag del nodo
    this.connectionStart.emit({
      id: this.node().id,
      startX: this.node().position.x + (this.node().width || 260),
      startY: this.node().position.y + 20
    });
  }

  onTargetMouseUp(e: MouseEvent) {
    e.stopPropagation(); // Preveniamo il mouseup sulla window per evitare l'interruzione anticipata
    this.connectionEnd.emit({ id: this.node().id });
  }
}
