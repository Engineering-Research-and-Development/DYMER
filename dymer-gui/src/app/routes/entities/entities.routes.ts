import { Routes } from '@angular/router';
import { ListEntitiesComponent } from './listentities/listentities.component';
import { RelationsComponent } from './relations/relations.component';
import { AddEntityComponent } from './addentity/addentity.component';
import { TaxonomyComponent } from './taxonomy/taxonomy.component';
import { ImportExportComponent } from './importExport/importExport.component';
import { HooksComponent } from './hooks/hooks.component';
import { QueryBuilderComponent } from './querybuilder/querybuilder.component';
import { ngxPermissionsGuard } from 'ngx-permissions';

export const routes: Routes = [
    {
        path: "listentities",
        component: ListEntitiesComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
    },
    {
        path: "relations",
        component: RelationsComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
    },
    {
        path: "addentity",
        component: AddEntityComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
    },
    {
        path: "taxonomy",
        component: TaxonomyComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
    },
    {
        path: "importExport",
        component: ImportExportComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
    },
    {
        path: "hooks",
        component: HooksComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
    },
    {
        path: "querybuilder",
        component: QueryBuilderComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
    }
];
