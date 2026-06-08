import { Routes } from '@angular/router';
import { AppShell } from './core/layout/app-shell/app-shell';
import { authGuard, guestGuard } from './core/auth/guards/auth.guard';
import { Pagenotfound } from './shared/components/pagenotfound/pagenotfound';
import { LoginComponent } from './features/auth/login/login.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: '', component: AppShell, canActivate: [authGuard],
    children: [
      { path: 'ess', loadChildren: () => import('./routes/ess.routes').then(m => m.essRoutes) },
      { path: 'hradmin', loadChildren: () => import('./routes/hradmin.routes').then(m => m.hradminRoutes) },

    ],
  },
  { path: '**', component: Pagenotfound },
];
