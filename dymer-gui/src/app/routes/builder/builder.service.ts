import { Injectable, signal } from '@angular/core';

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
    <h1 class="text-3xl font-bold mb-4">Welcome to VvvebJs Lite</h1>
    <p class="mb-4">Start dragging elements here...</p>
  </div>
</body>
</html>`);

  // The currently selected element (DOM element reference)
  selectedElement = signal<HTMLElement | null>(null);

  // The root element of the canvas (for navigator)
  rootElement = signal<HTMLElement | null>(null);

  // The code editor visibility
  showCodeEditor = signal<boolean>(false);

  // Content editable state for selected element
  isContentEditable = signal<boolean>(false);

  // Update the HTML content
  updateContent(newContent: string) {
    this.htmlContent.set(newContent);
  }

  // Update only the body content while preserving the rest of the document
  updateBodyContent(newBodyInner: string) {
    const currentHtml = this.htmlContent();
    // Regex to match body tag and its content
    const bodyRegex = /(<body[^>]*>)([\s\S]*?)(<\/body>)/i;
    
    if (bodyRegex.test(currentHtml)) {
      const newHtml = currentHtml.replace(bodyRegex, `$1${newBodyInner}$3`);
      this.htmlContent.set(newHtml);
    } else {
      // Fallback if no body tag found
      this.htmlContent.set(newBodyInner);
    }
  }

  // Select an element
  selectElement(el: HTMLElement | null) {
    this.selectedElement.set(el);
    // Reset content editable when selection changes
    this.isContentEditable.set(false);
  }

  // Toggle code editor
  toggleCodeEditor() {
    this.showCodeEditor.update(v => !v);
  }

  // Toggle content editable
  toggleContentEditable() {
    this.isContentEditable.update(v => !v);
  }

  // Update selected element styles/attributes
  updateSelectedElementStyle(property: string, value: string) {
    const el = this.selectedElement();
    if (el) {
      el.style.setProperty(property, value);
      // We need to trigger a content update to sync with code editor
      // This is tricky because 'el' is a reference to the DOM in the canvas.
      // We need to notify that the DOM changed.
      // In a real app, we'd use MutationObserver on the canvas.
    }
  }

  updateSelectedElementAttribute(attr: string, value: string | null) {
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
}
