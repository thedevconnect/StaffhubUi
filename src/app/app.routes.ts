import { Routes } from '@angular/router';
import { WorkspacePage } from './features/workspace/pages/workspace-page/workspace-page';
import { AppShell } from './core/layout/app-shell/app-shell';
import { authGuard, guestGuard } from './core/auth/guards/auth.guard';
import { Pagenotfound } from './shared/components/pagenotfound/pagenotfound';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
    canActivate: [guestGuard]
  },
  { path: 'login', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'register', redirectTo: 'auth/register', pathMatch: 'full' },
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  {
    path: '',
    component: AppShell,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
      },
      {
        path: 'ess',
        loadChildren: () => import('./features/ess/ess.routes').then(m => m.ESS_ROUTES)
      },
      { path: 'dashboard/hr', component: WorkspacePage, data: { title: 'HR Dashboard' } },
      { path: 'dashboard/ess', component: WorkspacePage, data: { title: 'ESS Dashboard' } },
      { path: 'employees', component: WorkspacePage, data: { title: 'Employees' } },
      { path: 'attendance', component: WorkspacePage, data: { title: 'Attendance' } },
      { path: 'profile', component: WorkspacePage, data: { title: 'Profile' } },
    ],
  },
  { path: '**', component: Pagenotfound },
  // { path: '**', redirectTo: 'auth/login' },
];
