import { ChangeDetectionStrategy, Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppBreadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { AttendanceService } from '../../../shared/services/attendance.service';
import { LeaveService, LeaveRequest } from '../../../shared/services/leave.service';
import { EmployeeManagementService } from '../../../shared/services/employee-management.service';
import { MessageService } from 'primeng/api';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Employee } from '../../../shared/services/models/employee.model';

@Component({
  selector: 'app-hr-monthly-attendance-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, AppBreadcrumb, DialogModule, SelectModule, ButtonModule, InputTextModule, TextareaModule],
  providers: [MessageService],
  templateUrl: './monthly-attendance-calendar.html',
  styleUrl: './monthly-attendance-calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HRMonthlyAttendanceCalendar implements OnInit {
  breadcrumbItems: any[] = [
    { label: 'HR Administration', icon: 'pi pi-home', routerLink: '/hradmin' },
    { label: 'Manage Attendance Calendar', icon: 'pi pi-calendar', routerLink: '/hradmin/monthly-attendance-calendar' }
  ];
  daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  currentDate = new Date();
  monthYearString = signal<string>('');
  calendarDays = signal<any[]>([]);
  
  employees = signal<Employee[]>([]);
  selectedEmployeeId = signal<string | null>(null);

  editDialogVisible = false;
  selectedDay = signal<any>(null);
  editForm = {
    attendance_status: 'PRESENT',
    swipe_in: '',
    swipe_out: '',
    notes: ''
  };

  statusOptions = [
    { label: 'Present', value: 'PRESENT' },
    { label: 'Absent', value: 'ABSENT' },
    { label: 'Half Day', value: 'HALF_DAY' },
    { label: 'On Leave', value: 'ON_LEAVE' }
  ];

  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly leaveService: LeaveService,
    private readonly employeeService: EmployeeManagementService,
    private readonly messageService: MessageService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.generateCalendar();
    this.loadEmployees();
  }

  loadEmployees() {
    this.employeeService.getEmployees().subscribe({
      next: (res) => {
        this.employees.set(res || []);
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load employees' });
      }
    });
  }

  onEmployeeChange() {
    this.loadData();
  }

  private formatTime(dateStr: string | null): string {
    if (!dateStr) return '-';
    const parsed = new Date(dateStr.replace(' ', 'T'));
    const d = isNaN(parsed.getTime()) ? new Date(dateStr) : parsed;
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  private formatTimeForInput(dateStr: string | null): string {
    if (!dateStr) return '';
    const parsed = new Date(dateStr.replace(' ', 'T'));
    const d = isNaN(parsed.getTime()) ? new Date(dateStr) : parsed;
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
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
        colorClass: colorClass,
        records: [],
        primaryRecordId: null
      });
    }
    this.calendarDays.set(daysArray);
  }

  loadData() {
    const empId = this.selectedEmployeeId();
    if (!empId) {
      this.generateCalendar();
      return;
    }

    forkJoin({
      attendance: this.attendanceService.getEmployeeHistory(empId).pipe(catchError(() => of({ success: true, data: [] }))),
      leaves: this.leaveService.getLeaves().pipe(catchError(() => of({ success: true, data: [] })))
    }).subscribe({
      next: ({ attendance, leaves }: any) => {
        let records: any[] = [];
        if (attendance.success && Array.isArray(attendance.data)) {
          records = attendance.data;
        }

        let leaveRecords: LeaveRequest[] = [];
        if (leaves.success && Array.isArray(leaves.data)) {
          leaveRecords = leaves.data.filter((l: any) => String(l.employee_id) === String(empId));
        }

        const updatedDays = this.calendarDays().map(day => {
          if (!day.dayNum) return day;

          let dayLeave: LeaveRequest | null = null;
          for (const lr of leaveRecords) {
            if (lr.status === 'APPROVED' || lr.status === 'Approved') {
              const start = new Date(lr.start_date);
              start.setHours(0, 0, 0, 0);
              const end = new Date(lr.end_date);
              end.setHours(23, 59, 59, 999);
              const current = new Date(day.dateString);
              current.setHours(12, 0, 0, 0);

              if (current >= start && current <= end) {
                dayLeave = lr;
                break;
              }
            }
          }

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

          day.records = dayRecords;
          day.primaryRecordId = dayRecords.length > 0 ? dayRecords[dayRecords.length - 1].id : null;

          if (dayRecords.length > 0) {
            const firstRecord = dayRecords[dayRecords.length - 1]; 
            const lastRecord = dayRecords[0]; 

            const status = firstRecord.attendance_status || 'PRESENT';
            day.swipeIn = this.formatTime(firstRecord.swipe_in);
            day.swipeOut = this.formatTime(lastRecord.swipe_out);
            day.rawStatus = status;
            day.rawSwipeIn = firstRecord.swipe_in;
            day.rawSwipeOut = lastRecord.swipe_out;
            day.notes = firstRecord.notes;

            let totalMins = 0;
            dayRecords.forEach((r: any) => {
              totalMins += r.total_work_minutes || 0;
            });

            if (totalMins > 0) {
              const hrs = Math.floor(totalMins / 60);
              const mins = totalMins % 60;
              day.totalTime = `${hrs}h ${mins}m`;
            } else {
              day.totalTime = '-';
            }

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
            day.rawStatus = 'ABSENT';
            if (day.type === '' && new Date(day.dateString) < new Date(new Date().setHours(0, 0, 0, 0))) {
              if (dayLeave) {
                const code = dayLeave.leave_type;
                if (code === 'Casual Leave') day.type = 'CL';
                else if (code === 'Sick Leave') day.type = 'SL';
                else if (code === 'Earned Leave') day.type = 'EL';
                else if (code === 'LOP' || code.includes('Loss of Pay')) day.type = 'LOP';
                else day.type = 'L';
                day.colorClass = 'bg-indigo-500 text-white';
                day.rawStatus = 'ON_LEAVE';
              } else {
                day.type = 'A';
                day.colorClass = 'bg-rose-500 text-white';
              }
            }
          }
          return day;
        });

        this.calendarDays.set(updatedDays);
        this.cdr.detectChanges();
      }
    });
  }

  openEditDialog(day: any) {
    if (!day.dayNum || !this.selectedEmployeeId()) return;
    
    // Disallow future date edits
    const currentDay = new Date();
    currentDay.setHours(0, 0, 0, 0);
    if (new Date(day.dateString) > currentDay) {
       this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Cannot edit future dates.' });
       return;
    }

    this.selectedDay.set(day);
    
    // Prepare form
    this.editForm = {
      attendance_status: day.rawStatus || 'PRESENT',
      swipe_in: this.formatTimeForInput(day.rawSwipeIn),
      swipe_out: this.formatTimeForInput(day.rawSwipeOut),
      notes: day.notes || ''
    };
    
    this.editDialogVisible = true;
  }

  saveAttendance() {
    const day = this.selectedDay();
    const empId = this.selectedEmployeeId();
    if (!day || !empId) return;

    let swipeInISO = this.editForm.swipe_in ? new Date(this.editForm.swipe_in).toISOString() : null;
    let swipeOutISO = this.editForm.swipe_out ? new Date(this.editForm.swipe_out).toISOString() : null;

    const payload = {
      id: day.primaryRecordId,
      employee_id: empId,
      attendance_date: day.dateString,
      swipe_in: swipeInISO,
      swipe_out: swipeOutISO,
      attendance_status: this.editForm.attendance_status,
      notes: this.editForm.notes
    };

    this.attendanceService.updateDailyAttendance(payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Attendance updated' });
          this.editDialogVisible = false;
          this.loadData();
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: res.message });
        }
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update attendance' });
      }
    });
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
