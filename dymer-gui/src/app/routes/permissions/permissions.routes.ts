// iymport { DymerUserComponent } from './dymerUser/dymer-user-page/dymer-user.component';
import { Routes } from '@angular/router';
import { ngxPermissionsGuard } from 'ngx-permissions';
import { PermissionsRoleSwitchingComponent } from './role-switching/role-switching.component';
import { PermissionsRouteGuardComponent } from './route-guard/route-guard.component';
import { PermissionsTestComponent } from './test/test.component';
import { RolesComponent } from './roles/permission.component';
import { UsersComponent } from './dymerUser/users.component';
import { AuthorizationComponent } from './authorization/authorization.component';

export const routes: Routes = [
  { path: 'role-switching', component: PermissionsRoleSwitchingComponent },
  {
    path: 'route-guard',
    component: PermissionsRouteGuardComponent,
    canActivate: [ngxPermissionsGuard],
    data: {
      permissions: {
        except: 'GUEST',
        redirectTo: '/dashboard',
      },
    },
  },
  {
    path: "roles",
    component: RolesComponent,
    canActivate: [ngxPermissionsGuard],
    data: {
      permissions: {
        only: "ADMIN",
        redirectTo: '/dashboard',
      }
    }
  },
  {
    path: "dymerUser",
    component: UsersComponent,
    canActivate: [ngxPermissionsGuard],
    data: {
      permissions: {
        only: "ADMIN",
        redirectTo: '/dashboard',
      }
    }
  },
  {
    path: "authorization",
    component: AuthorizationComponent,
    canActivate: [ngxPermissionsGuard],
    data: {
      permissions: {
        only: "ADMIN",
        redirectTo: '/dashboard',
      }
    }
  },
    {
      path: 'test',
      component: PermissionsTestComponent,
      canActivate: [ngxPermissionsGuard],
      data: {
        permissions: {
          only: 'ADMIN',
          redirectTo: '/dashboard',
        },
      },
    }
];
