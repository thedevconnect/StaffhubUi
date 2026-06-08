import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { Breadcrumb } from 'primeng/breadcrumb';

@Component({
  selector: 'app-monthly-attendance-calendar',
  standalone: true,
  imports: [CommonModule, CardModule, Breadcrumb],
  templateUrl: './monthly-attendance-calendar.html',
  styleUrl: './monthly-attendance-calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthlyAttendanceCalendar {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Monthly Attendance Calendar', icon: 'pi pi-calendar', routerLink: '/ess/monthly-attendance-calendar' }
  ];
  daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  calendarDays = [
    { dayNum: 1, type: 'P', colorClass: 'bg-emerald-500 text-white' },
    { dayNum: 2, type: 'P', colorClass: 'bg-emerald-500 text-white' },
    { dayNum: 3, type: 'P', colorClass: 'bg-emerald-500 text-white' },
    { dayNum: 4, type: 'P', colorClass: 'bg-emerald-500 text-white' },
    { dayNum: 5, type: 'P', colorClass: 'bg-emerald-500 text-white' },
    { dayNum: 6, type: 'WO', colorClass: 'bg-slate-400 text-white' },
    { dayNum: 7, type: 'WO', colorClass: 'bg-slate-400 text-white' },
    { dayNum: 8, type: 'P', colorClass: 'bg-emerald-500 text-white' },
    { dayNum: 9, type: 'P', colorClass: 'bg-emerald-500 text-white' },
    { dayNum: 10, type: 'P', colorClass: 'bg-emerald-500 text-white' },
    { dayNum: 11, type: 'P', colorClass: 'bg-emerald-500 text-white' },
    { dayNum: 12, type: 'P', colorClass: 'bg-emerald-500 text-white' },
    { dayNum: 13, type: 'WO', colorClass: 'bg-slate-400 text-white' },
    { dayNum: 14, type: 'WO', colorClass: 'bg-slate-400 text-white' },
    { dayNum: 15, type: 'P', colorClass: 'bg-emerald-500 text-white' },
    { dayNum: 16, type: 'P', colorClass: 'bg-emerald-500 text-white' },
    { dayNum: 17, type: 'P', colorClass: 'bg-emerald-500 text-white' },
    { dayNum: 18, type: 'P', colorClass: 'bg-emerald-500 text-white' },
    { dayNum: 19, type: 'P', colorClass: 'bg-emerald-500 text-white' },
    { dayNum: 20, type: 'WO', colorClass: 'bg-slate-400 text-white' },
    { dayNum: 21, type: 'WO', colorClass: 'bg-slate-400 text-white' },
    { dayNum: 22, type: 'P', colorClass: 'bg-emerald-500 text-white' },
    { dayNum: 23, type: 'P', colorClass: 'bg-emerald-500 text-white' },
    { dayNum: 24, type: 'P', colorClass: 'bg-emerald-500 text-white' },
    { dayNum: 25, type: 'P', colorClass: 'bg-emerald-500 text-white' },
    { dayNum: 26, type: 'P', colorClass: 'bg-emerald-500 text-white' },
    { dayNum: 27, type: 'WO', colorClass: 'bg-slate-400 text-white' },
    { dayNum: 28, type: 'WO', colorClass: 'bg-slate-400 text-white' },
    { dayNum: 29, type: 'P', colorClass: 'bg-emerald-500 text-white' },
    { dayNum: 30, type: 'P', colorClass: 'bg-emerald-500 text-white' }
  ];
}
