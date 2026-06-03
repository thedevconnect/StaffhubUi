import { Routes } from '@angular/router';
import { LoginPage } from './features/auth/pages/login-page/login-page';
import { WorkspacePage } from './features/workspace/pages/workspace-page/workspace-page';
import { AppShell } from './core/layout/app-shell/app-shell';
import { authGuard, guestGuard } from './core/auth/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginPage, canActivate: [guestGuard] },
  {
    path: '',
    component: AppShell,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard/hr', pathMatch: 'full' },
      { path: 'dashboard/hr', component: WorkspacePage, data: { title: 'HR Dashboard' } },
      { path: 'dashboard/ess', component: WorkspacePage, data: { title: 'ESS Dashboard' } },
      { path: 'employees', component: WorkspacePage, data: { title: 'Employees' } },
      { path: 'attendance', component: WorkspacePage, data: { title: 'Attendance' } },
      { path: 'profile', component: WorkspacePage, data: { title: 'Profile' } },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
