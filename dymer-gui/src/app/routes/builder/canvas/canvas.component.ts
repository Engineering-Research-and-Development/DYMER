import { Component, ElementRef, ViewChild, inject, AfterViewInit, Renderer2, effect, OnDestroy, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { BuilderService } from '../builder.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule, DragDropModule, MatIconModule],
  template: `
    <div 
      #canvasContainer
      class="w-full h-full min-h-[800px] bg-white relative outline-hidden"
      (click)="onCanvasClick($event)"
      (keydown.enter)="onCanvasClick($event)"
      tabindex="0"
      (dragover)="onDragOver($event)"
      (drop)="onDrop($event)"
      cdkDropList
      (cdkDropListDropped)="onCdkDrop($event)"
    ></div>
    
    <!-- Selection Overlay with Actions -->
    @if (builderService.selectedElement(); as el) {
      <div 
        class="absolute z-50 flex items-center gap-1 bg-blue-600 rounded-md shadow-lg p-1 transform -translate-y-full -translate-x-1/2"
        [style.top.px]="getRelativeTop(el)"
        [style.left.px]="getRelativeLeft(el)"
      >
        <button (click)="moveUp($event)" class="text-white hover:bg-blue-700 p-1 rounded-sm" title="Move Up">
          <mat-icon class="text-sm">arrow_upward</mat-icon>
        </button>
        <button (click)="moveDown($event)" class="text-white hover:bg-blue-700 p-1 rounded-sm" title="Move Down">
          <mat-icon class="text-sm">arrow_downward</mat-icon>
        </button>
        <div class="w-px h-4 bg-blue-400 mx-1"></div>
        <button (click)="deleteElement($event)" class="text-white hover:bg-red-600 p-1 rounded-sm" title="Delete">
          <mat-icon class="text-sm">delete</mat-icon>
        </button>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
    /* Add some basic styles for the canvas content to look decent even when empty */
    ::ng-deep .canvas-empty-placeholder {
      border: 2px dashed #e5e7eb;
      padding: 2rem;
      text-align: center;
      color: #9ca3af;
      border-radius: 0.5rem;
      margin: 1rem;
    }
    
    /* Highlight hover target */
    ::ng-deep .drop-target {
      outline: 2px dashed #3b82f6 !important;
      outline-offset: -2px;
      background-color: rgba(59, 130, 246, 0.05);
    }

    /* Selected element style */
    ::ng-deep .selected-element {
      outline: 2px solid #2563eb !important;
      outline-offset: -2px;
      position: relative;
    }
  `]
})
export class CanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLDivElement>;
  
  builderService = inject(BuilderService);
  renderer = inject(Renderer2);
  platformId = inject(PLATFORM_ID);
  
  // We use a getter to bind the HTML content
  // Note: In a real app, we'd sanitize this properly or use a safe pipe.
  // For a builder, we often need raw HTML.
  // get sanitizedHtml() {
  //   // In Angular, [innerHTML] automatically sanitizes. 
  //   // If we need scripts/styles, we'd need DomSanitizer.bypassSecurityTrustHtml
  //   // For now, let's assume the service provides safe HTML or we trust it.
  //   return this.builderService.htmlContent();
  // }

  private isInternalUpdate = false;
  private mutationObserver: MutationObserver | null = null;

  constructor() {
    // Effect to update canvas when HTML changes from outside (e.g. code editor)
    effect(() => {
      const html = this.builderService.htmlContent();
      // If the update originated from within the canvas (MutationObserver), skip re-rendering
      if (this.isInternalUpdate) return;

      if (this.canvasContainer && isPlatformBrowser(this.platformId)) {
         // Parse the full HTML to extract body content
         const parser = new DOMParser();
         const doc = parser.parseFromString(html, 'text/html');
         const bodyContent = doc.body.innerHTML;
         
         const currentClean = this.getCleanHtml(this.canvasContainer.nativeElement);
         
         // Compare with current canvas content to avoid unnecessary updates
         if (currentClean !== bodyContent) {
             this.canvasContainer.nativeElement.innerHTML = bodyContent;
         }
      }
    });

    // Effect to handle selection changes (e.g. from Navigator)
    effect(() => {
      const selected = this.builderService.selectedElement();
      // Only attempt to update DOM if view is initialized
      if (this.canvasContainer) {
        this.clearSelection();
        if (selected) {
          selected.classList.add('selected-element');
        }
      }
    });

    // Effect to handle content editable state
    effect(() => {
      const selected = this.builderService.selectedElement();
      const editable = this.builderService.isContentEditable();

      if (this.canvasContainer) {
        // Remove contenteditable from all elements first to be safe
        const allEditable = this.canvasContainer.nativeElement.querySelectorAll('[contenteditable]');
        allEditable.forEach(el => el.removeAttribute('contenteditable'));

        if (selected && editable) {
          selected.setAttribute('contenteditable', 'true');
          selected.focus();
        }
      }
    });

    // Effect to toggle MutationObserver based on Code Editor visibility
    effect(() => {
      const showEditor = this.builderService.showCodeEditor();
      if (showEditor) {
        this.mutationObserver?.disconnect();
      } else {
        // Re-connect if it was disconnected and we are in the browser
        if (this.mutationObserver && this.canvasContainer) {
          this.mutationObserver.observe(this.canvasContainer.nativeElement, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
          });
        }
      }
    });
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Initialize MutationObserver to detect changes inside the canvas
    // and update the service's HTML content
    if (typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver(() => {
        // If code editor is open, we ignore mutations (double safety, though disconnect should handle it)
        if (this.builderService.showCodeEditor()) return;

        if (this.canvasContainer) {
          this.isInternalUpdate = true;
          const cleanHtml = this.getCleanHtml(this.canvasContainer.nativeElement);
          this.builderService.updateBodyContent(cleanHtml);
          // Reset flag after a microtask to allow signal propagation
          setTimeout(() => this.isInternalUpdate = false, 0);
        }
      });

      // Only observe if editor is NOT open initially
      if (!this.builderService.showCodeEditor()) {
        this.mutationObserver.observe(this.canvasContainer.nativeElement, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true
        });
      }
    }
    
    // Set initial root
    this.builderService.rootElement.set(this.canvasContainer.nativeElement);
    
    // Initial render
    // We need to parse initial content too
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.builderService.htmlContent(), 'text/html');
    this.canvasContainer.nativeElement.innerHTML = doc.body.innerHTML;
  }

  getCleanHtml(el: HTMLElement): string {
    const clone = el.cloneNode(true) as HTMLElement;
    const selected = clone.querySelector('.selected-element');
    if (selected) {
      selected.classList.remove('selected-element');
    }
    clone.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
    clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    return clone.innerHTML;
  }

  ngOnDestroy() {
    this.mutationObserver?.disconnect();
  }

  onCanvasClick(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    const target = event.target as HTMLElement;
    
    // Don't select the container itself if possible, unless it's empty
    if (target === this.canvasContainer.nativeElement) {
      this.builderService.selectElement(null);
      this.clearSelection();
      return;
    }

    // Handle selection visual
    this.clearSelection();
    target.classList.add('selected-element');
    this.builderService.selectElement(target);
  }

  clearSelection() {
    if (!this.canvasContainer) return;
    const prev = this.canvasContainer.nativeElement.querySelector('.selected-element');
    if (prev) {
      prev.classList.remove('selected-element');
    }
  }

  getElementRect(el: HTMLElement): DOMRect {
    return el.getBoundingClientRect();
  }

  getRelativeTop(el: HTMLElement): number {
    if (!this.canvasContainer) return 0;
    const containerRect = this.canvasContainer.nativeElement.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    return elRect.top - containerRect.top + this.canvasContainer.nativeElement.scrollTop - 10;
  }

  getRelativeLeft(el: HTMLElement): number {
    if (!this.canvasContainer) return 0;
    const containerRect = this.canvasContainer.nativeElement.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    return elRect.left - containerRect.left + this.canvasContainer.nativeElement.scrollLeft + (elRect.width / 2);
  }

  moveUp(event: Event) {
    event.stopPropagation();
    this.builderService.moveSelectedElementUp();
  }

  moveDown(event: Event) {
    event.stopPropagation();
    this.builderService.moveSelectedElementDown();
  }

  deleteElement(event: Event) {
    event.stopPropagation();
    if (confirm('Delete this element?')) {
      this.builderService.deleteSelectedElement();
    }
  }

  // Drag and Drop Handlers
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    const target = event.target as HTMLElement;
    
    // Visual feedback
    this.clearDropTargets();
    if (target !== this.canvasContainer.nativeElement) {
      target.classList.add('drop-target');
    }
  }

  clearDropTargets() {
    const targets = this.canvasContainer.nativeElement.querySelectorAll('.drop-target');
    targets.forEach(t => t.classList.remove('drop-target'));
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.clearDropTargets();
    
    // This handles native drops if we used native dragstart.
    // But we are using CDK Drag.
    // CDK Drag doesn't fire native 'drop' event with data transfer in the same way 
    // unless we bridge it.
    // However, since we used cdkDropList on the container, 
    // onCdkDrop should trigger.
  }

  onCdkDrop(event: CdkDragDrop<unknown>) {
    // Get the data from the dragged item
    const item = event.item.data as { html: string };
    if (!item || !item.html) return;

    // We need to find WHERE it was dropped.
    // CDK DropList is usually for lists. 
    // For a free-form canvas, we need the mouse position to find the target element.
    // CDK doesn't give us the target element inside the drop list easily.
    // We can use document.elementFromPoint
    
    const clientX = event.dropPoint.x;
    const clientY = event.dropPoint.y;
    
    // Temporarily hide the dragged preview so we can find the element under it
    // (CDK preview might block the element)
    // Actually CDK handles this usually.
    
    const target = document.elementFromPoint(clientX, clientY) as HTMLElement;
    
    if (target && this.canvasContainer.nativeElement.contains(target)) {
      // Create the new element
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = item.html;
      const newElement = tempDiv.firstElementChild as HTMLElement;
      
      if (newElement) {
        // Insert logic:
        // If target is a container (div, section, etc), append to it.
        // If target is a leaf (img, input), insert after it.
        // This is a simplified logic.
        
        const isContainer = ['DIV', 'SECTION', 'ARTICLE', 'MAIN', 'ASIDE', 'HEADER', 'FOOTER'].includes(target.tagName);
        
        if (isContainer) {
          target.appendChild(newElement);
        } else {
          target.parentElement?.insertBefore(newElement, target.nextSibling);
        }
        
        // Update the service HTML
        this.updateServiceHtml();
        
        // Select the new element
        setTimeout(() => {
            this.clearSelection();
            newElement.classList.add('selected-element');
            this.builderService.selectElement(newElement);
        }, 0);
      }
    }
  }
  
  updateServiceHtml() {
    // Clean up classes before saving
    const clone = this.canvasContainer.nativeElement.cloneNode(true) as HTMLElement;
    const selected = clone.querySelector('.selected-element');
    if (selected) selected.classList.remove('selected-element');
    clone.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
    clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    
    this.builderService.updateBodyContent(clone.innerHTML);
  }
}
