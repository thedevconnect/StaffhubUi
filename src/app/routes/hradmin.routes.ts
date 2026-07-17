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
    {
        path: 'reports',
        title: 'Report',
        loadComponent: () => import('../components/hradmin/hr-attendance-report/hr-attendance-report').then(c => c.HrAttendanceReport)
    },
    // {
    //     path: 'monthly-attendance',
    //     loadComponent: () => import('../components/hradmin/monthly-attendance/monthly-attendance').then(c => c.MonthlyAttendance)
    // },
    {
        path: 'resignation-approvals',
        title: 'Resignation Requests',
        loadComponent: () => import('../components/hradmin/resignation-approvals/resignation-approvals').then(c => c.ResignationApprovals)
    },
    {
        path: 'monthly-attendance-calendar',
        title: 'Manage Attendance Calendar',
        loadComponent: () => import('../components/hradmin/monthly-attendance-calendar/monthly-attendance-calendar').then(c => c.HRMonthlyAttendanceCalendar)
    },
    {
        path: 'offboarding',
        loadComponent: () => import('../components/hradmin/offboarding/offboarding').then(c => c.OffboardingComponent)
    },
    { path: 'approval-attendance-regularization', loadComponent: () => import('../components/hradmin/approval-attendance-regularization/approval-attendance-regularization').then(c => c.ApprovalAttendanceRegularization) },
    {
        path: 'office-location-settings',
        loadComponent: () => import('../components/hradmin/office-location-settings/office-location-settings').then(c => c.OfficeLocationSettings)
    },
    {
        path: 'device-management',
        loadComponent: () => import('../components/hradmin/device-management/device-management').then(c => c.DeviceManagement)
    },
    {
        path: 'asset-approval',
        title: 'Asset Approval',
        loadComponent: () => import('../components/ess/my-assets/my-assets').then(c => c.MyAssets)
    }

];