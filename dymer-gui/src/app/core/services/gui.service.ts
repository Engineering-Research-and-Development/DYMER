import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GuiService {
  toggleFullscreen(): void {
    const doc = document.documentElement;
    if (doc.requestFullscreen) {
      doc.requestFullscreen();
    } else {
      console.warn('Fullscreen API non supportata');
    }
  }

  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    const toast = document.getElementById('top-toast');
    if (!toast) return;
    toast.querySelector('.toast-body .message')!.innerHTML = message;
    const header = toast.querySelector('.toast-header')!;
    header.classList.remove('bg-danger', 'bg-success');
    header.classList.add(type === 'success' ? 'bg-success' : 'bg-danger');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 5000);
  }
}
