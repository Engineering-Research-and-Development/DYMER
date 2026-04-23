import { Routes } from '@angular/router';
import { authGuard } from '@core';
import { AdminLayoutComponent } from '@theme/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from '@theme/auth-layout/auth-layout.component';
import { DashboardComponent } from './routes/dashboard/dashboard.component';
import { LoginComponent } from './routes/sessions/login/login.component';
import { RegisterComponent } from './routes/sessions/register/register.component';
import { WizardComponent } from './routes/wizard/wizard.component';
import { LogsComponent } from './routes/logs/logs.component';
import { MagicAiComponent } from './routes/magicai/magicai.component';
import { BuilderComponent } from './routes/builder/builder.component';


export const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'permissions', loadChildren: () => import('./routes/permissions/permissions.routes').then(m => m.routes) },
      { path: 'aimagic', component: MagicAiComponent },
      { path: 'wizard', component: WizardComponent },
      { path: 'templates', loadChildren: () => import('./routes/templates/templates.routes').then(m => m.routes) },
      { path: 'entities', loadChildren: () => import('./routes/entities/entities.routes').then(m => m.routes) },
      { path: 'configurations', loadChildren: () => import('./routes/configurations/configurations.routes').then(m => m.routes) },
      { path: 'services', loadChildren: () => import('./routes/services/services.routes').then(m => m.routes) },
      { path: 'documentation', loadChildren: () => import('./routes/documentation/documentation.routes').then(m => m.routes) },
      { path: 'logs', component: LogsComponent },
      { path: 'forms', loadChildren: () => import('./routes/forms/forms.routes').then(m => m.routes) },
        {
    path: 'builder',
    component: BuilderComponent
  },
    ],
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
