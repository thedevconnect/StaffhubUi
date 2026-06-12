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

export const essRoutes: Routes = [
  { path: '', redirectTo: 'ess-dashboard', pathMatch: 'full' },
  { path: 'ess-dashboard', component: EssDashboard },
  { path: 'my-assets', component: MyAssets },
  { path: 'service-file', component: ServiceFile },
  { path: 'reportings-attendance', component: ReportingsAttendance },
  { path: 'get-employee-info', component: GetEmployeeInfo },
  { path: 'employee-attendance', component: EmployeeAttendance },
  { path: 'attendance-regularization', component: AttendanceRegularization },
  { path: 'monthly-attendance-calendar', component: MonthlyAttendanceCalendar },
  { path: 'leave-application', component: LeaveApplication },
  { path: 'apply-short-leave', component: ApplyShortLeave },
  { path: 'final-attendance', component: FinalAttendance },
  { path: 'employee-resignation', component: EmployeeResignation },
  { path: 'exit-interview', component: ExitInterview },
  { path: 'expense-management', component: ExpenseManagement },
  { path: 'performance-management', component: PerformanceManagement },
  { path: 'probation', component: Probation },
  { path: 'ticket', component: Ticket },
];


// export const essRoutes: Routes = [
//     { path: 'my-assets', component: MyAssets },
//     { path: 'employee-attendance', component: EmployeeAttendance },
//     { path: 'attendance-regularization', component: AttendanceRegularization },
//     { path: 'employee-calendar', component: EmployeeCalendar },
//     { path: 'leave-application', component: LeaveApplication },
//     { path: 'short-leave', component: ShortLeave },
//     { path: 'final-attendance', component: FinalAttendance },
//     { path: 'leave-card-detail', component: LeaveCardDetail },
//     { path: 'holiday-list', component: HolidayList },
//     { path: 'parental-leave', component: ParentalLeave },
//     { path: 'employee-official-detail', component: EmployeeOfficialDetail },
//     { path: 'attendance-regularization-action', component: AttendanceRegularizationAction },
//     { path: 'leave-approval', component: LeaveApproval },
//     { path: 'short-leave-approval', component: ShortLeaveApproval },
//     { path: 'exit-interview-form', component: ExitInterviewForm },
//     { path: 'employee-resignation', component: EmployeeResignation },
//     { path: 'performance-appraisal-form', component: PerformanceAppraisalForm },
//     { path: 'employee-accept-kra', component: EmployeeAcceptKra },
//     { path: 'employee-letter-issued', component: EmployeeLetterIssued },
//     { path: 'reportings-attendance', component: ReportingsAttendance },


// ]
