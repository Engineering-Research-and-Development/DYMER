import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-ai-templates-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './ai-chat.component.html'
})
export class AiTemplatesChatComponent {
  messages = signal<{id: string, role: 'user' | 'ai', content: string}[]>([
    { id: '1', role: 'ai', content: 'Hi! I can help you generate layouts or components. What would you like to build?' }
  ]);
  currentMessage = '';
  isLoading = signal(false);

  sendMessage() {
    if (!this.currentMessage.trim()) return;

    const userMsg = this.currentMessage;
    this.messages.update(msgs => [...msgs, {
      id: Date.now().toString(),
      role: 'user',
      content: userMsg
    }]);
    this.currentMessage = '';
    this.isLoading.set(true);

    // Simulate AI response for now
    setTimeout(() => {
      this.messages.update(msgs => [...msgs, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: `I received your request: "${userMsg}". I'm a placeholder for now, but I would generate code for you here!`
      }]);
      this.isLoading.set(false);
    }, 1500);
  }
}
