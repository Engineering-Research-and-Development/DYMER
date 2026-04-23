import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BuilderService } from '../builder.service';
import { MatIconModule } from '@angular/material/icon';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';

@Component({
  selector: 'app-models-code-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, CodemirrorModule],
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss']
})

export class CodeModelsEditorComponent {
  builderService = inject(BuilderService);
  htmlContent = this.builderService.htmlContent;

  updateHtml(value: string) {
    this.builderService.updateContent(value);
  }

  close() {
    this.builderService.toggleCodeEditor();
  }
}
