import { Routes } from '@angular/router';
import { EssDashboard } from '../components/ess/ess-dashboard/ess-dashboard';
import { MyAssets } from '../components/ess/my-assets/my-assets';
import { ServiceFile } from '../components/ess/service-file/service-file';
import { ReportingsAttendance } from '../components/ess/reportings-attendance/reportings-attendance';
import { GetEmployeeInfo } from '../components/ess/get-employee-info/get-employee-info';
import { EmployeeAttendance } from '../components/ess/employee-attendance/employee-attendance';
import { AttendanceRegularization } from '../components/ess/attendance-regularization/attendance-regularization';
import { MonthlyAttendanceCalendar } from '../components/ess/monthly-attendance-calendar/monthly-attendance-calendar';
import { LeaveApplication } from '../components/ess/leave-application/leave-application';
import { ApplyShortLeave } from '../components/ess/apply-short-leave/apply-short-leave';
import { FinalAttendance } from '../components/ess/final-attendance/final-attendance';
import { EmployeeResignation } from '../components/ess/employee-resignation/employee-resignation';
import { ExitInterview } from '../components/ess/exit-interview/exit-interview';
import { ExpenseManagement } from '../components/ess/expense-management/expense-management';
import { PerformanceManagement } from '../components/ess/performance-management/performance-management';
import { Probation } from '../components/ess/probation/probation';
import { Ticket } from '../components/ess/ticket/ticket';
import { HolidayList } from '../components/ess/holiday/holiday-list/holiday-list';
import { Profile } from '../components/ess/profile/profile/profile';

export const essRoutes: Routes = [
  { path: '', redirectTo: 'ess-dashboard', pathMatch: 'full' },
  { path: 'ess-dashboard', component: EssDashboard },
  { path: 'my-assets', component: MyAssets },
  { path: 'employee-attendance', component: EmployeeAttendance },
  { path: 'attendance-regularization', component: AttendanceRegularization },
  { path: 'leave-application', component: LeaveApplication },
  { path: 'apply-short-leave', component: ApplyShortLeave },
  { path: 'monthly-attendance-calendar', component: MonthlyAttendanceCalendar },
  { path: 'final-attendance', component: FinalAttendance },
  { path: 'employee-resignation', component: EmployeeResignation },
  { path: 'reportings-attendance', component: ReportingsAttendance },
  { path: 'holiday-list', component: HolidayList },

  { path: 'service-file', component: ServiceFile },
  { path: 'get-employee-info', component: GetEmployeeInfo },
  { path: 'monthly-attendance-calendar', component: MonthlyAttendanceCalendar },
  { path: 'apply-short-leave', component: ApplyShortLeave },
  { path: 'exit-interview', component: ExitInterview },
  { path: 'expense-management', component: ExpenseManagement },
  { path: 'performance-management', component: PerformanceManagement },
  { path: 'probation', component: Probation },
  { path: 'ticket', component: Ticket },
  { path: 'profile', component: Profile },

];
