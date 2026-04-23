import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from './sidebar/sidebar.component';
import { CanvasComponent } from './canvas/canvas.component';
import { PropertiesComponent } from './properties/properties.component';
import { CodeEditorComponent } from './code-editor/code-editor.component';
import { AiChatComponent } from './ai-chat/ai-chat.component';
import { BuilderService } from './builder.service';
import { PageService } from './page.service';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule } from '@angular/cdk/drag-drop';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    CanvasComponent,
    PropertiesComponent,
    CodeEditorComponent,
    AiChatComponent,
    MatIconModule,
    DragDropModule
  ],
  template: `
    <div class="flex h-screen bg-gray-100 overflow-hidden" cdkDropListGroup [class.dark]="isDarkMode">
      <!-- Sidebar -->
      <app-sidebar 
        class="w-64 bg-white border-r border-gray-200 shrink-0 dark:bg-gray-900 dark:border-gray-700"
        (requestCreatePage)="openNewPageModal()"
        (requestAttachFile)="openAttachModal($event)"
      ></app-sidebar>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-800">
        <!-- Toolbar -->
        <div class="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between shrink-0 dark:bg-gray-900 dark:border-gray-700">
          <div class="flex items-center space-x-2">
            <h1 class="text-lg font-semibold text-gray-800 dark:text-white">VvvebJs Lite</h1>
          </div>
          
          <!-- Center: Breakpoints -->
          <div class="flex items-center bg-gray-100 rounded-lg p-1 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <button 
              (click)="setBreakpoint('mobile')" 
              class="p-1.5 rounded-sm text-gray-500 hover:text-gray-700 hover:bg-white dark:hover:bg-gray-700 dark:text-gray-400 transition-all"
              [class.bg-white]="currentBreakpoint === 'mobile'"
              [class.text-blue-600]="currentBreakpoint === 'mobile'"
              [class.shadow-xs]="currentBreakpoint === 'mobile'"
              [class.dark:bg-gray-700]="currentBreakpoint === 'mobile'"
              [class.dark:text-blue-400]="currentBreakpoint === 'mobile'"
              title="Mobile View"
            >
              <mat-icon class="text-sm">smartphone</mat-icon>
            </button>
            <button 
              (click)="setBreakpoint('tablet')" 
              class="p-1.5 rounded-sm text-gray-500 hover:text-gray-700 hover:bg-white dark:hover:bg-gray-700 dark:text-gray-400 transition-all"
              [class.bg-white]="currentBreakpoint === 'tablet'"
              [class.text-blue-600]="currentBreakpoint === 'tablet'"
              [class.shadow-xs]="currentBreakpoint === 'tablet'"
              [class.dark:bg-gray-700]="currentBreakpoint === 'tablet'"
              [class.dark:text-blue-400]="currentBreakpoint === 'tablet'"
              title="Tablet View"
            >
              <mat-icon class="text-sm">tablet_mac</mat-icon>
            </button>
            <button 
              (click)="setBreakpoint('desktop')" 
              class="p-1.5 rounded-sm text-gray-500 hover:text-gray-700 hover:bg-white dark:hover:bg-gray-700 dark:text-gray-400 transition-all"
              [class.bg-white]="currentBreakpoint === 'desktop'"
              [class.text-blue-600]="currentBreakpoint === 'desktop'"
              [class.shadow-xs]="currentBreakpoint === 'desktop'"
              [class.dark:bg-gray-700]="currentBreakpoint === 'desktop'"
              [class.dark:text-blue-400]="currentBreakpoint === 'desktop'"
              title="Desktop View"
            >
              <mat-icon class="text-sm">desktop_windows</mat-icon>
            </button>
          </div>

          <div class="flex items-center space-x-2">
             <button (click)="toggleDarkMode()" class="p-2 hover:bg-gray-100 rounded-lg text-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" title="Toggle Dark Mode">
              <mat-icon>{{ isDarkMode ? 'light_mode' : 'dark_mode' }}</mat-icon>
            </button>
            <div class="w-px h-6 bg-gray-300 mx-2 dark:bg-gray-600"></div>
            <button (click)="togglePreview()" class="p-2 hover:bg-gray-100 rounded-lg text-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" [class.bg-blue-100]="previewMode" [class.text-blue-600]="previewMode" title="Toggle Preview">
              <mat-icon>visibility</mat-icon>
            </button>
            <button (click)="toggleCode()" class="p-2 hover:bg-gray-100 rounded-lg text-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" title="Toggle Code Editor">
              <mat-icon>code</mat-icon>
            </button>
            <button (click)="downloadZip()" class="p-2 hover:bg-gray-100 rounded-lg text-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" title="Download ZIP">
              <mat-icon>download</mat-icon>
            </button>
            <button (click)="saveTemplate()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2 transition-colors">
              <mat-icon class="text-sm">save</mat-icon> Save
            </button>
          </div>
        </div>

        <!-- Canvas Area -->
        <div class="flex-1 overflow-hidden relative bg-gray-50 flex dark:bg-gray-800">
          <div class="flex-1 overflow-auto p-8 flex justify-center bg-gray-100/50 dark:bg-gray-900/50" [class.p-0]="previewMode" [class.bg-white]="previewMode">
            <div 
              class="transition-all duration-300 ease-in-out bg-white shadow-xs rounded-lg overflow-hidden dark:bg-black"
              [style.width]="getCanvasWidth()"
              [style.height]="previewMode ? '100%' : 'min(100%, 800px)'"
              [class.shadow-none]="previewMode" 
              [class.rounded-none]="previewMode"
            >
               <app-canvas class="w-full h-full block"></app-canvas>
            </div>
          </div>
          
          <!-- Code Editor Overlay/Panel -->
          @if (builderService.showCodeEditor()) {
            <app-code-editor class="w-1/2 border-l border-gray-200 bg-white h-full absolute right-0 top-0 bottom-0 shadow-xl z-20 dark:bg-gray-900 dark:border-gray-700"></app-code-editor>
          }

          <!-- Right Panel (Properties + AI Chat) -->
          @if (!previewMode) {
            <div class="w-80 bg-white border-l border-gray-200 flex flex-col shrink-0 z-10 dark:bg-gray-900 dark:border-gray-700">
              <app-properties class="flex-1 overflow-hidden border-b border-gray-200 dark:border-gray-700"></app-properties>
              <app-ai-chat class="h-[40%] shrink-0"></app-ai-chat>
            </div>
          }
        </div>
      </div>

      <!-- New Page Modal Overlay -->
      @if (showNewPageModal) {
        <div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 dark:bg-gray-800 flex flex-col max-h-[90vh]">
            <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
              <h3 class="font-semibold text-gray-800 dark:text-white">Create New Page</h3>
              <button (click)="closeNewPageModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            
            <div class="flex flex-1 overflow-hidden">
              <!-- Left: Form -->
              <div class="w-1/2 p-4 space-y-4 border-r border-gray-100 dark:border-gray-700 overflow-y-auto">
                <div>
                  <label for="pageName" class="block text-xs font-medium text-gray-700 mb-1 dark:text-gray-300">Page Name</label>
                  <input 
                    id="pageName"
                    [(ngModel)]="newPageData.name" 
                    type="text" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-hidden dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="e.g. Contact Us"
                  >
                </div>
                
                <div>
                  <label for="pageSlug" class="block text-xs font-medium text-gray-700 mb-1 dark:text-gray-300">Index / Slug</label>
                  <input 
                    id="pageSlug"
                    [(ngModel)]="newPageData.slug" 
                    type="text" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-hidden dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="e.g. contact-us"
                  >
                </div>
                
                <div>
                  <label for="pageDescription" class="block text-xs font-medium text-gray-700 mb-1 dark:text-gray-300">Description</label>
                  <textarea 
                    id="pageDescription"
                    [(ngModel)]="newPageData.description" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-hidden min-h-[80px] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Brief description of the page..."
                  ></textarea>
                </div>
              </div>

              <!-- Right: Templates -->
              <div class="w-1/2 p-4 bg-gray-50 dark:bg-gray-900/50 overflow-y-auto">
                <span class="block text-xs font-medium text-gray-700 mb-2 dark:text-gray-300">Choose Template</span>
                <div class="grid grid-cols-1 gap-3">
                  @for (template of templates; track template.id) {
                    <div 
                      class="border rounded-lg p-3 cursor-pointer transition-all hover:border-blue-400 hover:shadow-xs outline-hidden focus:ring-2 focus:ring-blue-500"
                      [class.border-blue-500]="newPageData.template === template.id"
                      [class.bg-blue-50]="newPageData.template === template.id"
                      [class.dark:bg-blue-900]="newPageData.template === template.id"
                      [class.border-gray-200]="newPageData.template !== template.id"
                      [class.bg-white]="newPageData.template !== template.id"
                      [class.dark:bg-gray-800]="newPageData.template !== template.id"
                      [class.dark:border-gray-700]="newPageData.template !== template.id"
                      (click)="newPageData.template = template.id"
                      (keydown.enter)="newPageData.template = template.id"
                      tabindex="0"
                    >
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                          <mat-icon>{{ template.icon }}</mat-icon>
                        </div>
                        <div>
                          <h4 class="text-sm font-medium text-gray-800 dark:text-white">{{ template.name }}</h4>
                          <p class="text-xs text-gray-500 dark:text-gray-400">{{ template.description }}</p>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
            
            <div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2 dark:bg-gray-700 dark:border-gray-600">
              <button (click)="closeNewPageModal()" class="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium dark:text-gray-300 dark:hover:text-white">Cancel</button>
              <button 
                (click)="saveNewPage()" 
                [disabled]="!newPageData.name || !newPageData.slug"
                class="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                @if (isCreatingPage) {
                  <mat-icon class="animate-spin text-sm">refresh</mat-icon> Creating...
                } @else {
                  Create Page
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Attach File Modal Overlay -->
      @if (showAttachModal) {
        <div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] dark:bg-gray-800">
            <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
              <h3 class="font-semibold text-gray-800 dark:text-white">Attach Asset</h3>
              <button (click)="closeAttachModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            
            <div class="flex border-b border-gray-200 dark:border-gray-600">
              <button 
                class="flex-1 py-2 text-sm font-medium text-center transition-colors"
                [class.text-blue-600]="attachModalData.activeTab === 'create'"
                [class.border-b-2]="attachModalData.activeTab === 'create'"
                [class.border-blue-600]="attachModalData.activeTab === 'create'"
                [class.text-gray-500]="attachModalData.activeTab !== 'create'"
                [class.dark:text-blue-400]="attachModalData.activeTab === 'create'"
                [class.dark:text-gray-400]="attachModalData.activeTab !== 'create'"
                (click)="attachModalData.activeTab = 'create'"
              >
                Create New
              </button>
              <button 
                class="flex-1 py-2 text-sm font-medium text-center transition-colors"
                [class.text-blue-600]="attachModalData.activeTab === 'upload'"
                [class.border-b-2]="attachModalData.activeTab === 'upload'"
                [class.border-blue-600]="attachModalData.activeTab === 'upload'"
                [class.text-gray-500]="attachModalData.activeTab !== 'upload'"
                [class.dark:text-blue-400]="attachModalData.activeTab === 'upload'"
                [class.dark:text-gray-400]="attachModalData.activeTab !== 'upload'"
                (click)="attachModalData.activeTab = 'upload'"
              >
                Upload File
              </button>
            </div>

            <div class="p-4 space-y-4 overflow-y-auto flex-1">
              <!-- Common: File Type -->
              <div>
                <span class="block text-xs font-medium text-gray-700 mb-1 dark:text-gray-300">File Type</span>
                <div class="flex gap-4">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="fileType" value="js" [(ngModel)]="attachModalData.fileType" class="text-blue-600 focus:ring-blue-500">
                    <span class="text-sm text-gray-700 dark:text-gray-300">JavaScript (.js)</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="fileType" value="css" [(ngModel)]="attachModalData.fileType" class="text-blue-600 focus:ring-blue-500">
                    <span class="text-sm text-gray-700 dark:text-gray-300">CSS (.css)</span>
                  </label>
                </div>
              </div>

              @if (attachModalData.activeTab === 'create') {
                <div>
                  <label for="fileName" class="block text-xs font-medium text-gray-700 mb-1 dark:text-gray-300">File Name</label>
                  <input 
                    id="fileName"
                    [(ngModel)]="attachModalData.fileName" 
                    type="text" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-hidden dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="e.g. custom-script"
                  >
                  <span class="text-xs text-gray-400 mt-1 block">Extension .{{attachModalData.fileType}} will be added automatically</span>
                </div>
                
                <div class="flex-1 flex flex-col min-h-[200px]">
                  <label for="fileContent" class="block text-xs font-medium text-gray-700 mb-1 dark:text-gray-300">Code Content</label>
                  <textarea 
                    id="fileContent"
                    [(ngModel)]="attachModalData.fileContent" 
                    class="w-full flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-hidden resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="// Write your code here..."
                  ></textarea>
                </div>
              }

              @if (attachModalData.activeTab === 'upload') {
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative dark:border-gray-600 dark:hover:bg-gray-700">
                  <input 
                    type="file" 
                    (change)="onFileSelected($event)" 
                    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    [accept]="attachModalData.fileType === 'js' ? '.js' : '.css'"
                  >
                  <mat-icon class="text-gray-400 text-4xl mb-2">cloud_upload</mat-icon>
                  <p class="text-sm text-gray-600 font-medium dark:text-gray-300">Click to upload or drag and drop</p>
                  <p class="text-xs text-gray-400 mt-1">
                    {{ attachModalData.selectedFile ? attachModalData.selectedFile.name : 'Supported: .' + attachModalData.fileType }}
                  </p>
                </div>
              }
            </div>
            
            <div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2 dark:bg-gray-700 dark:border-gray-600">
              <button (click)="closeAttachModal()" class="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium dark:text-gray-300 dark:hover:text-white">Cancel</button>
              <button 
                (click)="saveAttachment()" 
                [disabled]="!isValidAttachment()"
                class="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <mat-icon class="text-sm">save</mat-icon> Save Asset
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }
  `],
  encapsulation: ViewEncapsulation.None,
})
export class BuilderComponent {
  builderService = inject(BuilderService);
  pageService = inject(PageService);
  http = inject(HttpClient);
  
