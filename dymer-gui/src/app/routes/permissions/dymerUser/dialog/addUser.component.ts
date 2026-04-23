import { Component } from '@angular/core';
import { FormsModule, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
 
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'add-user-form',
  styles: `
    .demo-full-width {
      width: 100%;
      height: auto;
      overflow-y: auto;
    }
  `,
  templateUrl: 'addUser.component.html',
  imports: [
    MatDialogModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    TranslateModule
  ]
})

export class AddUserFormComponent {
  userForm: FormGroup;

  constructor(private dialogRef: MatDialogRef<AddUserFormComponent>) {
    this.userForm = new FormGroup({
      username: new FormControl('', [Validators.required, Validators.minLength(3)]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      roles: new FormControl('', Validators.required),
      active: new FormControl(false),
    });
  }

    formatRole(user: any) {
    let roles = user.roles.toString().split(',');
    user.roles = [];

    for (let role of roles) {
      user.roles.push({ role: role.trim() });
    }
    return user;
  }

  submitForm() {
    if (this.userForm.valid) {
      this.dialogRef.close(this.formatRole(this.userForm.value));
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
