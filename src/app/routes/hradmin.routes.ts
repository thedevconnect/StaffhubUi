import { Routes } from '@angular/router';





export const hradminRoutes: Routes = [
    { path: '', redirectTo: 'hradmin-dashboard', pathMatch: 'full' },
    {
        path: 'hradmin-dashboard',
        loadComponent: () => import('../components/hradmin/hrms-dashboard/hr-dashboard/hr-dashboard').then(c => c.HrDashboard)
    },
    {
        path: 'employee-management',
        loadComponent: () => import('../components/hradmin/hrms-dashboard/hr-dashboard/employee-management/employee-management').then(c => c.EmployeeManagement)
    },
    {
        path: 'leave-approval',
        loadComponent: () => import('../components/hradmin/hrms-dashboard/hr-dashboard/leave-approval/leave-approval').then(c => c.LeaveApproval)
    },

];