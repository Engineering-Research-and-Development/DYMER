import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BuilderService } from '../builder.service';
import { MatIconModule } from '@angular/material/icon';

interface NavigatorNode {
  id: string;
  tagName: string;
  idAttr: string;
  depth: number;
  element: HTMLElement;
  hasChildren: boolean;
  expanded: boolean;
}

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="flex flex-col h-full bg-white">
      <div class="flex border-b border-gray-200 bg-gray-50">
        <button 
          (click)="activeTab = 'properties'" 
          class="flex-1 py-3 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors"
          [class.border-blue-500]="activeTab === 'properties'"
          [class.text-blue-600]="activeTab === 'properties'"
          [class.border-transparent]="activeTab !== 'properties'"
          [class.text-gray-500]="activeTab !== 'properties'"
        >
          <mat-icon class="text-sm">tune</mat-icon>
          Properties
        </button>
        <button 
          (click)="activeTab = 'navigator'" 
          class="flex-1 py-3 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors"
          [class.border-blue-500]="activeTab === 'navigator'"
          [class.text-blue-600]="activeTab === 'navigator'"
          [class.border-transparent]="activeTab !== 'navigator'"
          [class.text-gray-500]="activeTab !== 'navigator'"
        >
          <mat-icon class="text-sm">layers</mat-icon>
          Navigator
        </button>
      </div>

      @if (activeTab === 'properties') {
        @if (selectedElement(); as el) {
          <div class="flex-1 overflow-y-auto p-4 space-y-6">
            
            <!-- Element Info -->
            <div class="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
              <div class="text-xs text-blue-500 font-semibold uppercase mb-1">Selected Element</div>
              <div class="text-sm font-mono text-blue-800 font-bold flex items-center justify-between">
                &lt;{{ el.tagName.toLowerCase() }}&gt;
                <span class="text-xs font-normal text-blue-400">#{{ el.id || 'no-id' }}</span>
              </div>
              
              <!-- Content Editable Toggle -->
              <div class="flex items-center justify-between mt-3 pt-2 border-t border-blue-200">
                <span class="text-xs text-blue-600 font-medium">Edit on Canvas</span>
                <button 
                  (click)="toggleContentEditable()" 
                  class="p-1.5 rounded-sm transition-colors flex items-center justify-center"
                  [class.bg-blue-200]="isContentEditable()"
                  [class.text-blue-800]="isContentEditable()"
                  [class.bg-white]="!isContentEditable()"
                  [class.text-blue-400]="!isContentEditable()"
                  [class.hover:bg-blue-100]="!isContentEditable()"
                  title="Toggle Content Editable"
                >
                  <mat-icon class="text-[18px] w-[18px] h-[18px] leading-[18px]">edit</mat-icon>
                </button>
              </div>

              <!-- Edit Inner HTML Toggle -->
              <div class="flex items-center justify-between mt-2">
                <span class="text-xs text-blue-600 font-medium">Edit Inner HTML</span>
                <button 
                  (click)="showHtmlEditor.set(!showHtmlEditor())" 
                  class="p-1.5 rounded-sm transition-colors flex items-center justify-center"
                  [class.bg-blue-200]="showHtmlEditor()"
                  [class.text-blue-800]="showHtmlEditor()"
                  [class.bg-white]="!showHtmlEditor()"
                  [class.text-blue-400]="!showHtmlEditor()"
                  [class.hover:bg-blue-100]="!showHtmlEditor()"
                  title="Edit Inner HTML"
                >
                  <mat-icon class="text-[18px] w-[18px] h-[18px] leading-[18px]">code</mat-icon>
                </button>
              </div>
              
              @if (showHtmlEditor()) {
                <div class="mt-2">
                  <textarea 
                    [ngModel]="el.innerHTML" 
                    (ngModelChange)="updateContent($event)"
                    class="w-full px-3 py-2 border border-blue-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-hidden min-h-[100px] font-mono text-xs"
                    placeholder="<div>HTML content...</div>"
                  ></textarea>
                </div>
              }
            </div>

            <!-- Content (if applicable) -->
            @if (canEditContent(el)) {
              <div>
                <label class="block text-xs font-medium text-gray-500 uppercase mb-2">
                  Content
                  <textarea 
                    [ngModel]="el.innerHTML" 
                    (ngModelChange)="updateContent($event)"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-hidden min-h-[100px] mt-1"
                  ></textarea>
                </label>
              </div>
            }

            <!-- Attributes -->
            <div>
              <div class="block text-xs font-medium text-gray-500 uppercase mb-2">Attributes</div>
              <div class="space-y-3">
                <div>
                  <label class="block">
                    <span class="text-xs text-gray-400 mb-1 block">ID</span>
                    <input 
                      [ngModel]="el.id" 
                      (ngModelChange)="updateAttribute('id', $event)"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                      placeholder="element-id"
                    />
                  </label>
                </div>
                <div>
                  <label class="block">
                    <span class="text-xs text-gray-400 mb-1 block">Classes</span>
                    <input 
                      [ngModel]="el.className" 
                      (ngModelChange)="updateAttribute('class', $event)"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                      placeholder="class names..."
                    />
                  </label>
                </div>
                
                @if (el.tagName === 'IMG') {
                  <div>
                    <label class="block">
                      <span class="text-xs text-gray-400 mb-1 block">Src</span>
                      <input 
                        [ngModel]="el.getAttribute('src')" 
                        (ngModelChange)="updateAttribute('src', $event)"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                      />
                    </label>
                  </div>
                }
                
                @if (el.tagName === 'A') {
                  <div>
                    <label class="block">
                      <span class="text-xs text-gray-400 mb-1 block">Href</span>
                      <input 
                        [ngModel]="el.getAttribute('href')" 
                        (ngModelChange)="updateAttribute('href', $event)"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                      />
                    </label>
                  </div>
                }

                <!-- Name -->
                <div>
                  <label class="block">
                    <span class="text-xs text-gray-400 mb-1 block">Name</span>
                    <input 
                      [ngModel]="el.getAttribute('name')" 
                      (ngModelChange)="updateAttribute('name', $event)"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                      placeholder="field_name"
                    />
                  </label>
                </div>

                <!-- Form Attributes -->
                @if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
                   <div class="flex gap-4 mt-2 border-t border-gray-100 pt-2">
                      <label class="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          [ngModel]="el.hasAttribute('readonly')"
                          (ngModelChange)="updateBooleanAttribute('readonly', $event)"
                          class="w-4 h-4 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500"
                        >
                        <span class="text-xs text-gray-600">Readonly</span>
                      </label>
                      
                      <label class="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          [ngModel]="el.hasAttribute('required')"
                          (ngModelChange)="updateBooleanAttribute('required', $event)"
                          class="w-4 h-4 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500"
                        >
                        <span class="text-xs text-gray-600">Required</span>
                      </label>
                   </div>
                }
              </div>
            </div>

            <!-- Dymer Components Properties -->
            @if (getDymerType(el); as dymerType) {
              <div class="mt-4 border-t border-gray-200 pt-4">
                <div class="text-xs font-semibold text-blue-600 uppercase mb-3">Dymer Properties: {{ dymerType }}</div>
                
                <!-- Pagination -->
                @if (dymerType === 'dpagination') {
                  <div class="space-y-3">
                    <label class="block">
                      <span class="text-xs text-gray-400 mb-1 block">Pagination Size</span>
                      <input 
                        [ngModel]="el.getAttribute('d-pagination-size')" 
                        (ngModelChange)="updateAttribute('d-pagination-size', $event)"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </label>
                  </div>
                }

                <!-- Geo Point -->
                @if (dymerType === 'geopoint') {
                  <div class="space-y-3">
                    <label class="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        [ngModel]="el.classList.contains('repeatable')"
                        (ngModelChange)="toggleRepeatable(el, $event)"
                        class="w-4 h-4 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500"
                      >
                      <span class="text-xs text-gray-600">Repeatable</span>
                    </label>
                  </div>
                }

                <!-- Relation -->
                @if (dymerType === 'kmsrelation') {
                  <div class="space-y-3">
                    <label class="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        [ngModel]="el.hasAttribute('required')"
                        (ngModelChange)="updateBooleanAttribute('required', $event)"
                        class="w-4 h-4 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500"
                      >
                      <span class="text-xs text-gray-600">Required</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        [ngModel]="el.classList.contains('repeatable')"
                        (ngModelChange)="toggleRepeatable(el, $event)"
                        class="w-4 h-4 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500"
                      >
                      <span class="text-xs text-gray-600">Repeatable</span>
                    </label>
                    <label class="block">
                      <span class="text-xs text-gray-400 mb-1 block">Nested Field</span>
                      <input 
                        [ngModel]="el.getAttribute('data-nestedfield')" 
                        (ngModelChange)="updateAttribute('data-nestedfield', $event)"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </label>
                    <label class="block">
                      <span class="text-xs text-gray-400 mb-1 block">List of Entities (Relation)</span>
                      <input 
                        [ngModel]="el.getAttribute('data-torelation')" 
                        (ngModelChange)="updateAttribute('data-torelation', $event)"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Enter entity name"
                      />
                    </label>
                  </div>
                }

                <!-- Relation Picker & Taxonomy (Shared props) -->
                @if (dymerType === 'dymrelation' || dymerType === 'kmstaxonomy') {
                  <div class="space-y-3">
                    <div class="grid grid-cols-2 gap-2">
                       <label class="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          [ngModel]="el.getAttribute('data-live-search') === 'true'"
                          (ngModelChange)="updateStringBooleanAttribute('data-live-search', $event)"
                          class="w-4 h-4 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500"
                        >
                        <span class="text-xs text-gray-600">Live Search</span>
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          [ngModel]="el.getAttribute('data-actions-box') === 'true'"
                          (ngModelChange)="updateStringBooleanAttribute('data-actions-box', $event)"
                          class="w-4 h-4 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500"
                        >
                        <span class="text-xs text-gray-600">Actions Box</span>
                      </label>
                    </div>
                    
                    <label class="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        [ngModel]="el.hasAttribute('required')"
                        (ngModelChange)="updateBooleanAttribute('required', $event)"
                        class="w-4 h-4 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500"
                      >
                      <span class="text-xs text-gray-600">Required</span>
                    </label>

                    <label class="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        [ngModel]="el.hasAttribute('multiple')"
                        (ngModelChange)="updateBooleanAttribute('multiple', $event)"
                        class="w-4 h-4 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500"
                      >
                      <span class="text-xs text-gray-600">Repeatable (Multiple)</span>
                    </label>

                    <label class="block">
                      <span class="text-xs text-gray-400 mb-1 block">Max Options</span>
                      <input 
                        [ngModel]="el.getAttribute('data-max-options')" 
                        (ngModelChange)="updateAttribute('data-max-options', $event)"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </label>

                    <label class="block">
                      <span class="text-xs text-gray-400 mb-1 block">
                        {{ dymerType === 'kmstaxonomy' ? 'List of Vocabularies' : 'List of Entities' }}
                      </span>
                      <input 
                        [ngModel]="el.getAttribute(dymerType === 'kmstaxonomy' ? 'data-totaxonomy' : 'data-torelation')" 
                        (ngModelChange)="updateAttribute(dymerType === 'kmstaxonomy' ? 'data-totaxonomy' : 'data-torelation', $event)"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </label>

                    <div class="border-t border-gray-100 pt-2 mt-2">
                      <div class="text-xs font-medium text-gray-500 mb-2">Searchable Options</div>
                      <div class="space-y-2">
                        <label class="block">
                          <span class="text-xs text-gray-400 mb-1 block">Label</span>
                          <input 
                            [ngModel]="el.getAttribute('searchable-label')" 
                            (ngModelChange)="updateAttribute('searchable-label', $event)"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </label>
                        <label class="block">
                          <span class="text-xs text-gray-400 mb-1 block">Text</span>
                          <input 
                            [ngModel]="el.getAttribute('searchable-text')" 
                            (ngModelChange)="updateAttribute('searchable-text', $event)"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </label>
                        <div class="grid grid-cols-2 gap-2">
                          <label class="flex items-center gap-2 cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              [ngModel]="el.getAttribute('searchable-element') === 'true'"
                              (ngModelChange)="updateStringBooleanAttribute('searchable-element', $event)"
                              class="w-4 h-4 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500"
                            >
                            <span class="text-xs text-gray-600">Element</span>
                          </label>
                          <label class="flex items-center gap-2 cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              [ngModel]="el.getAttribute('searchable-multiple') === 'true'"
                              (ngModelChange)="updateStringBooleanAttribute('searchable-multiple', $event)"
                              class="w-4 h-4 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500"
                            >
                            <span class="text-xs text-gray-600">Multiple</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                }

                <!-- Dymer Input -->
                @if (dymerType === 'dymerinput') {
                  <div class="space-y-3">
                    <label class="block">
                      <span class="text-xs text-gray-400 mb-1 block">Value</span>
                      <input 
                        [ngModel]="el.getAttribute('value')" 
                        (ngModelChange)="updateAttribute('value', $event)"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </label>
                    <label class="block">
                      <span class="text-xs text-gray-400 mb-1 block">Placeholder</span>
                      <input 
                        [ngModel]="el.getAttribute('placeholder')" 
                        (ngModelChange)="updateAttribute('placeholder', $event)"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </label>
                    <label class="block">
                      <span class="text-xs text-gray-400 mb-1 block">Type</span>
                      <select 
                        [ngModel]="el.getAttribute('type') || 'text'" 
                        (ngModelChange)="updateAttribute('type', $event)"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="email">Email</option>
                        <option value="password">Password</option>
                        <option value="date">Date</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="radio">Radio</option>
                      </select>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        [ngModel]="el.hasAttribute('required')"
                        (ngModelChange)="updateBooleanAttribute('required', $event)"
                        class="w-4 h-4 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500"
                      >
                      <span class="text-xs text-gray-600">Required</span>
                    </label>
                    
                    <div class="border-t border-gray-100 pt-2 mt-2">
                      <div class="text-xs font-medium text-gray-500 mb-2">Searchable Options</div>
                      <label class="block mb-2">
                        <span class="text-xs text-gray-400 mb-1 block">Override</span>
                        <input 
                          [ngModel]="el.getAttribute('searchable-override')" 
                          (ngModelChange)="updateAttribute('searchable-override', $event)"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </label>
                      <div class="grid grid-cols-2 gap-2">
                        <label class="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            [ngModel]="el.getAttribute('searchable-element') === 'true'"
                            (ngModelChange)="updateStringBooleanAttribute('searchable-element', $event)"
                            class="w-4 h-4 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500"
                          >
                          <span class="text-xs text-gray-600">Element</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            [ngModel]="el.getAttribute('searchable-multiple') === 'true'"
                            (ngModelChange)="updateStringBooleanAttribute('searchable-multiple', $event)"
                            class="w-4 h-4 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500"
                          >
                          <span class="text-xs text-gray-600">Multiple</span>
                        </label>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Styles -->
            <div>
              <div class="block text-xs font-medium text-gray-500 uppercase mb-2">Styles</div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block">
                    <span class="text-xs text-gray-400 mb-1 block">Color</span>
                    <input 
                      type="color"
                      [ngModel]="rgbToHex(el.style.color)" 
                      (ngModelChange)="updateStyle('color', $event)"
                      class="w-full h-8 p-1 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </label>
                </div>
                <div>
                  <label class="block">
                    <span class="text-xs text-gray-400 mb-1 block">Background</span>
                    <input 
                      type="color"
                      [ngModel]="rgbToHex(el.style.backgroundColor)" 
                      (ngModelChange)="updateStyle('backgroundColor', $event)"
                      class="w-full h-8 p-1 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </label>
                </div>
                <div>
                  <label class="block">
                    <span class="text-xs text-gray-400 mb-1 block">Padding (px)</span>
                    <input 
                      type="number"
                      [ngModel]="parseInt(el.style.padding)" 
                      (ngModelChange)="updateStyle('padding', $event + 'px')"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </label>
                </div>
                <div>
                  <label class="block">
                    <span class="text-xs text-gray-400 mb-1 block">Margin (px)</span>
                    <input 
                      type="number"
                      [ngModel]="parseInt(el.style.margin)" 
                      (ngModelChange)="updateStyle('margin', $event + 'px')"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </label>
                </div>
              </div>
            </div>

          </div>
        } @else {
          <div class="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
            <mat-icon class="text-4xl mb-2 opacity-20">touch_app</mat-icon>
            <p class="text-sm">Select an element on the canvas to edit its properties.</p>
          </div>
        }
      } @else {
        <!-- Navigator Tab -->
        <div class="flex-1 overflow-y-auto p-2">
          <div class="text-xs text-gray-400 mb-2 px-2 uppercase font-medium">Page Structure</div>
          <div class="space-y-0.5">
            @for (node of navigatorNodes(); track node.id) {
              <div 
                class="flex items-center p-1 rounded-sm cursor-pointer hover:bg-gray-100 text-xs group relative transition-colors"
                [class.bg-blue-50]="selectedElement() === node.element"
                [class.text-blue-600]="selectedElement() === node.element"
                (click)="selectElement(node.element)"
                (keydown.enter)="selectElement(node.element)"
                tabindex="0"
              >
                <!-- Indentation -->
                <div [style.width.px]="node.depth * 12"></div>

                <!-- Expand Toggle -->
                <div 
                  class="w-4 h-4 flex items-center justify-center mr-1 rounded-sm hover:bg-gray-200 shrink-0 cursor-pointer outline-hidden focus:ring-2 focus:ring-blue-500"
                  (click)="toggleExpand(node.element, $event)"
                  (keydown.enter)="toggleExpand(node.element, $event)"
                  tabindex="0"
                  role="button"
                  [attr.aria-label]="node.expanded ? 'Collapse' : 'Expand'"
                  [style.visibility]="node.hasChildren ? 'visible' : 'hidden'"
                >
                  <mat-icon class="text-[14px] w-[14px] h-[14px] leading-[14px] transition-transform text-gray-400" [class.-rotate-90]="!node.expanded">
                    arrow_drop_down
                  </mat-icon>
                </div>

                <mat-icon class="text-xs mr-2 opacity-70 text-[16px] w-[16px] h-[16px] leading-[16px] shrink-0">
                  {{ getIconForTag(node.tagName) }}
                </mat-icon>
                <span class="truncate font-mono text-xs flex-1">{{ node.tagName.toLowerCase() }}</span>
                @if (node.idAttr) {
                  <span class="ml-2 text-gray-400 text-[10px]">#{{ node.idAttr }}</span>
                }
                
                <!-- Actions -->
                <div class="hidden group-hover:flex items-center gap-1 ml-2 absolute right-2 bg-white/90 shadow-xs rounded-sm border border-gray-200 px-1 z-10">
                  <button (click)="moveUp(node.element, $event)" class="p-1 hover:bg-gray-200 rounded-sm text-gray-600" title="Move Up">
                    <mat-icon class="text-[14px] w-[14px] h-[14px] leading-[14px]">arrow_upward</mat-icon>
                  </button>
                  <button (click)="moveDown(node.element, $event)" class="p-1 hover:bg-gray-200 rounded-sm text-gray-600" title="Move Down">
                    <mat-icon class="text-[14px] w-[14px] h-[14px] leading-[14px]">arrow_downward</mat-icon>
                  </button>
                  <button (click)="deleteElement(node.element, $event)" class="p-1 hover:bg-red-100 rounded-sm text-red-500" title="Delete">
                    <mat-icon class="text-[14px] w-[14px] h-[14px] leading-[14px]">delete</mat-icon>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class PropertiesComponent {
  builderService = inject(BuilderService);
  selectedElement = this.builderService.selectedElement;
  isContentEditable = this.builderService.isContentEditable;
  activeTab: 'properties' | 'navigator' = 'properties';
  showHtmlEditor = signal(false);

  expandedNodes = new Map<HTMLElement, boolean>();
  _refreshTree = signal(0);
  
  navigatorNodes = computed(() => {
    // Dependency on htmlContent to trigger re-calc
    this.builderService.htmlContent(); 
    this._refreshTree(); // Trigger re-calc on expand/collapse
    
    const root = this.builderService.rootElement();
    
    if (!root) return [];
    
    const nodes: NavigatorNode[] = [];
    
    const traverse = (el: HTMLElement, depth: number) => {
      Array.from(el.children).forEach((child) => {
        if (child instanceof HTMLElement) {
           const hasChildren = child.children.length > 0;
           // Default expanded: true
           const isExpanded = this.expandedNodes.get(child) ?? true;
           
           nodes.push({
             id: Math.random().toString(36).substr(2, 9),
             tagName: child.tagName,
             idAttr: child.id,
             depth: depth,
             element: child,
             hasChildren: hasChildren,
             expanded: isExpanded
           });
           
           if (hasChildren && isExpanded) {
               traverse(child, depth + 1);
           }
        }
      });
    };
    
    traverse(root, 0);
    return nodes;
  });

  toggleExpand(el: HTMLElement, event: Event) {
    event.stopPropagation();
    const current = this.expandedNodes.get(el) ?? true;
    this.expandedNodes.set(el, !current);
    this._refreshTree.update(v => v + 1);
  }

  toggleContentEditable() {
    this.builderService.toggleContentEditable();
  }

  selectElement(el: HTMLElement) {
    this.builderService.selectElement(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  moveUp(el: HTMLElement, event: Event) {
    event.stopPropagation();
    if (el.parentElement && el.previousElementSibling) {
      el.parentElement.insertBefore(el, el.previousElementSibling);
    }
  }

  moveDown(el: HTMLElement, event: Event) {
    event.stopPropagation();
    if (el.parentElement && el.nextElementSibling) {
      el.parentElement.insertBefore(el.nextElementSibling, el);
    }
  }

  deleteElement(el: HTMLElement, event: Event) {
    event.stopPropagation();
    if (confirm('Delete this element?')) {
      if (this.selectedElement() === el) {
        this.builderService.deleteSelectedElement();
      } else {
        if (el.parentElement) {
          el.parentElement.removeChild(el);
        }
      }
    }
  }

  getIconForTag(tagName: string): string {
    const map: Record<string, string> = {
      'DIV': 'crop_square',
      'P': 'short_text',
      'H1': 'title',
      'H2': 'title',
      'H3': 'title',
      'IMG': 'image',
      'BUTTON': 'smart_button',
      'A': 'link',
      'UL': 'list',
      'OL': 'format_list_numbered',
      'LI': 'remove',
      'SPAN': 'text_fields',
      'INPUT': 'input',
      'FORM': 'wysiwyg',
      'NAV': 'menu',
      'SECTION': 'view_stream',
      'HEADER': 'web_asset',
      'FOOTER': 'web_asset'
    };
    return map[tagName] || 'code';
  }

  canEditContent(el: HTMLElement): boolean {
    // Simple check: if it has no children or only text node children
    return el.children.length === 0 || (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE);
  }

  updateContent(value: string) {
    this.builderService.updateSelectedElementContent(value);
  }

  updateAttribute(attr: string, value: string) {
    this.builderService.updateSelectedElementAttribute(attr, value);
  }
  
  updateBooleanAttribute(attr: string, checked: boolean) {
    const el = this.selectedElement();
    if (el) {
      if (checked) {
        this.builderService.updateSelectedElementAttribute(attr, '');
      } else {
        this.builderService.updateSelectedElementAttribute(attr, null);
      }
    }
  }

  updateStringBooleanAttribute(attr: string, checked: boolean) {
    const el = this.selectedElement();
    if (el) {
      if (checked) {
        this.builderService.updateSelectedElementAttribute(attr, 'true');
      } else {
        this.builderService.updateSelectedElementAttribute(attr, null);
      }
    }
  }

  getDymerType(el: HTMLElement): string | null {
    if (el.hasAttribute('data-component-entitystatus')) return 'entitystatus';
    if (el.hasAttribute('data-component-dpagination')) return 'dpagination';
    if (el.hasAttribute('data-component-geopoint')) return 'geopoint';
    if (el.hasAttribute('data-component-kmsrelation')) return 'kmsrelation';
    if (el.hasAttribute('data-component-dymrelation')) return 'dymrelation';
    if (el.hasAttribute('data-component-dymerinput')) return 'dymerinput';
    if (el.hasAttribute('data-component-kmstaxonomy')) return 'kmstaxonomy';
    return null;
  }

  toggleRepeatable(el: HTMLElement, checked: boolean) {
    // We need to update the DOM and then trigger a save
    if (checked) {
      el.classList.add('repeatable', 'first-repeatable');
      // Add buttons if not exist
      if (!el.querySelector('.action-br')) {
         const btnContainer = document.createElement('div');
         btnContainer.className = 'action-br';
         btnContainer.innerHTML = '<span class="btn btn-outline-primary btn-sm">+</span><span class="btn btn-outline-danger btn-sm act-remove">-</span>';
         el.appendChild(btnContainer);
      }
    } else {
      el.classList.remove('repeatable', 'first-repeatable');
      const btns = el.querySelector('.action-br');
      if (btns) btns.remove();
    }
    
    // Trigger an update in BuilderService to persist changes
    // We can do this by updating a dummy style or attribute, or just calling updateContent
    // But since we modified the DOM directly, the MutationObserver in CanvasComponent 
    // should pick it up if it's observing subtree.
    // However, MutationObserver might be disconnected during internal updates?
    // Let's force an update by setting a class attribute which we just modified.
    this.builderService.updateSelectedElementAttribute('class', el.className);
  }

  updateStyle(prop: string, value: string) {
    this.builderService.updateSelectedElementStyle(prop, value);
  }

  // Helper to convert rgb to hex for color input
  rgbToHex(value: string): string {
    if (!value) return '#000000';
    if (value.startsWith('#')) return value;
    
    const rgbMatch = value.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!rgbMatch) return '#000000';
    
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  getStyle(el: HTMLElement, prop: string): string {
    // Return inline style first, then computed
    if (el.style && el.style.getPropertyValue(prop)) {
      return el.style.getPropertyValue(prop);
    }
    // We can't easily get computed style reactively without polling, 
    // but for the input initial value it helps.
    // Note: getComputedStyle might be expensive if called often in a template.
    // For this lite version, we'll stick to inline styles for editing 
    // to avoid confusion (editing computed style adds inline style anyway).
    return el.style ? (el.style as unknown as Record<string, string>)[prop] : '';
  }

  parseInt(val: string | null): number {
    if (!val) return 0;
    return window.parseInt(val, 10) || 0;
  }
}
