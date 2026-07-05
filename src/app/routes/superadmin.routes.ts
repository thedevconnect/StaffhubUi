import { Routes } from "@angular/router";




export const superadminRoutes: Routes = [
    { path: '', redirectTo: 'superadmin-dashboard', pathMatch: 'full' },
    {
        path: 'superadmin-dashboard',
        loadComponent: () => import('../dashboard/superadmin-dashboard/superadmin-dashboard').then(m => m.SuperadminDashboard)
    },
    {
        path: 'company-management',
        loadComponent: () => import('../components/superAdmin/company-management/company-management').then(m => m.CompanyManagement)
    },
];