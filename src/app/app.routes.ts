import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './shared/services/guards/auth.guard';
import { Pagenotfound } from './shared/components/pagenotfound/pagenotfound';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterCompanyComponent } from './features/auth/register/register-company.component';
import { AppShell } from './core/layout/app-shell/app-shell';
import { Landing } from './landing/landing';

export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  { path: 'register-company', component: RegisterCompanyComponent },
  { path: 'landing', component: Landing },
  { path: 'login', component: LoginComponent },

  {
    path: '', component: AppShell, canActivate: [authGuard],
    children: [
      { path: 'ess', loadChildren: () => import('./routes/ess.routes').then(m => m.essRoutes) },
      { path: 'hradmin', loadChildren: () => import('./routes/hradmin.routes').then(m => m.hradminRoutes) },
      { path: 'developer', loadChildren: () => import('./routes/developer.routes').then(m => m.developerRoutes) },
      { path: 'payroll', loadChildren: () => import('./routes/payroll.routes').then(m => m.payrollRoutes) },
      { path: 'superadmin', loadChildren: () => import('./routes/superadmin.routes').then(m => m.superadminRoutes) },
    ],
  },
  { path: '**', component: Pagenotfound },
];
