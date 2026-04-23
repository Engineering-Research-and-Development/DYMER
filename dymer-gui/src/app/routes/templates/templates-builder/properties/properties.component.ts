import { Component, inject, computed, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BuilderService } from '../builder.service';
import { MatIconModule } from '@angular/material/icon';
import { NavigatorNode } from './properties.interface';



@Component({
  selector: 'app-templates-properties',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './properties.component.html'
})

export class PropertiesTemplatesComponent {
  builderService = inject(BuilderService);
  selectedElement = this.builderService.selectedElement;
  isContentEditable = this.builderService.isContentEditable;
  @Input() activeTab: 'properties' | 'navigator' = 'properties';
  showHtmlEditor = signal(false);

  dcatKeys: string[] = [
    'dcat:Catalog',
    'dcat:Dataset',
    'dcat:Distribution',
    'dcat:DataService',
    'dcat:CatalogRecord',
    'foaf:Agent',
    'vcard:Kind',
    'dct:Standard',
    'skos:Concept',
    'skos:ConceptScheme',
    'dct:title',
    'dct:description',
    'dcat:keyword',
    'dcat:theme',
    'dct:issued',
    'dct:modified',
    'dct:publisher',
    'dcat:contactPoint',
    'dcat:distribution',
    'dcat:dataset',
    'dct:language',
    'dct:spatial',
    'dct:temporal',
    'dct:identifier',
    'dcat:accessURL',
    'dcat:downloadURL',
    'dcat:byteSize',
    'dct:format',
    'dcat:mediaType',
    'dct:license',
    'dct:rights',
    'dct:conformsTo',
    'foaf:homepage',
    'foaf:name',
    'foaf:mbox'
  ];

  idsKeys: string[] = [
    'ids:Resource',
    'ids:DataResource',
    'ids:TextResource',
    'ids:AppResource',
    'ids:Connector',
    'ids:BaseConnector',
    'ids:TrustedConnector',
    'ids:Endpoint',
    'ids:ContractOffer',
    'ids:ContractAgreement',
    'ids:Permission',
    'ids:Prohibition',
    'ids:Duty',
    'ids:Rule',
    'ids:Artifact',
    'ids:Representation',
    'ids:Catalog',
    'ids:title',
    'ids:description',
    'ids:keyword',
    'ids:version',
    'ids:created',
    'ids:modified',
    'ids:publisher',
    'ids:sovereign',
    'ids:endpoint',
    'ids:contractOffer',
    'ids:representation',
    'ids:instance',
    'ids:byteSize',
    'ids:fileName',
    'ids:mediaType'
  ];

  expandedNodes = new Map<HTMLElement, boolean>();
  _refreshTree = signal(0);

  expandedSections = signal({
    general: true,
    specific: true,
    chart: true,
    dymerChart: true,
    typography: false,
    layout: false,
    background: false,
    dymer: true
  });

  toggleSection(section: 'general' | 'specific' | 'chart' | 'dymerChart' | 'typography' | 'layout' | 'background' | 'dymer') {
    this.expandedSections.update(s => ({ ...s, [section]: !s[section] }));
  }

  hasSpecificSettings(el: HTMLElement): boolean {
    return ['IMG', 'A', 'INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(el.tagName);
  }

  getSpecificSettingsTitle(el: HTMLElement): string {
    const map: Record<string, string> = {
      'IMG': 'Image Settings',
      'A': 'Link Settings',
      'INPUT': 'Input Settings',
      'TEXTAREA': 'Textarea Settings',
      'SELECT': 'Select Settings',
      'BUTTON': 'Button Settings'
    };
    return map[el.tagName] || 'Specific Settings';
  }

  hasChartSettings(el: HTMLElement): boolean {
    return el.hasAttribute('data-component-chart');
  }

  hasDymerChartSettings(el: HTMLElement): boolean {
    return el.hasAttribute('data-component-dymer-chart');
  }
  
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
