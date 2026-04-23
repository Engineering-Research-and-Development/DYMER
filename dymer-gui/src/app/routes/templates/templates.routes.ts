import { Routes } from '@angular/router';
import { BuilderTemplatesComponent } from './templates-builder/builder.component';
import { ngxPermissionsGuard } from 'ngx-permissions';

export const routes: Routes = [

  {
    path: 'templates-builder',
    component: BuilderTemplatesComponent,
    canActivate: [ngxPermissionsGuard],
    data: {
      permissions: {
        only: 'ADMIN',
        redirectTo: '/dashboard',
      },
    },
  },
];
