import { Component, Inject, Input, signal } from '@angular/core';
import {
  FormsModule,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthorizationRules } from '../authorization.interface';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-permissions-newAuthConfig',
  styles: `
    .demo-full-width {
      width: 100%;
      height: auto;
      overflow-y: auto;
    }
  `,
  templateUrl: './new-auth-config.component.html',
  imports: [
    MatDialogModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    MatTabsModule,
    TranslateModule,
     
  ],
})

export class NewAuthConfigComponent {
  jwtConfigForm: FormGroup = new FormGroup({});
  OIDCConfigForm: FormGroup = new FormGroup({});
  selectedTab: 'jwt' | 'oidc';


  activeTab: 'jwt' | 'oidc' = 'jwt';

   

  constructor(
    private dialogRef: MatDialogRef<NewAuthConfigComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data?.authtype === 'oidc') {
      this.selectedTab = 'oidc';
      this.initOIDCForm(data);
      this.initJWTForm();
    } else {
      this.selectedTab = 'jwt';
      this.initJWTForm(data);
      this.initOIDCForm();
    }
  }

  initJWTForm(data?: AuthorizationRules) {
    this.jwtConfigForm = new FormGroup({
      host: new FormControl(data?.host || ''),
      authtype: new FormControl(data?.authtype || 'jwtparent'),
      active: new FormControl(data?.active || false),
      prop: new FormGroup({
        secretkey: new FormControl(data?.prop?.secretkey || ''),
      }),
    });
  }

  initOIDCForm(data?: any) {
    this.OIDCConfigForm = new FormGroup({
      host: new FormControl(data?.host || ''),
      authtype: new FormControl(data?.authtype || 'oidc'),
      active: new FormControl(data?.active || false),
      prop: new FormGroup({
        secretkey: new FormControl(data?.prop?.secretkey || ''),
        oidcname: new FormControl(data?.prop?.oidcname || ''),
        client: new FormGroup({
          discover: new FormControl(data?.prop?.client?.discover || ''),
          scope: new FormControl(data?.prop?.client?.scope || ''),
          client_id: new FormControl(data?.prop?.client?.client_id || ''),
          response_type: new FormControl(data?.prop?.client?.response_type || ''),
        }),
        dymer: new FormGroup({
          issuer: new FormControl(data?.prop?.dymer?.issuer || ''),
          clientSecret: new FormControl(data?.prop?.dymer?.clientSecret || ''),
          client_id: new FormControl(data?.prop?.dymer?.client_id || ''),
          authorizationURL: new FormControl(data?.prop?.dymer?.authorizationURL || ''),
          userInfoURL: new FormControl(data?.prop?.dymer?.userInfoURL || ''),
          tokenURL: new FormControl(data?.prop?.dymer?.tokenURL || ''),
          callbackURL: new FormControl(data?.prop?.dymer?.callbackURL || ''),
          passReqToCallback: new FormControl(data?.prop?.dymer?.passReqToCallback || ''),
          scope: new FormControl(data?.prop?.dymer?.scope || ''),
        }),
      }),
    });
  }

  submitJWTForm() {
    if (this.jwtConfigForm.valid) {
      const formValue = this.jwtConfigForm.value;
      if (this.data?._id) {
        formValue._id = this.data._id;
      }
      this.dialogRef.close(formValue);
    }
  }

  submitOIDCForm() {
    if (this.OIDCConfigForm.valid) {
      const formValue = this.OIDCConfigForm.value;
      if (this.data?._id) {
        formValue._id = this.data._id;
      }
      this.dialogRef.close(formValue);
    }
  }

  cancelJWTForm() {
    this.dialogRef.close();
  }

  cancelOIDForm() {
    this.dialogRef.close();
  }
}
