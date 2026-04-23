import { Component, ElementRef, inject, OnInit, PLATFORM_ID, ViewChild, ViewEncapsulation, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SidebarTemplatesComponent } from './sidebar/sidebar.component';
import { CanvasTemplatesComponent } from './canvas/canvas.component';
import { PropertiesTemplatesComponent } from './properties/properties.component';
import { CodeTemplatesEditorComponent } from './code-editor/code-editor.component';
import { AiTemplatesChatComponent } from './ai-chat/ai-chat.component';
import { BuilderService } from './builder.service';
import { PageService } from './page.service';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule } from '@angular/cdk/drag-drop';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { firstValueFrom } from 'rxjs';
import { template } from 'handlebars';
import { ToastrService } from 'ngx-toastr';
import { PageTemplate, TemplateFile } from './templates.interface';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';

@Component({
  selector: 'app-templates-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarTemplatesComponent,
    CanvasTemplatesComponent,
    PropertiesTemplatesComponent,
    CodeTemplatesEditorComponent,
    AiTemplatesChatComponent,
    MatIconModule,
    DragDropModule,
    CodemirrorModule
  ],
  templateUrl: './builder.component.html',
  styleUrls: ['./builder.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class BuilderTemplatesComponent implements OnInit {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  constructor(private readonly toast: ToastrService) { }

  builderService = inject(BuilderService);
  pageService = inject(PageService);
  http = inject(HttpClient);
  platformId = inject(PLATFORM_ID);

  previewMode = false;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // @ts-expect-error - CodeMirror mode imports do not have type definitions
      import('codemirror/mode/javascript/javascript');
      // @ts-expect-error - CodeMirror mode imports do not have type definitions
      import('codemirror/mode/css/css');
      // @ts-expect-error - CodeMirror mode imports do not have type definitions
      import('codemirror/mode/xml/xml');
      // @ts-expect-error - CodeMirror mode imports do not have type definitions
      import('codemirror/mode/htmlmixed/htmlmixed');
    }

    this.pageService.getMergedModels().subscribe(models => {
      this.models = models;
    });
  }

  // Resizing state
  sidebarWidth = 256; // 16rem (w-64)
  isResizingSidebar = false;

  startResizeSidebar(event: MouseEvent) {
    event.preventDefault();
    this.isResizingSidebar = true;
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.isResizingSidebar) {
      this.sidebarWidth = Math.max(200, Math.min(event.clientX, 600));
    }
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    this.isResizingSidebar = false;
  }

  // Breakpoint state
  currentBreakpoint: 'mobile' | 'tablet' | 'desktop' = 'desktop';

  // Dark mode state
  isDarkMode = false;

  // AI Chat state
  showAiChat = false;

  // Zoom & Pan state
  zoomLevel = 100;
  isPanMode = false;
  isDragging = false;
  startX = 0;
  startY = 0;
  scrollLeft = 0;
  scrollTop = 0;

  showNewPageModal = false;
  isCreatingPage = false;

  newPageData = {
    name: '',
    slug: '',
    description: '',
    template: 'blank',
    model: 'A'
  };

  templates = [
    { id: 'blank', name: 'Blank Page', description: 'Start from scratch with an empty canvas', icon: 'check_box_outline_blank', file: null },
    { id: 'landing', name: 'Landing Page', description: 'A full landing page with hero, features, and CTA', icon: 'web', file: '/templates/landing.html' },
    { id: 'teaserlist', name: 'Teaser List', description: 'A list of article teasers with images', icon: 'view_list', file: '/templates/teaserlist.html' },
    { id: 'fullcontent', name: 'Full Content', description: 'A full article page with cover image', icon: 'article', file: '/templates/fullcontent.html' },
    { id: 'mappreview', name: 'Map Preview', description: 'Contact page with embedded map', icon: 'map', file: '/templates/mappreview.html' },
    { id: 'form', name: 'Contact Form', description: 'Ready-to-use contact form', icon: 'contact_mail', file: '/templates/form.html' }
  ];

  showAttachModal = false;

  attachModalData: {
    pageId: string;
    activeTab: 'create' | 'upload' | 'edit';
    fileType: 'js' | 'css';
    fileName: string;
    fileContent: string;
    selectedFile: File | null;
    selectedAttachmentId: string | null;
  } = {
      pageId: '',
      activeTab: 'create',
      fileType: 'js',
      fileName: '',
      fileContent: '',
      selectedFile: null,
      selectedAttachmentId: null
    };


  models: string[] = [];

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

  zoomIn() {
    if (this.zoomLevel < 200) {
      this.zoomLevel += 10;
    }
  }

  zoomOut() {
    if (this.zoomLevel > 30) {
      this.zoomLevel -= 10;
    }
  }

  togglePanMode() {
    this.isPanMode = !this.isPanMode;
    if (!this.isPanMode) {
      this.isDragging = false;
    }
  }

  onPanStart(event: MouseEvent) {
    if (!this.isPanMode) return;
    this.isDragging = true;
    this.startX = event.pageX - this.scrollContainer.nativeElement.offsetLeft;
    this.startY = event.pageY - this.scrollContainer.nativeElement.offsetTop;
    this.scrollLeft = this.scrollContainer.nativeElement.scrollLeft;
    this.scrollTop = this.scrollContainer.nativeElement.scrollTop;
  }

  onPanMove(event: MouseEvent) {
    if (!this.isDragging || !this.isPanMode) return;
    event.preventDefault();
    const x = event.pageX - this.scrollContainer.nativeElement.offsetLeft;
    const y = event.pageY - this.scrollContainer.nativeElement.offsetTop;
    const walkX = (x - this.startX) * 1.5; // Scroll-fast
    const walkY = (y - this.startY) * 1.5; // Scroll-fast
    this.scrollContainer.nativeElement.scrollLeft = this.scrollLeft - walkX;
    this.scrollContainer.nativeElement.scrollTop = this.scrollTop - walkY;
  }

  onPanEnd() {
    this.isDragging = false;
  }


  async downloadZip() {
    const zip = new JSZip();

    const currentPageId = this.pageService.currentPageId();
    if (!currentPageId) return;

    const page = this.pageService.pages().find(p => p._id === currentPageId);
    if (!page) return;

    let htmlContent = this.builderService.htmlContent();

    const assets = page.files?.filter(f =>
      f.contentType.includes('css') ||
      f.contentType.includes('javascript') ||
      f.contentType === 'js'
    ) ?? [];

    let cssLinks = '';
    let jsScripts = '';

    for (const asset of assets) {
      const isCss = asset.contentType.includes('css');

      zip.file(`${isCss ? 'css' : 'js'}/${asset.filename}`, asset.data);

      if (isCss) {
        cssLinks += `<link rel="stylesheet" href="./css/${asset.filename}">\n`;
      } else {
        jsScripts += `<script src="./js/${asset.filename}"></script>\n`;
      }
    }

    htmlContent = htmlContent
      .replace('</head>', `${cssLinks}</head>`)
      .replace('</body>', `${jsScripts}</body>`);

    zip.file('index.html', htmlContent);

    const content_readme = `
        Template Name: ${page.title}
        Template Type: ${page.viewtype?.[0]?.rendertype || ''}
        Model (index): ${page.instance?.map(i => i._index).join(', ')}
        Description: ${page.description}
        Author: ${page.author}
        `.trim();

    zip.file("Properties.txt", content_readme);

    const d = new Date();
    const date = d.toISOString().split('T')[0].replace(/-/g, '_');
    const time = d.toTimeString().split(' ')[0].replace(/:/g, '_');

    const zipName = `basedym_templates_${page.title}_${date}_${time}.zip`;

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, zipName);
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
        // this.pageService.savePage(name, 'new-page', 'Description', this.builderService.htmlContent());
        this.pageService.savePage(
          this.newPageData.name,
          this.newPageData.slug,
          this.newPageData.description,
          "standard",
          this.newPageData.template,
          this.newPageData.model);
        const pages = this.pageService.pages();
        const newPage = pages[pages.length - 1];
        this.pageService.loadPage(newPage._id);
        alert('Page created and saved!');
      }
    }
  }

  openNewPageModal() {
    this.newPageData = { name: '', slug: '', description: '', template: 'blank', model: '' };
    this.showNewPageModal = true;
  }

  closeNewPageModal() {
    this.showNewPageModal = false;
  }

  async saveNewPage() {

    if (!this.newPageData.name || !this.newPageData.slug) return;

    this.isCreatingPage = true;
    let initialContent = '<div class="container mx-auto p-4"><h1>' + this.newPageData.name + '</h1></div>';

    try {

      const content = await firstValueFrom(this.pageService.getViewTypeTemplate(this.newPageData.template, this.newPageData.model));

      if (content) {
        initialContent = content
          .replaceAll('{{titolo}}', this.newPageData.name)
          .replaceAll('{{instance}}', this.newPageData.slug);
      }

    } catch (error) {
      console.error('Failed to load template:', error);
    }

    this.pageService.savePage(
      this.newPageData.name,
      this.newPageData.slug,
      this.newPageData.description,
      initialContent,
      this.newPageData.template,
      this.newPageData.model
    );

    const pages = this.pageService.pages();
    const newPage = pages[pages.length - 1];

    this.loadPage(newPage._id);
    this.closeNewPageModal();
    this.isCreatingPage = false;
  }

  loadPage(id: string) {
    console.log("id: ", id)
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
      selectedFile: null,
      selectedAttachmentId: null
    };

    this.showAttachModal = true;
  }

  closeAttachModal() {
    this.showAttachModal = false;
  }

  setAttachTab(tab: 'create' | 'upload') {
    this.attachModalData.activeTab = tab;
    this.attachModalData.selectedAttachmentId = null;
    this.attachModalData.fileName = '';
    this.attachModalData.fileContent = '';
    this.attachModalData.selectedFile = null;
  }

  selectAttachment(file: TemplateFile) {
    this.attachModalData.activeTab = 'edit';
    this.attachModalData.selectedAttachmentId = file._id;

    this.attachModalData.fileType =
      file.contentType === 'text/css' ? 'css' : 'js';

    const nameWithoutExt = file.filename.replace(/\.(js|css)$/, '');

    this.attachModalData.fileName = nameWithoutExt;
    this.attachModalData.fileContent = file.data;
  }

  deleteAttachment(attachmentId: string) {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    this.pageService
      .deleteAttachment(this.attachModalData.pageId, attachmentId)
      .subscribe({
        next: () => {
          if (this.attachModalData.selectedAttachmentId === attachmentId) {
            this.setAttachTab('create');
          }
          this.toast.success('Attachment deleted');
          this.closeAttachModal()
        },
        error: (err) => {
          console.error(err);
          this.toast.error('Failed to delete file');
        }
      });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.attachModalData.selectedFile = input.files[0];
    }
  }

  // isValidAttachment(): boolean {
  //   if (this.attachModalData.activeTab === 'create') {
  //     return !!this.attachModalData.fileName && !!this.attachModalData.fileContent;
  //   } else {
  //     return !!this.attachModalData.selectedFile;
  //   }
  // }
  isValidAttachment(): boolean {
    if (this.attachModalData.activeTab === 'create') {
      // nuovo asset
      return !!this.attachModalData.fileName && !!this.attachModalData.fileContent;
    } else if (this.attachModalData.activeTab === 'edit') {
      // asset esistente
      const pageId = this.attachModalData.pageId;
      const attachmentId = this.attachModalData.selectedAttachmentId;

      if (!pageId || !attachmentId) return false;

      const attachment = this.pageService.getAttachments(pageId)
        .find(f => f._id === attachmentId);
      if (!attachment) return false;

      return (attachment.data || '').trim() !== (this.attachModalData.fileContent || '').trim();
    }

    return false;
  }

  // saveAttachment() {
  //   const { pageId, activeTab, fileType, fileName, fileContent, selectedFile } = this.attachModalData;

  //   // Construct the payload
  //   const payload = {
  //     type: fileType,
  //     name: activeTab === 'create' ? `${fileName}.${fileType}` : selectedFile!.name,
  //     content: activeTab === 'create' ? fileContent : undefined,
  //     file: activeTab === 'upload' ? selectedFile! : undefined
  //   };

  //   this.pageService.attachFile(pageId, payload).then(() => {
  //     alert('File attached successfully!');
  //     this.closeAttachModal();
  //   });
  // }

  saveAttachment() {
    const {
      pageId,
      activeTab,
      fileType,
      fileName,
      fileContent,
      selectedFile,
      selectedAttachmentId
    } = this.attachModalData;

    this.pageService.currentPageId.set(pageId);

    if (activeTab === 'create') {
      const payload = {
        type: fileType,
        name: `${fileName}.${fileType}`,
        content: fileContent
      };

      this.pageService.attachFile(pageId, payload, 'create')
        .subscribe({
          next: () => {
            this.toast.success(`File ${payload.name} created`);
            this.closeAttachModal();
          },
          error: () => this.toast.error('Failed to create file')
        });
    }

    else if (activeTab === 'upload' && selectedFile) {
      const payload = {
        type: fileType,
        name: selectedFile.name,
        file: selectedFile
      };

      this.pageService.attachFile(pageId, payload, 'upload')
        .subscribe({
          next: () => {
            this.toast.success(`File ${payload.name} uploaded`);
            this.closeAttachModal();
          },
          error: () => this.toast.error('Failed to upload file')
        });
    }

    else if (activeTab === 'edit' && selectedAttachmentId) {
      const fullFileName = `${fileName}.${fileType}`;

      this.pageService.updateAttachment(
        pageId,
        selectedAttachmentId,
        fileContent,
        fullFileName,
        fileType
      ).subscribe({
        next: () => {
          this.toast.success(`File ${fullFileName} updated`);
          this.closeAttachModal();
        },
        error: () => this.toast.error('Failed to update file')
      });
    }
  }

  updateAttachment(attachmentId: string, newContent: string) {
    const pageId = this.attachModalData.pageId;
    if (!pageId) return;

    const fileName = `${this.attachModalData.fileName}.${this.attachModalData.fileType}`;

    this.pageService.updateAttachment(
      pageId,
      attachmentId,
      newContent,
      fileName,
      this.attachModalData.fileType
    )
      .subscribe({
        next: () => {
          this.toast.success(`Attachment updated successfully`);
        },
        error: (err) => {
          console.error(err);
          this.toast.error('Failed to update attachment');
        }
      });
  }

  get currentTemplateName(): string {
    const currentId = this.pageService.currentPageId();
    const page = this.pageService.pages().find(p => p._id === currentId);
    return page ? page.title : 'No selected Template';
  }

  /**/
  // variabili per la modale Template
  showTemplateEditModal = false;

  templateEditModalData: {
    pageId: string;
    title: string;
    model: string;
    description: string;
    viewtype: string; // stringa, derivata dal primo element di viewtype[]
  } = { pageId: '', title: '', model: '', description: '', viewtype: '' };

  // Apri modale Template
  openTemplateModal(template: PageTemplate) {
    console.log("Arriva qui: ", template)
    let viewtypeValue = '';

    if (Array.isArray(template.viewtype) && template.viewtype.length > 0) {
      viewtypeValue = template.viewtype[0].rendertype;
    }

    this.templateEditModalData = {
      pageId: template._id,
      title: template.title,
      model: template.instance[0]._index,
      description: template.description,
      viewtype: viewtypeValue
    };

    this.showTemplateEditModal = true;
  }

  closeTemplateModal() {
    this.showTemplateEditModal = false;
  }

  // Salva Template
  saveEditTemplate() {
    this.pageService.updateTemplate(this.templateEditModalData).subscribe({
      next: () => {
        this.pageService['loadTemplates']();
        this.toast.success(`Template updated successfully`);
        this.closeTemplateModal();
      },
      error: (err) => {
        console.error('Error updating template', err);
        this.toast.error('Failed to update template');
      }
    });
  }
  /**/

}
