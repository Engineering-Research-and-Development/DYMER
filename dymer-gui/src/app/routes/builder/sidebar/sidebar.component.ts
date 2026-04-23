import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { PageService } from '../page.service';
import { BuilderService } from '../builder.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, DragDropModule, MatIconModule],
  template: `
    <div class="flex flex-col h-full relative">
      
      <!-- Pages Section -->
      <div class="p-4 border-b border-gray-200 bg-gray-50">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">Pages</h2>
          <button (click)="requestCreatePage.emit()" class="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center">
            <mat-icon class="text-sm mr-1">add</mat-icon> New
          </button>
        </div>
        <div class="space-y-1 max-h-40 overflow-y-auto">
          @for (page of pageService.pages(); track page.id) {
            <div 
              class="flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-white hover:shadow-xs transition-all group"
              [class.bg-blue-50]="pageService.currentPageId() === page.id"
              [class.border-blue-200]="pageService.currentPageId() === page.id"
              [class.border]="pageService.currentPageId() === page.id"
              (click)="loadPage(page.id)"
              (keydown.enter)="loadPage(page.id)"
              tabindex="0"
            >
              <div class="flex items-center truncate">
                <mat-icon class="text-gray-400 text-sm mr-2 group-hover:text-blue-500">description</mat-icon>
                <div class="flex flex-col truncate">
                  <span class="text-sm text-gray-700 truncate max-w-[100px]" [class.font-medium]="pageService.currentPageId() === page.id">{{ page.name }}</span>
                  <span class="text-[10px] text-gray-400 truncate">{{ page.slug }}</span>
                </div>
              </div>
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button (click)="onAttachClick($event, page.id)" class="text-gray-400 hover:text-blue-500" title="Attach JS/CSS">
                  <mat-icon class="text-sm">attachment</mat-icon>
                </button>
                <button (click)="deletePage($event, page.id)" class="text-gray-400 hover:text-red-500">
                  <mat-icon class="text-sm">delete</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-gray-200 bg-white">
        <button 
          (click)="setActiveTab('components')"
          class="flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors outline-hidden"
          [class.border-blue-500]="activeTab === 'components'"
          [class.text-blue-600]="activeTab === 'components'"
          [class.border-transparent]="activeTab !== 'components'"
          [class.text-gray-500]="activeTab !== 'components'"
          [class.hover:text-gray-700]="activeTab !== 'components'"
        >
          Components
        </button>
        <button 
          (click)="setActiveTab('sections')"
          class="flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors outline-hidden"
          [class.border-blue-500]="activeTab === 'sections'"
          [class.text-blue-600]="activeTab === 'sections'"
          [class.border-transparent]="activeTab !== 'sections'"
          [class.text-gray-500]="activeTab !== 'sections'"
          [class.hover:text-gray-700]="activeTab !== 'sections'"
        >
          Sections
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto p-4 space-y-2" cdkDropList [cdkDropListConnectedTo]="[]">
        @if (activeTab === 'components') {
          @for (category of categories; track category.name) {
            <div class="border border-gray-200 rounded-lg overflow-hidden">
              <button 
                (click)="toggleCategory(category.name)"
                class="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <span class="text-xs font-medium text-gray-700 uppercase">{{ category.name }}</span>
                <mat-icon class="text-gray-400 text-sm transition-transform duration-200" [class.rotate-180]="!category.expanded">expand_more</mat-icon>
              </button>
              
              @if (category.expanded) {
                <div class="p-3 bg-white grid grid-cols-2 gap-3 border-t border-gray-200">
                  @for (item of category.items; track item.name) {
                    <div 
                      cdkDrag 
                      [cdkDragData]="item" 
                      class="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-white border border-gray-200 hover:border-blue-400 rounded-lg cursor-move transition-all shadow-xs hover:shadow-md group"
                    >
                      <mat-icon class="text-gray-400 group-hover:text-blue-500 mb-2">{{ item.icon }}</mat-icon>
                      <span class="text-xs text-gray-600 font-medium text-center">{{ item.name }}</span>
                      
                      <!-- Drag Preview -->
                      <div *cdkDragPreview class="bg-white p-4 rounded-lg shadow-xl border border-blue-500 opacity-90 flex items-center gap-2 z-50">
                        <mat-icon class="text-blue-500">{{ item.icon }}</mat-icon>
                        <span class="font-medium">{{ item.name }}</span>
                      </div>

                      <!-- Drag Placeholder -->
                      <div *cdkDragPlaceholder class="flex flex-col items-center justify-center p-3 bg-gray-50 border border-gray-200 rounded-lg opacity-50">
                        <mat-icon class="text-gray-400">{{ item.icon }}</mat-icon>
                        <span class="text-xs text-gray-600 font-medium text-center">{{ item.name }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        } @else {
          @for (section of sections; track section.name) {
            <div class="border border-gray-200 rounded-lg overflow-hidden">
              <button 
                (click)="toggleSection(section.name)"
                class="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <span class="text-xs font-medium text-gray-700 uppercase">{{ section.name }}</span>
                <mat-icon class="text-gray-400 text-sm transition-transform duration-200" [class.rotate-180]="!section.expanded">expand_more</mat-icon>
              </button>
              
              @if (section.expanded) {
                <div class="p-3 bg-white grid grid-cols-1 gap-3 border-t border-gray-200">
                  @for (item of section.items; track item.name) {
                    <div 
                      cdkDrag 
                      [cdkDragData]="item" 
                      class="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-white border border-gray-200 hover:border-blue-400 rounded-lg cursor-move transition-all shadow-xs hover:shadow-md group"
                    >
                      <div class="flex items-center gap-3 w-full">
                        <mat-icon class="text-gray-400 group-hover:text-blue-500">{{ item.icon }}</mat-icon>
                        <span class="text-xs text-gray-600 font-medium">{{ item.name }}</span>
                      </div>
                      
                      <!-- Drag Preview -->
                      <div *cdkDragPreview class="bg-white p-4 rounded-lg shadow-xl border border-blue-500 opacity-90 flex items-center gap-2 z-50">
                        <mat-icon class="text-blue-500">{{ item.icon }}</mat-icon>
                        <span class="font-medium">{{ item.name }}</span>
                      </div>

                      <!-- Drag Placeholder -->
                      <div *cdkDragPlaceholder class="flex flex-col items-center justify-center p-3 bg-gray-50 border border-gray-200 rounded-lg opacity-50">
                        <mat-icon class="text-gray-400">{{ item.icon }}</mat-icon>
                        <span class="text-xs text-gray-600 font-medium text-center">{{ item.name }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        }
      </div>
    </div>
  `
})
export class SidebarComponent {
  pageService = inject(PageService);
  builderService = inject(BuilderService);

