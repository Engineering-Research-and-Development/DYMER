import { Routes } from '@angular/router';
import {MagicAiComponent } from './magicai.component';
import { ngxPermissionsGuard } from 'ngx-permissions';

export const routes: Routes = [
    {
        path: "aimagic",
        component: MagicAiComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
    }
];