  previewMode = false;
  
  // Breakpoint state
  currentBreakpoint: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  
  // Dark mode state
  isDarkMode = false;

  showNewPageModal = false;
  isCreatingPage = false;
  
  newPageData = {
    name: '',
    slug: '',
    description: '',
    template: 'blank'
  };

  templates = [
    { id: 'blank', name: 'Blank Page', description: 'Start from scratch with an empty canvas', icon: 'check_box_outline_blank', file: null },
    { id: 'teaserlist', name: 'Teaser List', description: 'A list of article teasers with images', icon: 'view_list', file: '/templates/teaserlist.html' },
    { id: 'fullcontent', name: 'Full Content', description: 'A full article page with cover image', icon: 'article', file: '/templates/fullcontent.html' },
    { id: 'mappreview', name: 'Map Preview', description: 'Contact page with embedded map', icon: 'map', file: '/templates/mappreview.html' },
    { id: 'form', name: 'Contact Form', description: 'Ready-to-use contact form', icon: 'contact_mail', file: '/templates/form.html' }
  ];

  showAttachModal = false;
  attachModalData = {
    pageId: '',
    activeTab: 'create' as 'create' | 'upload',
    fileType: 'js' as 'js' | 'css',
    fileName: '',
    fileContent: '',
    selectedFile: null as File | null
  };

