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
    {
        path: 'employee-calendar',
        loadComponent: () => import('../components/hradmin/emp-monthly-calendar/emp-monthly-calendar').then(c => c.EmpMonthlyCalendar)
    },
    { path: 'approval-attendance-regularization', loadComponent: () => import('../components/hradmin/approval-attendance-regularization/approval-attendance-regularization').then(c => c.ApprovalAttendanceRegularization) }

];