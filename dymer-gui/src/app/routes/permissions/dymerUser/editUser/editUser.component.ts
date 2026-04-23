import { Component, Inject } from '@angular/core';
import {NgIf} from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-edit-user',
  imports: [
    NgIf,
    MatDialogModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    MatSelectModule
  ],
  templateUrl: './editUser.component.html',
  styleUrl: './editUser.component.scss'
})
export class EditUserComponent {

  userForm: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<EditUserComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.userForm = new FormGroup({
      username: new FormControl(data.username, [Validators.required, Validators.minLength(3)]),
      password: new FormControl('', [Validators.minLength(6)]),
      email: new FormControl(data.email, [Validators.required, Validators.email]),
      roles: new FormControl(data.roles, Validators.required),
      active: new FormControl(data.active),
    });
  }

  submitForm() {
    if (this.userForm.valid) {
      const updatedUser = { ...this.data, ...this.userForm.value };
      this.dialogRef.close(updatedUser);
    }
  }

  cancel() {
    this.dialogRef.close();
  }

}