  requestCreatePage = output<void>();
  requestAttachFile = output<string>();

  activeTab: 'components' | 'sections' = 'components';

  categories = [
    // ... existing categories ...
    {
      name: 'Layout',
      expanded: true,
      items: [
        { name: 'Container', icon: 'crop_square', html: '<div class="container mx-auto p-4 border border-dashed border-gray-300 min-h-[100px]"></div>', category: 'Layout' },
        { name: 'Grid Row', icon: 'view_column', html: '<div class="grid grid-cols-2 gap-4 p-4 border border-dashed border-gray-300"><div class="p-4 border border-gray-200 bg-gray-50">Col 1</div><div class="p-4 border border-gray-200 bg-gray-50">Col 2</div></div>', category: 'Layout' },
        { name: 'Card', icon: 'web_asset', html: '<div class="bg-white rounded-lg shadow-md p-6 mb-4"><h3 class="text-xl font-bold mb-2">Card Title</h3><p class="text-gray-600">Card content goes here.</p></div>', category: 'Layout' }
      ]
    },
    {
      name: 'Typography',
      expanded: false,
      items: [
        { name: 'Heading 1', icon: 'title', html: '<h1 class="text-4xl font-bold text-gray-900 mb-4">Heading 1</h1>', category: 'Typography' },
        { name: 'Heading 2', icon: 'title', html: '<h2 class="text-3xl font-semibold text-gray-800 mb-3">Heading 2</h2>', category: 'Typography' },
        { name: 'Paragraph', icon: 'short_text', html: '<p class="text-base text-gray-600 leading-relaxed mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>', category: 'Typography' },
        { name: 'Blockquote', icon: 'format_quote', html: '<blockquote class="border-l-4 border-blue-500 pl-4 italic text-gray-700 my-4">"This is a blockquote element."</blockquote>', category: 'Typography' }
      ]
    },
    {
      name: 'Elements',
      expanded: false,
      items: [
        { name: 'Button', icon: 'smart_button', html: '<button class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">Click Me</button>', category: 'Elements' },
        { name: 'Image', icon: 'image', html: '<img src="https://picsum.photos/seed/nature/400/300" alt="Placeholder" class="rounded-lg shadow-xs w-full object-cover h-48" referrerpolicy="no-referrer" />', category: 'Elements' },
        { name: 'Input Text', icon: 'input', html: '<input type="text" placeholder="Enter text..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden" />', category: 'Elements' },
        { name: 'Textarea', icon: 'notes', html: '<textarea placeholder="Enter long text..." rows="4" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"></textarea>', category: 'Elements' },
        { name: 'Select', icon: 'arrow_drop_down_circle', html: '<select class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"><option value="">Select an option</option><option value="1">Option 1</option><option value="2">Option 2</option></select>', category: 'Elements' },
        { name: 'Checkbox', icon: 'check_box', html: '<div class="flex items-center gap-2"><input type="checkbox" id="check1" class="w-4 h-4 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500"><label for="check1" class="text-gray-700">Checkbox Label</label></div>', category: 'Elements' },
        { name: 'Radio', icon: 'radio_button_checked', html: '<div class="flex items-center gap-2"><input type="radio" name="radio-group" id="radio1" class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"><label for="radio1" class="text-gray-700">Radio Option</label></div>', category: 'Elements' },
        { name: 'Date Input', icon: 'calendar_today', html: '<input type="date" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden" />', category: 'Elements' },
        { name: 'Color Picker', icon: 'palette', html: '<div class="flex items-center gap-2"><input type="color" class="h-10 w-10 p-1 rounded-sm border border-gray-300 cursor-pointer"><span class="text-gray-600">Pick a color</span></div>', category: 'Elements' },
        { name: 'Range Slider', icon: 'linear_scale', html: '<div class="w-full"><label class="block text-sm font-medium text-gray-700 mb-1">Range</label><input type="range" min="0" max="100" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"></div>', category: 'Elements' },
        { name: 'File Upload', icon: 'upload_file', html: '<input type="file" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />', category: 'Elements' },
        { name: 'Progress Bar', icon: 'hourglass_bottom', html: '<div class="w-full bg-gray-200 rounded-full h-2.5"><div class="bg-blue-600 h-2.5 rounded-full" style="width: 45%"></div></div>', category: 'Elements' },
        { name: 'Link', icon: 'link', html: '<a href="#" class="text-blue-600 hover:text-blue-800 hover:underline">This is a link</a>', category: 'Elements' },
        { name: 'Video', icon: 'movie', html: '<video controls class="w-full rounded-lg shadow-xs"><source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4">Your browser does not support the video tag.</video>', category: 'Elements' },
        { name: 'Audio', icon: 'audiotrack', html: '<audio controls class="w-full"><source src="https://www.w3schools.com/html/horse.mp3" type="audio/mpeg">Your browser does not support the audio element.</audio>', category: 'Elements' },
        { name: 'Code', icon: 'code', html: '<code class="bg-gray-100 rounded-sm px-2 py-1 text-sm font-mono text-pink-600">const x = 10;</code>', category: 'Elements' },
        { name: 'Horizontal Rule', icon: 'horizontal_rule', html: '<hr class="my-4 border-t border-gray-300" />', category: 'Elements' },
        { name: 'Form', icon: 'dynamic_form', html: '<form class="space-y-4 p-4 border border-gray-200 rounded-lg bg-white"><div class="flex flex-col gap-1"><label class="text-sm font-medium text-gray-700">Email</label><input type="email" placeholder="user@example.com" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500"></div><div class="flex flex-col gap-1"><label class="text-sm font-medium text-gray-700">Password</label><input type="password" placeholder="••••••••" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500"></div><button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">Sign In</button></form>', category: 'Elements' },
        { name: 'Label', icon: 'label', html: '<label class="block text-sm font-medium text-gray-700 mb-1">Label Text</label>', category: 'Elements' },
        { name: 'Span', icon: 'short_text', html: '<span class="text-sm text-gray-500">Helper text or inline description</span>', category: 'Elements' },
        { name: 'Fieldset', icon: 'crop_free', html: '<fieldset class="border border-gray-300 rounded-lg p-4"><legend class="px-2 text-sm font-medium text-gray-700">Group Title</legend><div class="space-y-2"><p class="text-sm text-gray-600">Form content goes here...</p></div></fieldset>', category: 'Elements' },
        { name: 'Unordered List', icon: 'format_list_bulleted', html: '<ul class="list-disc list-inside space-y-1 text-gray-700"><li>List item 1</li><li>List item 2</li><li>List item 3</li></ul>', category: 'Elements' },
        { name: 'Ordered List', icon: 'format_list_numbered', html: '<ol class="list-decimal list-inside space-y-1 text-gray-700"><li>First item</li><li>Second item</li><li>Third item</li></ol>', category: 'Elements' },
        { name: 'Table', icon: 'table_chart', html: '<table class="min-w-full bg-white border border-gray-300"><thead><tr class="bg-gray-100"><th class="py-2 px-4 border-b text-left">Header 1</th><th class="py-2 px-4 border-b text-left">Header 2</th></tr></thead><tbody><tr><td class="py-2 px-4 border-b">Row 1, Cell 1</td><td class="py-2 px-4 border-b">Row 1, Cell 2</td></tr><tr><td class="py-2 px-4 border-b">Row 2, Cell 1</td><td class="py-2 px-4 border-b">Row 2, Cell 2</td></tr></tbody></table>', category: 'Elements' },
        { name: 'Iframe', icon: 'web', html: '<iframe src="https://www.example.com" class="w-full h-64 border border-gray-300 rounded-lg" title="Iframe Example"></iframe>', category: 'Elements' },
        { name: 'Strong Text', icon: 'format_bold', html: '<strong class="font-bold text-gray-900">Bold text</strong>', category: 'Elements' },
        { name: 'Small Text', icon: 'format_size', html: '<small class="text-xs text-gray-500">Small fine print text</small>', category: 'Elements' }
      ]
    },
    {
      name: 'DYMER Base',
      expanded: false,
      items: [
        { name: 'Entity Status', icon: 'traffic', html: '<div data-component-entitystatus data-vvveb-disabled class="row">{{{EntityStatus this}}}</div>', category: 'DYMER Base' },
        { name: 'Pagination', icon: 'pages', html: '<div data-component-dpagination class="row" d-pagination-size="6">{{{DymerPagination this}}}</div>', category: 'DYMER Base' },
        { name: 'Geo Point', icon: 'location_on', html: '<div class="geopointcontgrp form-group field-description"><label class="kms-title-label">Geo Point</label><div><div data-component-geopoint class="form-group"><input type="hidden" class="form-control" name="data[location][type]" value="Point"><label class="kms-title-label">Longitude</label><input type="number" class="form-control" name="data[location][coordinates][0]"><label class="kms-title-label">Latitudine</label><input type="number" class="form-control" name="data[location][coordinates][1]"></div></div></div>', category: 'DYMER Base' },
        { name: 'Relation', icon: 'hub', html: '<div class="relationcontgrp form-group field-description"><label class="kms-title-label">Relation</label><div><div data-component-kmsrelation class="form-group" contenteditable="false" data-torelation=""><span contenteditable="false" class="inforelation">Relation</span> <i class="fa fa-code-fork rotandflip inforelation" aria-hidden="true"></i> <span contenteditable="false" class="torelation inforelation">......</span></div></div></div>', category: 'DYMER Base' },
        { name: 'Relation Picker', icon: 'settings_input_component', html: '<div class="form-group"><label class="kms-title-label">Relation</label><div><div data-component-dymrelation class="form-group dymerselectpicker" data-torelation=""><span class="inforelation">Relation</span> <i class="fa fa-code-fork rotandflip inforelation" aria-hidden="true"></i> <span contenteditable="false" class="torelation inforelation">......</span></div></div></div>', category: 'DYMER Base' },
        { name: 'Dymer Input', icon: 'input', html: '<div class="form-group"><label>Text</label><input data-component-dymerinput class="form-control" type="text"></div>', category: 'DYMER Base' },
        { name: 'Taxonomy', icon: 'category', html: '<div class="form-group"><label class="kms-title-label">Taxonomy</label><div><div data-component-kmstaxonomy class="form-group dymertaxonomy" data-totaxonomy=""><span class="infotaxonomy">Taxonomy</span> <i class="fa fa-code-fork rotandflip infotaxonomy" aria-hidden="true"></i> <span contenteditable="false" class="totaxonomy infotaxonomy">......</span></div></div></div>', category: 'DYMER Base' },
        { name: 'Entity Tags', icon: 'tag', html: '<div class="form-group"><label class="kms-title-label">Tags</label><div class="form-group repeatable first-repeatable"><div><label>Tag Name</label><input type="text" class="form-control col-12 span12" name="data[hashtags][0]"><small class="form-text text-muted">Insert tag</small></div><div class="action-br"><span class="btn btn-outline-primary btn-sm">+</span><span class="btn btn-outline-danger btn-sm act-remove">-</span></div></div></div>', category: 'DYMER Base' },
        { name: 'Tags View', icon: 'style', html: '<div class="row dwhashlist">{{{DymerViewTags this.hashtags}}}</div>', category: 'DYMER Base' },
        { name: 'Link Details', icon: 'visibility', html: '<span class="pull-right text-info" style="padding-top: 10px;cursor:pointer">View More</span>', category: 'DYMER Base' },
        { name: 'Dymer Image', icon: 'image', html: '<img src="{{cdnpath}}api/entities/api/v1/entity/content/{{<object-key>.id}}">', category: 'DYMER Base' }
      ]
    },
    {
      name: 'Bootstrap 5',
      expanded: false,
      items: [
        { name: 'BS Container', icon: 'crop_square', html: '<div class="container p-4 border border-dashed text-center">Bootstrap Container</div>', category: 'Bootstrap 5' },
        { name: 'BS Row/Col', icon: 'view_column', html: '<div class="container"><div class="row"><div class="col-sm p-3 border bg-light">One of three columns</div><div class="col-sm p-3 border bg-light">One of three columns</div><div class="col-sm p-3 border bg-light">One of three columns</div></div></div>', category: 'Bootstrap 5' },
        { name: 'BS Button Primary', icon: 'smart_button', html: '<button type="button" class="btn btn-primary">Primary</button>', category: 'Bootstrap 5' },
        { name: 'BS Button Secondary', icon: 'smart_button', html: '<button type="button" class="btn btn-secondary">Secondary</button>', category: 'Bootstrap 5' },
        { name: 'BS Alert', icon: 'warning', html: '<div class="alert alert-primary" role="alert">A simple primary alert—check it out!</div>', category: 'Bootstrap 5' },
        { name: 'BS Card', icon: 'web_asset', html: '<div class="card" style="width: 18rem;"><img src="https://picsum.photos/seed/card/300/200" class="card-img-top" alt="..." referrerpolicy="no-referrer"><div class="card-body"><h5 class="card-title">Card title</h5><p class="card-text">Some quick example text to build on the card title and make up the bulk of the card\'s content.</p><a href="#" class="btn btn-primary">Go somewhere</a></div></div>', category: 'Bootstrap 5' },
        { name: 'BS Navbar', icon: 'menu', html: '<nav class="navbar navbar-expand-lg bg-body-tertiary"><div class="container-fluid"><a class="navbar-brand" href="#">Navbar</a><button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button><div class="collapse navbar-collapse" id="navbarNav"><ul class="navbar-nav"><li class="nav-item"><a class="nav-link active" aria-current="page" href="#">Home</a></li><li class="nav-item"><a class="nav-link" href="#">Features</a></li><li class="nav-item"><a class="nav-link" href="#">Pricing</a></li></ul></div></div></nav>', category: 'Bootstrap 5' },
        { name: 'BS Input Group', icon: 'input', html: '<div class="input-group mb-3"><span class="input-group-text" id="basic-addon1">@</span><input type="text" class="form-control" placeholder="Username" aria-label="Username" aria-describedby="basic-addon1"></div>', category: 'Bootstrap 5' },
        { name: 'BS List Group', icon: 'list', html: '<ul class="list-group"><li class="list-group-item">An item</li><li class="list-group-item">A second item</li><li class="list-group-item">A third item</li></ul>', category: 'Bootstrap 5' },
        { name: 'BS Badge', icon: 'label', html: '<span class="badge text-bg-primary">Primary</span>', category: 'Bootstrap 5' }
      ]
    },
    {
      name: 'Tailwind Base',
      expanded: false,
      items: [
        { name: 'Container', icon: 'crop_square', html: '<div class="container mx-auto px-4 p-4 border border-dashed border-gray-300">Container Content</div>', category: 'Tailwind Base' },
        { name: 'Grid', icon: 'grid_view', html: '<div class="grid grid-cols-1 md:grid-cols-3 gap-4"><div class="bg-gray-100 p-4 rounded-sm border border-gray-200">1</div><div class="bg-gray-100 p-4 rounded-sm border border-gray-200">2</div><div class="bg-gray-100 p-4 rounded-sm border border-gray-200">3</div></div>', category: 'Tailwind Base' },
        { name: 'Flex Row', icon: 'view_column', html: '<div class="flex flex-row gap-4 items-center"><div class="bg-gray-100 p-4 rounded-sm border border-gray-200">Item 1</div><div class="bg-gray-100 p-4 rounded-sm border border-gray-200">Item 2</div></div>', category: 'Tailwind Base' },
        { name: 'Flex Col', icon: 'view_stream', html: '<div class="flex flex-col gap-4"><div class="bg-gray-100 p-4 rounded-sm border border-gray-200">Item 1</div><div class="bg-gray-100 p-4 rounded-sm border border-gray-200">Item 2</div></div>', category: 'Tailwind Base' },
        { name: 'Card', icon: 'web_asset', html: '<div class="max-w-sm rounded-sm overflow-hidden shadow-lg bg-white border border-gray-200"><img class="w-full" src="https://picsum.photos/seed/card/400/200" alt="Card image" referrerpolicy="no-referrer"><div class="px-6 py-4"><div class="font-bold text-xl mb-2">The Coldest Sunset</div><p class="text-gray-700 text-base">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptatibus quia, nulla! Maiores et perferendis eaque, exercitationem praesentium nihil.</p></div><div class="px-6 pt-4 pb-2"><span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">#photography</span><span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">#travel</span><span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">#winter</span></div></div>', category: 'Tailwind Base' },
        { name: 'Button', icon: 'smart_button', html: '<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-sm transition-colors">Button</button>', category: 'Tailwind Base' },
        { name: 'Alert', icon: 'warning', html: '<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-sm relative" role="alert"><strong class="font-bold">Holy smokes!</strong><span class="block sm:inline"> Something seriously bad happened.</span></div>', category: 'Tailwind Base' },
        { name: 'Badge', icon: 'label', html: '<span class="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">Badge</span>', category: 'Tailwind Base' },
        { name: 'Input Group', icon: 'input', html: '<div class="w-full max-w-xs"><label class="block text-gray-700 text-sm font-bold mb-2" for="username">Username</label><input class="shadow-sm appearance-none border rounded-sm w-full py-2 px-3 text-gray-700 leading-tight focus:outline-hidden focus:shadow-outline" id="username" type="text" placeholder="Username"></div>', category: 'Tailwind Base' },
        { name: 'Navbar', icon: 'menu', html: '<nav class="flex items-center justify-between flex-wrap bg-teal-500 p-6"><div class="flex items-center shrink-0 text-white mr-6"><span class="font-semibold text-xl tracking-tight">Tailwind CSS</span></div><div class="block lg:hidden"><button class="flex items-center px-3 py-2 border rounded-sm text-teal-200 border-teal-400 hover:text-white hover:border-white"><svg class="fill-current h-3 w-3" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Menu</title><path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"/></svg></button></div><div class="w-full block grow lg:flex lg:items-center lg:w-auto"><div class="text-sm lg:grow"><a href="#responsive-header" class="block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white mr-4">Docs</a><a href="#responsive-header" class="block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white mr-4">Examples</a><a href="#responsive-header" class="block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white">Blog</a></div><div><a href="#" class="inline-block text-sm px-4 py-2 leading-none border rounded-sm text-white border-white hover:border-transparent hover:text-teal-500 hover:bg-white mt-4 lg:mt-0">Download</a></div></div></nav>', category: 'Tailwind Base' },
        { name: 'Footer', icon: 'maximize', html: '<footer class="bg-white rounded-lg shadow-sm m-4 dark:bg-gray-800"><div class="w-full mx-auto max-w-(--breakpoint-xl) p-4 md:flex md:items-center md:justify-between"><span class="text-sm text-gray-500 sm:text-center dark:text-gray-400">© 2023 <a href="https://flowbite.com/" class="hover:underline">Flowbite™</a>. All Rights Reserved.</span><ul class="flex flex-wrap items-center mt-3 text-sm font-medium text-gray-500 dark:text-gray-400 sm:mt-0"><li><a href="#" class="hover:underline me-4 md:me-6">About</a></li><li><a href="#" class="hover:underline me-4 md:me-6">Privacy Policy</a></li><li><a href="#" class="hover:underline me-4 md:me-6">Licensing</a></li><li><a href="#" class="hover:underline">Contact</a></li></ul></div></footer>', category: 'Tailwind Base' }
      ]
    }
  ];

