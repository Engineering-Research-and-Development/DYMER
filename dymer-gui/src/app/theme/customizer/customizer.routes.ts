import { Routes } from '@angular/router';
import {CustomizerComponent } from './customizer.component';
import { ngxPermissionsGuard } from 'ngx-permissions';

export const routes: Routes = [
    {
        path: "aimagic",
        component: CustomizerComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
    }
];
