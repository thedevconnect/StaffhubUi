import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './shared/services/guards/auth.guard';
import { Pagenotfound } from './shared/components/pagenotfound/pagenotfound';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { AppShell } from './core/layout/app-shell/app-shell';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '', component: AppShell, canActivate: [authGuard],
    children: [
      { path: 'ess', loadChildren: () => import('./routes/ess.routes').then(m => m.essRoutes) },
      { path: 'hradmin', loadChildren: () => import('./routes/hradmin.routes').then(m => m.hradminRoutes) },
      { path: 'developer', loadChildren: () => import('./routes/developer.routes').then(m => m.developerRoutes) },
      { path: 'payroll', loadChildren: () => import('./routes/payroll.routes').then(m => m.payrollRoutes) },

    ],
  },
  { path: '**', component: Pagenotfound },
];
