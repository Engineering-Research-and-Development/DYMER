import { Routes } from '@angular/router';
import { FederationDashboardComponent } from './federation-dashboard/federation-dashboard.component';
import { ngxPermissionsGuard } from 'ngx-permissions';
import { AdapterTypeSelectorComponent } from './adapter-type-selector/adapter-type-selector.component';
import { SourceHealthBadgeComponent } from './source-health-badge/source-health-badge.component';
import { SourceRegistryFormComponent } from './source-registry-form/source-registry-form.component';
import { SourceRegistryListComponent } from './source-registry-list/source-registry-list.component';
import { SyncStatusPanelComponent } from './sync-status-panel/sync-status-panel.component';
import { TrueConnectorConfigComponent } from './true-connector-config/true-connector-config.component';


export const routes: Routes = [
  {
    path: 'adapter-type-selector',
    component: AdapterTypeSelectorComponent,
    canActivate: [ngxPermissionsGuard],
    data: {
      permissions: {
        only: 'ADMIN',
        redirectTo: '/dashboard',
      },
    },
  },
  {
    path: 'federation-dashboard',
    component: FederationDashboardComponent,
    canActivate: [ngxPermissionsGuard],
    data: {
      permissions: {
        only: 'ADMIN',
        redirectTo: '/dashboard',
      },
    },
  },
  {
    path: 'source-health-badge',
    component: SourceHealthBadgeComponent,
    canActivate: [ngxPermissionsGuard],
    data: {
      permissions: {
        only: 'ADMIN',
        redirectTo: '/dashboard',
      },
    },
  },
  {
    path: 'source-registry-form',
    component: SourceRegistryFormComponent,
    canActivate: [ngxPermissionsGuard],
    data: {
      permissions: {
        only: 'ADMIN',
        redirectTo: '/dashboard',
      },
    },
  },
  {
    path: 'source-registry-list',
    component: SourceRegistryListComponent,
    canActivate: [ngxPermissionsGuard],
    data: {
      permissions: {
        only: 'ADMIN',
        redirectTo: '/dashboard',
      },
    },
  },
  {
    path: 'sync-status-panel',
    component: SyncStatusPanelComponent,
    canActivate: [ngxPermissionsGuard],
    data: {
      permissions: {
        only: 'ADMIN',
        redirectTo: '/dashboard',
      },
    },
  },
  {
    path: 'true-connector-config',
    component: TrueConnectorConfigComponent,
    canActivate: [ngxPermissionsGuard],
    data: {
      permissions: {
        only: 'ADMIN',
        redirectTo: '/dashboard',
      },
    },
  },
];
