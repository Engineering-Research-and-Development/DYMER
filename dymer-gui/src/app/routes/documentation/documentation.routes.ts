import { Routes } from '@angular/router';
import { FixProblemsComponent } from './fixproblems/fixproblems.component';
import { DemoListComponent } from './demolist/demolist.component';
import { DemoSingleComponent } from './demosingle/demosingle.component';
import { SingleByUrlComponent } from './singlebyurl/singlebyurl.component';
import { DemoMapComponent } from './demomap/demomap.component';
import { DemoSearchBarComponent } from './demosearchbar/demosearchbar.component';
import { DemoManagerComponent } from './demomanager/demomanager.component';
import { ModelsDocComponent } from './modelsdoc/modelsdoc.component';
import { TemplatesDocComponent } from './templatesdoc/templatesdoc.component';
import { RedisDocComponent } from './redisdoc/redisdoc.component';
import { SwaggerApiComponent } from './swaggerapi/swaggerapi.component';
import { ngxPermissionsGuard } from 'ngx-permissions';


export const routes: Routes = [
    {
        path: "fixproblems",
        component: FixProblemsComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
      },{
        path: "demolist",
        component: DemoListComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
      },{
        path: "demosingle",
        component: DemoSingleComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
      },{
        path: "singlebyurl",
        component: SingleByUrlComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
      },{
        path: "demomap",
        component: DemoMapComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
      },{
        path: "demosearchbar",
        component: DemoSearchBarComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
      },{
        path: "demomanager",
        component: DemoManagerComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
      },{
        path: "modelsdoc",
        component: ModelsDocComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
      },{
        path: "templatesdoc",
        component: TemplatesDocComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
      },{
        path: "redisdoc",
        component: RedisDocComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
      },{
        path: "swaggerapi",
        component: SwaggerApiComponent,
        canActivate: [ngxPermissionsGuard],
        data: {
          permissions: {
            only: "ADMIN",
            redirectTo: '/dashboard',
          }
        }
      }
];
