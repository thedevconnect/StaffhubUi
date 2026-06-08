import { Routes } from '@angular/router';
import { AppShell } from './core/layout/app-shell/app-shell';
import { authGuard, guestGuard } from './core/auth/guards/auth.guard';
import { Pagenotfound } from './shared/components/pagenotfound/pagenotfound';

export const routes: Routes = [
  { path: 'auth', loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES), canActivate: [guestGuard] },
  { path: 'login', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'register', redirectTo: 'auth/register', pathMatch: 'full' },
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  {
    path: '', component: AppShell, canActivate: [authGuard],
    children: [
      { path: 'ess', loadChildren: () => import('./routes/ess.routes').then(m => m.essRoutes) },
      { path: 'hradmin', loadChildren: () => import('./routes/hradmin.routes').then(m => m.hradminRoutes) },

    ],
  },
  { path: '**', component: Pagenotfound },
];
