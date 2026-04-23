import { Injectable, signal } from '@angular/core';
import { ModelPage } from './models.interface';

export interface BuilderElement {
  type: string;
  tagName: string;
  content?: string;
  attributes?: Record<string, string>;
  children?: BuilderElement[];
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class BuilderService {
  // The root HTML content of the builder
  htmlContent = signal<string>(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Page</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
</head>
<body>
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-4">Welcome to Models Editor</h1>
    <p class="mb-4">Start dragging elements here...</p>
  </div>
</body>
</html>`);

  
  selectedElement = signal<HTMLElement | null>(null); // The currently selected element (DOM element reference)  
  rootElement = signal<HTMLElement | null>(null); // The root element of the canvas (for navigator) 
  showCodeEditor = signal<boolean>(false); // The code editor visibility  
  isContentEditable = signal<boolean>(false); // Content editable state for selected element

  // loadModel(model: ModelPage) {
  //   const html = model.files?.find(f => f.contentType === 'text/html')?.data;

  //   if (!html) {
  //     console.warn('No HTML found in template', model);
  //     return;
  //   }

  //   console.log('Loading template:', model.title);

  //   this.updateBodyContent(html);
  // }

  updateContent(newContent: string) { // Update the HTML content
    this.htmlContent.set(newContent);
  }
  
  updateBodyContent(newBodyInner: string) { // Update only the body content while preserving the rest of the document
    const currentHtml = this.htmlContent();    
    const bodyRegex = /(<body[^>]*>)([\s\S]*?)(<\/body>)/i; // Regex to match body tag and its content
    
    if (bodyRegex.test(currentHtml)) {
      const newHtml = currentHtml.replace(bodyRegex, `$1${newBodyInner}$3`);
      this.htmlContent.set(newHtml);
    } else {
           this.htmlContent.set(newBodyInner);  // Fallback if no body tag found
    }
  }
  
  selectElement(el: HTMLElement | null) { // Select an element
    this.selectedElement.set(el);     
    this.isContentEditable.set(false); // Reset content editable when selection changes
  }

  toggleCodeEditor() { // Toggle code editor
    this.showCodeEditor.update(v => !v);
  }

  toggleContentEditable() {
    this.isContentEditable.update(v => !v);
  }
  
  updateSelectedElementStyle(property: string, value: string) { // Update selected element styles/attributes
    const el = this.selectedElement();
    if (el) {
      el.style.setProperty(property, value);
      // We need to trigger a content update to sync with code editor
      // This is tricky because 'el' is a reference to the DOM in the canvas.
      // We need to notify that the DOM changed.
      // In a real app, we'd use MutationObserver on the canvas.
    }
  }

  updateSelectedElementAttribute(attr: string, value: string | null) { // Toggle content editable
    const el = this.selectedElement();
    if (el) {
      if (value === null) {
        el.removeAttribute(attr);
      } else {
        el.setAttribute(attr, value);
      }
    }
  }
  
  updateSelectedElementContent(content: string) {
    const el = this.selectedElement();
    if (el) {
      el.innerHTML = content;
    }
  }

  deleteSelectedElement() {
    const el = this.selectedElement();
    if (el && el.parentElement) {
      el.parentElement.removeChild(el);
      this.selectedElement.set(null);
      // We rely on MutationObserver in CanvasComponent to update htmlContent
    }
  }

  moveSelectedElementUp() {
    const el = this.selectedElement();
    if (el && el.parentElement && el.previousElementSibling) {
      el.parentElement.insertBefore(el, el.previousElementSibling);
      // We rely on MutationObserver in CanvasComponent to update htmlContent
    }
  }

  moveSelectedElementDown() {
    const el = this.selectedElement();
    if (el && el.parentElement && el.nextElementSibling) {
      el.parentElement.insertBefore(el.nextElementSibling, el);
      // We rely on MutationObserver in CanvasComponent to update htmlContent
    }
  }

  injectAttachment(id: string, type: 'js' | 'css', content: string) {
    const currentHtml = this.htmlContent();
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentHtml, 'text/html');
    
    let el = doc.getElementById(`attachment-${id}`);
    
    if (type === 'css') {
      if (!el) {
        el = doc.createElement('style');
        el.id = `attachment-${id}`;
        doc.head.appendChild(el);
      }
      el.textContent = content;
    } else if (type === 'js') {
      if (!el) {
        el = doc.createElement('script');
        el.id = `attachment-${id}`;
        doc.body.appendChild(el);
      }
      el.textContent = content;
    }
    
    this.htmlContent.set(`<!DOCTYPE html>\n${doc.documentElement.outerHTML}`);
  }

  removeAttachment(id: string) {
    const currentHtml = this.htmlContent();
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentHtml, 'text/html');
    
    const el = doc.getElementById(`attachment-${id}`);
    if (el && el.parentElement) {
      el.parentElement.removeChild(el);
      this.htmlContent.set(`<!DOCTYPE html>\n${doc.documentElement.outerHTML}`);
    }
  }
  
}
