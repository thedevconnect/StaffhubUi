import { Routes } from '@angular/router';
import { Home } from './pages/home/home';

export const DASHBOARD_ROUTES: Routes = [
  { path: 'home', component: Home },
  { path: '', redirectTo: 'home', pathMatch: 'full' }
];