  togglePreview() {
    this.previewMode = !this.previewMode;
  }

  toggleCode() {
    this.builderService.toggleCodeEditor();
  }
  
  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
  
  setBreakpoint(breakpoint: 'mobile' | 'tablet' | 'desktop') {
    this.currentBreakpoint = breakpoint;
  }
  
  getCanvasWidth(): string {
    if (this.previewMode) return '100%';
    
    switch (this.currentBreakpoint) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      case 'desktop': return '100%'; // or '1024px' or max-w-5xl
      default: return '100%';
    }
  }

  async downloadZip() {
    const zip = new JSZip();
    const pages = this.pageService.pages();
    
    // Add pages to zip
    pages.forEach(page => {
      // Create a basic HTML structure for the page
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${page.name}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <style>
      /* Custom CSS */
    </style>
</head>
<body>
    ${page.htmlContent}
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
      
      zip.file(`${page.slug}.html`, htmlContent);
    });
    
    // Generate and save zip
    try {
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'vvvebjs-lite-project.zip');
    } catch (error) {
      console.error('Error generating zip:', error);
      alert('Failed to generate ZIP file.');
    }
  }

  saveTemplate() {
    const currentId = this.pageService.currentPageId();
    if (currentId) {
      this.pageService.updatePage(currentId, this.builderService.htmlContent());
      alert('Page saved successfully!');
    } else {
      // Fallback if no page selected, though sidebar usually handles this
      const name = prompt('Save as new page. Enter name:', 'My New Page');
      if (name) {
        this.pageService.savePage(name, 'new-page', 'Description', this.builderService.htmlContent());
        const pages = this.pageService.pages();
        const newPage = pages[pages.length - 1];
        this.pageService.loadPage(newPage.id);
        alert('Page created and saved!');
      }
    }
  }

  openNewPageModal() {
    this.newPageData = { name: '', slug: '', description: '', template: 'blank' };
    this.showNewPageModal = true;
  }

  closeNewPageModal() {
    this.showNewPageModal = false;
  }

  async saveNewPage() {
    if (this.newPageData.name && this.newPageData.slug) {
      this.isCreatingPage = true;
      let initialContent = '<div class="container mx-auto p-4"><h1>' + this.newPageData.name + '</h1></div>';

      // Load template if selected
      const selectedTemplate = this.templates.find(t => t.id === this.newPageData.template);
      if (selectedTemplate && selectedTemplate.file) {
        try {
          const content = await firstValueFrom(this.http.get(selectedTemplate.file, { responseType: 'text' }));
          if (content) {
            initialContent = content;
          }
        } catch (error) {
          console.error('Failed to load template:', error);
          // Fallback to default content is already set
        }
      }

      this.pageService.savePage(
        this.newPageData.name, 
        this.newPageData.slug, 
        this.newPageData.description, 
        initialContent
      );
      
      // Load the newly created page (it's the last one)
      const pages = this.pageService.pages();
      const newPage = pages[pages.length - 1];
      this.loadPage(newPage.id);
      this.closeNewPageModal();
      this.isCreatingPage = false;
    }
  }

  loadPage(id: string) {
    const content = this.pageService.loadPage(id);
    if (content) {
      this.builderService.updateContent(content);
    }
  }

  openAttachModal(pageId: string) {
    this.attachModalData = {
      pageId,
      activeTab: 'create',
      fileType: 'js',
      fileName: '',
      fileContent: '',
      selectedFile: null
    };
    this.showAttachModal = true;
  }

  closeAttachModal() {
    this.showAttachModal = false;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.attachModalData.selectedFile = input.files[0];
    }
  }

  isValidAttachment(): boolean {
    if (this.attachModalData.activeTab === 'create') {
      return !!this.attachModalData.fileName && !!this.attachModalData.fileContent;
    } else {
      return !!this.attachModalData.selectedFile;
    }
  }

  saveAttachment() {
    const { pageId, activeTab, fileType, fileName, fileContent, selectedFile } = this.attachModalData;
    
    // Construct the payload
    const payload = {
      type: fileType,
      name: activeTab === 'create' ? `${fileName}.${fileType}` : selectedFile!.name,
      content: activeTab === 'create' ? fileContent : undefined,
      file: activeTab === 'upload' ? selectedFile! : undefined
    };

    this.pageService.attachFile(pageId, payload).then(() => {
      alert('File attached successfully!');
      this.closeAttachModal();
    });
  }
}
