import { Routes } from "@angular/router";




export const superadminRoutes: Routes = [

    {
        path: 'company-management',
        loadComponent: () => import('../components/superAdmin/company-management/company-management').then(m => m.CompanyManagement)
    }
];