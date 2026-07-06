import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { AppBreadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';
import { PopoverModule } from 'primeng/popover';
import { AttendanceService } from '../../../shared/services/attendance.service';

@Component({
  selector: 'app-monthly-attendance-calendar',
  standalone: true,
  imports: [CommonModule, CardModule, AppBreadcrumb, PopoverModule],
  templateUrl: './monthly-attendance-calendar.html',
  styleUrl: './monthly-attendance-calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthlyAttendanceCalendar implements OnInit {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Monthly Attendance Calendar', icon: 'pi pi-calendar', routerLink: '/ess/monthly-attendance-calendar' }
  ];
  daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  currentDate = new Date();

  monthYearString = signal<string>('');
  calendarDays = signal<any[]>([]);
  selectedDay = signal<any>(null);

  constructor(private readonly attendanceService: AttendanceService) { }

  ngOnInit() {
    this.generateCalendar();
    this.loadData();
  }

  private formatTime(dateStr: string | null): string {
    if (!dateStr) return '-';
    const parsed = new Date(dateStr.replace(' ', 'T'));
    const d = isNaN(parsed.getTime()) ? new Date(dateStr) : parsed;
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    this.monthYearString.set(this.currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' }));

    const firstDayIndex = new Date(year, month, 1).getDay();
    const startDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const daysArray = [];

    for (let i = 0; i < startDay; i++) {
      daysArray.push({ dayNum: null });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isSunday = date.getDay() === 0;

      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const dateString = `${yyyy}-${mm}-${dd}`;

      let type = '';
      let colorClass = '';

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (date <= today) {
        if (isSunday) {
          type = 'WO';
          colorClass = 'bg-slate-400 text-white';
        }
      }

      daysArray.push({
        dayNum: i,
        dateString: dateString,
        type: type,
        colorClass: colorClass
      });
    }
    this.calendarDays.set(daysArray);
  }

  loadData() {
    this.attendanceService.getHistory().subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          const records = res.data;

          const updatedDays = this.calendarDays().map(day => {
            if (!day.dayNum) return day;

            const dayRecords = records.filter((r: any) => {
              if (!r.attendance_date) return false;
              let localDateString = r.attendance_date;
              if (r.attendance_date.includes('T')) {
                const d = new Date(r.attendance_date);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                localDateString = `${yyyy}-${mm}-${dd}`;
              }
              return localDateString === day.dateString;
            });

            if (dayRecords.length > 0) {
              const firstRecord = dayRecords[dayRecords.length - 1];
              const lastRecord = dayRecords[0];

              const status = firstRecord.attendance_status || 'PRESENT';
              day.swipeIn = this.formatTime(firstRecord.swipe_in);
              day.swipeOut = this.formatTime(lastRecord.swipe_out);

              if (status === 'PRESENT') {
                day.type = 'P';
                day.colorClass = 'bg-emerald-500 text-white';
              } else if (status === 'ABSENT') {
                day.type = 'A';
                day.colorClass = 'bg-rose-500 text-white';
              } else if (status === 'HALF_DAY') {
                day.type = 'HD';
                day.colorClass = 'bg-amber-500 text-white';
              } else {
                day.type = status.substring(0, 2).toUpperCase();
                day.colorClass = 'bg-blue-500 text-white';
              }
            } else {
              if (day.type === '' && new Date(day.dateString) < new Date(new Date().setHours(0, 0, 0, 0))) {
                day.type = 'A';
                day.colorClass = 'bg-rose-500 text-white';
              }
            }
            return day;
          });

          this.calendarDays.set(updatedDays);
        }
      }
    });
  }

  selectDay(event: Event, item: any, op: any) {
    if (!item.dayNum || (!item.swipeIn && !item.swipeOut)) return;
    this.selectedDay.set(item);
    op.toggle(event);
  }

  prevMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendar();
    this.loadData();
  }

  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendar();
    this.loadData();
  }

  today() {
    this.currentDate = new Date();
    this.generateCalendar();
    this.loadData();
  }
}
