import { Routes } from '@angular/router';




export const hradminRoutes: Routes = [
    { path: '', redirectTo: 'hrms-dashboard', pathMatch: 'full' },
    { path: 'hrms-dashboard', loadComponent: () => import('../components/hradmin/hrms-dashboard/hr-dashboard/hr-dashboard').then(c => c.HrDashboard) },

];