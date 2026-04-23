import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { JsonPipe } from '@angular/common';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
@Component({
  selector: 'dialog-info-logs',
  templateUrl: './infolog.component.html',
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
  
    NgxJsonViewerModule
  ],
})
export class DialogInfoLog {
  data: any = inject(MAT_DIALOG_DATA);

  constructor() {

  }
}
