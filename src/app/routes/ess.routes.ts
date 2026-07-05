import { Routes } from '@angular/router';

export const essRoutes: Routes = [
  { path: '', redirectTo: 'ess-dashboard', pathMatch: 'full' },
  {
    path: 'ess-dashboard',
    loadComponent: () => import('../dashboard/ess-dashboard/ess-dashboard').then(c => c.EssDashboard)
  },
  {
    path: 'employee-attendance',
    loadComponent: () => import('../components/ess/employee-attendance/employee-attendance').then(c => c.EmployeeAttendance)
  },
  {
    path: 'my-assets',
    loadComponent: () => import('../components/ess/my-assets/my-assets').then(c => c.MyAssets)
  },
  {
    path: 'attendance-regularization',
    loadComponent: () => import('../components/ess/attendance-regularization/attendance-regularization').then(c => c.AttendanceRegularization)
  },
  {
    path: 'leave-application',
    loadComponent: () => import('../components/ess/leave-application/leave-application').then(c => c.LeaveApplication)
  },
  {
    path: 'apply-short-leave',
    loadComponent: () => import('../components/ess/apply-short-leave/apply-short-leave').then(c => c.ApplyShortLeave)
  },
  {
    path: 'monthly-attendance-calendar',
    loadComponent: () => import('../components/ess/monthly-attendance-calendar/monthly-attendance-calendar').then(c => c.MonthlyAttendanceCalendar)
  },
  {
    path: 'final-attendance',
    loadComponent: () => import('../components/ess/final-attendance/final-attendance').then(c => c.FinalAttendance)
  },
  {
    path: 'employee-resignation',
    loadComponent: () => import('../components/ess/employee-resignation/employee-resignation').then(c => c.EmployeeResignation)
  },
  {
    path: 'reportings-attendance',
    loadComponent: () => import('../components/ess/reportings-attendance/reportings-attendance').then(c => c.ReportingsAttendance)
  },
  {
    path: 'holiday-list',
    loadComponent: () => import('../components/ess/holiday/holiday-list/holiday-list').then(c => c.HolidayList)
  },

  {
    path: 'service-file',
    loadComponent: () => import('../components/ess/service-file/service-file').then(c => c.ServiceFile)
  },
  {
    path: 'get-employee-info',
    loadComponent: () => import('../components/ess/get-employee-info/get-employee-info').then(c => c.GetEmployeeInfo)
  },
  {
    path: 'exit-interview',
    loadComponent: () => import('../components/ess/exit-interview/exit-interview').then(c => c.ExitInterview)
  },
  {
    path: 'expense-management',
    loadComponent: () => import('../components/ess/expense-management/expense-management').then(c => c.ExpenseManagement)
  },
  {
    path: 'performance-management',
    loadComponent: () => import('../components/ess/performance-management/performance-management').then(c => c.PerformanceManagement)
  },
  {
    path: 'probation',
    loadComponent: () => import('../components/ess/probation/probation').then(c => c.Probation)
  },
  {
    path: 'ticket',
    loadComponent: () => import('../components/ess/ticket/ticket').then(c => c.Ticket)
  },
  {
    path: 'profile',
    loadComponent: () => import('../components/ess/profile/profile/profile').then(c => c.Profile)
  },
];
