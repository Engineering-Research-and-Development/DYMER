
import { Routes } from '@angular/router';
import { OpennessSearchComponent } from './opennesssearch/opennesssearch.component';
import { AiConfigComponent } from './aiconfig/ai-config.component';
import { LibrariesComponent } from './libraries/libraries.component';
import { SocialStatisticsComponent } from './socialStatistics/socialStatistics.component';
import { ImportCronComponent } from './importcron/importcron.component';
import { ngxPermissionsGuard } from 'ngx-permissions';

export const routes: Routes = [
    {
        path: "agents",
        component: AiConfigComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
    },
    {
        path: "opennesssearch",
        component: OpennessSearchComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
    },
     {
        path: "libraries",
        component: LibrariesComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
    },
    {
        path: "socialStatistics",
        component: SocialStatisticsComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
    },
    {
        path: "importcron",
        component: ImportCronComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
    }
];

