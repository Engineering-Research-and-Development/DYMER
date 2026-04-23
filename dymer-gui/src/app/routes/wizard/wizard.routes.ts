import { Routes } from '@angular/router';
import { WizardComponent } from './wizard.component';
import { ngxPermissionsGuard } from 'ngx-permissions';

export const routes: Routes = [
    {
        path: "wizard",
        component: WizardComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
    }
];