  sections = [
    {
      name: 'Hero',
      expanded: false,
      items: [
        { 
          name: 'Simple Hero', 
          icon: 'web_asset', 
          html: '<section class="bg-white dark:bg-gray-900 py-20"><div class="container mx-auto px-4 text-center"><h1 class="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Welcome to Our Service</h1><p class="text-xl text-gray-600 dark:text-gray-300 mb-8">We create amazing experiences for our customers.</p><div class="flex justify-center gap-4"><button class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">Get Started</button><button class="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300">Learn More</button></div></div></section>', 
          category: 'Hero' 
        },
        { 
          name: 'Hero with Image', 
          icon: 'image', 
          html: '<section class="bg-gray-50 dark:bg-gray-800 py-16"><div class="container mx-auto px-4 flex flex-col md:flex-row items-center"><div class="md:w-1/2 mb-8 md:mb-0"><h1 class="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Grow Your Business</h1><p class="text-lg text-gray-600 dark:text-gray-300 mb-6">Leverage our tools to scale your operations effectively.</p><button class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">Start Now</button></div><div class="md:w-1/2"><img src="https://picsum.photos/seed/business/600/400" alt="Hero Image" class="rounded-lg shadow-lg w-full" referrerpolicy="no-referrer"></div></div></section>', 
          category: 'Hero' 
        }
      ]
    },
    {
      name: 'Features',
      expanded: false,
      items: [
        { 
          name: '3 Column Features', 
          icon: 'view_column', 
          html: '<section class="py-16 bg-white dark:bg-gray-900"><div class="container mx-auto px-4"><h2 class="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">Our Features</h2><div class="grid md:grid-cols-3 gap-8"><div class="text-center p-6"><div class="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><span class="text-2xl">🚀</span></div><h3 class="text-xl font-bold mb-2 text-gray-900 dark:text-white">Fast Performance</h3><p class="text-gray-600 dark:text-gray-400">Optimized for speed and efficiency.</p></div><div class="text-center p-6"><div class="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><span class="text-2xl">🛡️</span></div><h3 class="text-xl font-bold mb-2 text-gray-900 dark:text-white">Secure</h3><p class="text-gray-600 dark:text-gray-400">Your data is safe with us.</p></div><div class="text-center p-6"><div class="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><span class="text-2xl">⚙️</span></div><h3 class="text-xl font-bold mb-2 text-gray-900 dark:text-white">Customizable</h3><p class="text-gray-600 dark:text-gray-400">Tailor it to your needs.</p></div></div></div></section>', 
          category: 'Features' 
        }
      ]
    },
    {
      name: 'Service',
      expanded: false,
      items: [
        { 
          name: 'Service List', 
          icon: 'list', 
          html: '<section class="py-16 bg-gray-50 dark:bg-gray-800"><div class="container mx-auto px-4"><h2 class="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">Our Services</h2><div class="grid md:grid-cols-2 gap-8"><div class="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-xs"><h3 class="text-xl font-bold mb-2 text-blue-600">Web Development</h3><p class="text-gray-600 dark:text-gray-300">Building responsive and modern websites.</p></div><div class="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-xs"><h3 class="text-xl font-bold mb-2 text-blue-600">Mobile Apps</h3><p class="text-gray-600 dark:text-gray-300">Native and cross-platform mobile solutions.</p></div><div class="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-xs"><h3 class="text-xl font-bold mb-2 text-blue-600">UI/UX Design</h3><p class="text-gray-600 dark:text-gray-300">Creating intuitive user interfaces.</p></div><div class="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-xs"><h3 class="text-xl font-bold mb-2 text-blue-600">Consulting</h3><p class="text-gray-600 dark:text-gray-300">Expert advice for your digital strategy.</p></div></div></div></section>', 
          category: 'Service' 
        }
      ]
    },
    {
      name: 'Clients',
      expanded: false,
      items: [
        { 
          name: 'Client Logos', 
          icon: 'groups', 
          html: '<section class="py-12 bg-white dark:bg-gray-900"><div class="container mx-auto px-4"><p class="text-center text-gray-500 mb-8 uppercase tracking-widest text-sm">Trusted by</p><div class="flex flex-wrap justify-center items-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all"><div class="text-2xl font-bold text-gray-400">GOOGLE</div><div class="text-2xl font-bold text-gray-400">AMAZON</div><div class="text-2xl font-bold text-gray-400">MICROSOFT</div><div class="text-2xl font-bold text-gray-400">SPOTIFY</div></div></div></section>', 
          category: 'Clients' 
        }
      ]
    },
    {
      name: 'Contact Form',
      expanded: false,
      items: [
        { 
          name: 'Simple Contact', 
          icon: 'contact_mail', 
          html: '<section class="py-16 bg-white dark:bg-gray-900"><div class="container mx-auto px-4 max-w-lg"><h2 class="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">Contact Us</h2><form class="space-y-4"><div class="flex flex-col"><label class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Name</label><input type="text" class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden dark:bg-gray-800 dark:border-gray-700 dark:text-white"></div><div class="flex flex-col"><label class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Email</label><input type="email" class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden dark:bg-gray-800 dark:border-gray-700 dark:text-white"></div><div class="flex flex-col"><label class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Message</label><textarea rows="4" class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden dark:bg-gray-800 dark:border-gray-700 dark:text-white"></textarea></div><button type="button" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium">Send Message</button></form></div></section>', 
          category: 'Contact Form' 
        }
      ]
    },
    {
      name: 'Counter',
      expanded: false,
      items: [
        { 
          name: 'Stats Counter', 
          icon: 'numbers', 
          html: '<section class="py-16 bg-blue-600 text-white"><div class="container mx-auto px-4"><div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"><div><div class="text-4xl font-bold mb-2">10k+</div><div class="text-blue-100">Users</div></div><div><div class="text-4xl font-bold mb-2">500+</div><div class="text-blue-100">Projects</div></div><div><div class="text-4xl font-bold mb-2">99%</div><div class="text-blue-100">Satisfaction</div></div><div><div class="text-4xl font-bold mb-2">24/7</div><div class="text-blue-100">Support</div></div></div></div></section>', 
          category: 'Counter' 
        }
      ]
    },
    {
      name: 'CTA',
      expanded: false,
      items: [
        { 
          name: 'Simple CTA', 
          icon: 'call_to_action', 
          html: '<section class="py-16 bg-gray-100 dark:bg-gray-800"><div class="container mx-auto px-4 text-center"><h2 class="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Ready to get started?</h2><p class="text-xl text-gray-600 dark:text-gray-300 mb-8">Join thousands of satisfied customers today.</p><button class="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 shadow-lg transition-transform hover:scale-105">Sign Up Now</button></div></section>', 
          category: 'CTA' 
        }
      ]
    },
    {
      name: 'Footer',
      expanded: false,
      items: [
        { 
          name: 'Simple Footer', 
          icon: 'maximize', 
          html: '<footer class="bg-gray-900 text-white py-8"><div class="container mx-auto px-4"><div class="flex flex-col md:flex-row justify-between items-center"><div class="mb-4 md:mb-0"><span class="text-xl font-bold">BrandName</span></div><div class="flex space-x-6"><a href="#" class="hover:text-blue-400">Home</a><a href="#" class="hover:text-blue-400">About</a><a href="#" class="hover:text-blue-400">Services</a><a href="#" class="hover:text-blue-400">Contact</a></div></div><div class="mt-8 text-center text-gray-500 text-sm">© 2024 BrandName. All rights reserved.</div></div></footer>', 
          category: 'Footer' 
        }
      ]
    }
  ];

  loadPage(id: string) {
    const content = this.pageService.loadPage(id);
    if (content) {
      this.builderService.updateContent(content);
    }
  }

  deletePage(event: Event, id: string) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this page?')) {
      this.pageService.deletePage(id);
      // If we deleted the current page, clear the canvas or load another one
      if (this.pageService.currentPageId() === null) {
        this.builderService.updateContent('<div class="p-8 text-center text-gray-400">Select or create a page</div>');
      }
    }
  }

  toggleCategory(name: string) {
    const category = this.categories.find(c => c.name === name);
    if (category) {
      category.expanded = !category.expanded;
    }
  }

  toggleSection(name: string) {
    const section = this.sections.find(s => s.name === name);
    if (section) {
      section.expanded = !section.expanded;
    }
  }

  setActiveTab(tab: 'components' | 'sections') {
    this.activeTab = tab;
  }

  onAttachClick(event: Event, pageId: string) {
    event.stopPropagation();
    this.requestAttachFile.emit(pageId);
  }
}
