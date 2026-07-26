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
    {
        path: 'all-employees',
        loadComponent: () => import('../components/superAdmin/all-employees/all-employees').then(m => m.AllEmployeesComponent)
    },
    {
        path: 'task-management',
        title: 'Task Management',
        loadComponent: () => import('../components/work-management/work-management').then(m => m.WorkManagementComponent)
    },
    {
        path: 'work-management',
        redirectTo: 'task-management',
        pathMatch: 'full'
    },
    {
        path: 'probation',
        title: 'Probation Tracker',
        loadComponent: () => import('../components/ess/probation/probation').then(m => m.Probation)
    }
];