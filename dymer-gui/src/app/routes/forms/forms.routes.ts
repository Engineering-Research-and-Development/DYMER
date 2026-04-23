import { Routes } from '@angular/router';

import { FormsDatetimeComponent } from './datetime/datetime.component';
import { FormsDynamicComponent } from './dynamic/dynamic.component';
import { FormsElementsComponent } from './elements/elements.component';
import { FormsSelectComponent } from './select/select.component';
import { BuilderModelsComponent } from './models-builder/builder.component';
import { ngxPermissionsGuard } from 'ngx-permissions';

export const routes: Routes = [
  { path: 'elements', component: FormsElementsComponent },
  { path: 'dynamic', component: FormsDynamicComponent },
  { path: 'select', component: FormsSelectComponent },
  { path: 'datetime', component: FormsDatetimeComponent },
  { path: 'datetime', component: FormsDatetimeComponent },
  {
    path: 'models-builder',
    component: BuilderModelsComponent,
    canActivate: [ngxPermissionsGuard],
    data: {
      permissions: {
        only: 'ADMIN',
        redirectTo: '/dashboard',
      },
    },
  },
];
