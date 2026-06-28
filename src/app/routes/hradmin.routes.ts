import { Routes } from '@angular/router';




export const hradminRoutes: Routes = [
    { path: '', redirectTo: 'hradmin-dashboard', pathMatch: 'full' },
    { path: 'hradmin-dashboard', loadComponent: () => import('../components/hradmin/hrms-dashboard/hr-dashboard/hr-dashboard').then(c => c.HrDashboard) },

];