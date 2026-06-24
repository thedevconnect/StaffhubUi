import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { Breadcrumb } from 'primeng/breadcrumb';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import {
  AttendanceService,
  AttendanceRecord,
  BreakRecord,
  DashboardSummary
} from '../../../shared/services/attendance.service';
import { TableColumn, TableTemplate } from '../../../shared/ui/table-template/table-template';

export interface CalendarDay {
  date: Date;
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  status: 'P' | 'A' | 'EL' | 'CL' | 'LOP' | 'EL/2' | 'CL/2' | 'LOP/2' | 'Week Off' | 'Holiday' | null;
  swipeIn?: string;
  swipeOut?: string;
  records?: AttendanceRecord[];
}

@Component({
  selector: 'app-employee-attendance',
  standalone: true,

  imports: [
    CommonModule,
    CardModule,
    TableModule,
    Breadcrumb,
    DialogModule,
    ToastModule,
    FormsModule,
    TableTemplate
  ],
  providers: [MessageService],
  templateUrl: './employee-attendance.html',
  styleUrl: './employee-attendance.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeAttendance implements OnInit, OnDestroy {
  readonly currentTime = signal<string>('');
  readonly currentDate = signal<string>('');

  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Attendance', icon: 'pi pi-clock', routerLink: '/ess/employee-attendance' }
  ];

  readonly isSwipedIn = signal<boolean>(false);
  readonly isOnBreak = signal<boolean>(false);
  readonly activeRecord = signal<AttendanceRecord | null>(null);
  //readonly breakHistory = signal<BreakRecord[]>([]);
  readonly todayPunches = signal<Array<{ type: string; time: string; icon: string; colorClass: string }>>([]);

  readonly duration = signal<string>('00:00:00');
  readonly breakDuration = signal<string>('00:00:00');
  // Table Pagination
  pageNo = 1
  pageSize = 10
  totalCount = 0

  searchText = ''
  readonly dashboardSummary = signal<DashboardSummary>({
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    halfDays: 0,
    totalWorkingMinutes: 0
  });

  readonly logs = signal<AttendanceRecord[]>([]);

  // Calendar View State
  viewMode = signal<'table' | 'calendar'>('table');
  currentMonthDate = signal<Date>(new Date());
  calendarWeeks = signal<CalendarDay[][]>([]);
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  isActionLoading = false;
  breakDialogVisible = false;
  selectedBreakReason = 'Lunch Break';
  swipeOutDialogVisible = false;
  swipeOutNote = '';

  readonly breakReasons: string[] = [
    'Lunch Break',
    'Tea/Coffee Break',
    'Short Break',
    'Client Meeting',
    'Personal Work',
    'Other'
  ];

  private clockIntervalId: any;
  private timerIntervalId: any;

  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.updateClock();
    this.clockIntervalId = setInterval(() => this.updateClock(), 1000);
    this.loadAllData();
  }

  ngOnDestroy(): void {
    if (this.clockIntervalId) clearInterval(this.clockIntervalId);
    if (this.timerIntervalId) clearInterval(this.timerIntervalId);
  }

  private updateClock(): void {
    const now = new Date();
    this.currentTime.set(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    this.currentDate.set(now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }

  loadAllData(): void {
    this.isActionLoading = true;

    this.attendanceService.getTodayRecord().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const record = res.data;
          const allTodayRecords = (res as any).allToday || (record ? [record] : []);
          this.activeRecord.set(record);

          if (record.swipe_in && !record.swipe_out) {
            this.isSwipedIn.set(true);

            // this.attendanceService.getBreakHistory().subscribe({
            //   next: (breakRes) => {
            //     const breaks = breakRes.success && Array.isArray(breakRes.data) ? breakRes.data : [];

            //     this.breakHistory.set(breaks);
            //     this.isOnBreak.set(breaks.some(b => b.break_end === null));

            //     this.buildTodayTimeline(allTodayRecords, breaks);
            //     this.startTimerTicks(record, breaks);

            //     this.isActionLoading = false;
            //   },
            //   error: () => {
            //     this.breakHistory.set([]);
            //     this.isOnBreak.set(false);
            //     this.buildTodayTimeline(allTodayRecords, []);
            //     this.startTimerTicks(record, []);
            //     this.isActionLoading = false;
            //   }
            // });
          } else {
            this.isSwipedIn.set(false);
            this.isOnBreak.set(false);
            this.stopTimerTicks();

            if (record.swipe_out) {
              this.duration.set(this.formatMinutesToHMS(record.total_work_minutes || 0));
            } else {
              this.duration.set('00:00:00');
            }

            this.breakDuration.set('00:00:00');
            this.buildTodayTimeline(allTodayRecords, []);
            this.isActionLoading = false;
          }
        } else {
          this.resetTodayState();
          this.isActionLoading = false;
        }
      },
      error: (err) => {
        this.resetTodayState();
        this.isActionLoading = false;

        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: err.error?.message || 'Failed to load today status.'
        });
      }
    });

    this.attendanceService.getDashboardSummary().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.dashboardSummary.set(res.data);
        }
      }
    });

    this.attendanceService.getHistory().subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          const formattedData = res.data.map((record: any) => ({
            ...record,
            attendance_date: record.attendance_date ? record.attendance_date.split('T')[0] : '-',
            swipe_in: this.formatDateTimeToTime(record.swipe_in),
            swipe_out: this.formatDateTimeToTime(record.swipe_out),
            swipe_in_location: record.swipe_in_address || record.location_address || '-',
            swipe_out_location: record.swipe_out_address || '-',
            created_at: this.formatDateTime(record.created_at),
            updated_at: this.formatDateTime(record.updated_at)
          }));
          this.logs.set(formattedData);
          if (this.viewMode() === 'calendar') {
            this.generateCalendar();
          }
        }
      }
    });
  }

  onPageChange(newPage: number) {
    this.pageNo = newPage

    this.loadAllData()
  }

  // Search

  onSearchChange(value: string) {
    this.searchText = value

    this.pageNo = 1

    this.loadAllData()
  }

  // Page Size

  onPageSizeChange(size: number) {
    this.pageSize = size

    this.pageNo = 1

    this.loadAllData()
  }

  // Sorting

  onSortChange(event: any) {
    console.log('Sort Event', event)

    this.loadAllData()
  }

  onActionClicked(event: any) {
    console.log('Action clicked', event)
  }
  // Table Columns

  columns: TableColumn[] = [
    { key: 'actions', header: 'Actions', isVisible: true },
    { key: 'employee_id', header: 'Employee ID', isVisible: true, isSortable: true },
    { key: 'attendance_date', header: 'Attendance Date', isVisible: true, isSortable: true },
    { key: 'swipe_in', header: 'Swipe In', isVisible: true, isSortable: true },
    { key: 'swipe_in_location', header: 'Swipe In Location', isVisible: true },
    { key: 'swipe_out', header: 'Swipe Out', isVisible: true, isSortable: true },
    { key: 'swipe_out_location', header: 'Swipe Out Location', isVisible: true },
    { key: 'attendance_status', header: 'Status', isVisible: true, isSortable: true },
    { key: 'created_at', header: 'Created At', isVisible: true, isSortable: true },
    { key: 'updated_at', header: 'Updated At', isVisible: true, isSortable: true }
  ]

  rowActions = [
    { label: 'View', icon: 'pi pi-eye', id: 'view' },
    { label: 'Edit', icon: 'pi pi-pencil', id: 'edit' },
    { label: 'Delete', icon: 'pi pi-trash', id: 'delete' }
  ];

  // Calendar Logic
  toggleViewMode(mode: 'table' | 'calendar'): void {
    this.viewMode.set(mode);
    if (mode === 'calendar') {
      this.generateCalendar();
    }
  }

  prevMonth(): void {
    const current = this.currentMonthDate();
    this.currentMonthDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
    this.generateCalendar();
  }

  nextMonth(): void {
    const current = this.currentMonthDate();
    this.currentMonthDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
    this.generateCalendar();
  }

  generateCalendar(): void {
    const year = this.currentMonthDate().getFullYear();
    const month = this.currentMonthDate().getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const endDate = new Date(lastDay);
    if (endDate.getDay() !== 6) {
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    }

    const weeks: CalendarDay[][] = [];
    let currentWeek: CalendarDay[] = [];

    let loopDate = new Date(startDate);

    // Normalize today for comparison without time
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    while (loopDate <= endDate) {
      const dateStr = `${loopDate.getFullYear()}-${String(loopDate.getMonth() + 1).padStart(2, '0')}-${String(loopDate.getDate()).padStart(2, '0')}`;
      const isCurrentMonth = loopDate.getMonth() === month;

      const day: CalendarDay = {
        date: new Date(loopDate),
        dateStr,
        dayNumber: loopDate.getDate(),
        isCurrentMonth,
        isToday: dateStr === todayStr,
        status: null,
      };

      currentWeek.push(day);

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      loopDate.setDate(loopDate.getDate() + 1);
    }

    this.calendarWeeks.set(weeks);
    this.mapDataToCalendar();
  }

  mapDataToCalendar(): void {
    const weeks = this.calendarWeeks();
    const logs = this.logs();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const updatedWeeks = weeks.map(week => {
      return week.map(day => {
        const records = logs.filter(log => log.attendance_date === day.dateStr);
        let status: CalendarDay['status'] = null;
        let swipeIn = '';
        let swipeOut = '';

        const dayOfWeek = day.date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (records.length > 0) {
          status = 'P';
          swipeIn = records[0].swipe_in || '';
          swipeOut = records[records.length - 1].swipe_out || '';
        } else if (isWeekend) {
          status = 'Week Off';
        } else if (day.dateStr < todayStr) {
          status = 'A';
        }

        return { ...day, status, swipeIn, swipeOut, records };
      });
    });

    this.calendarWeeks.set(updatedWeeks);
  }

  async performSwipeIn(): Promise<void> {
    this.isActionLoading = true;

    const os_name = this.getOSName();
    const browser_name = this.getBrowserName();
    const device_name = this.getDeviceName();
    const coords = await this.getGeolocation();

    if (!coords.latitude || !coords.longitude) {
      this.isActionLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Location Required',
        detail: 'Location permission is mandatory to Swipe In. Please allow location access.'
      });
      return;
    }

    const ip_address = await this.getIpAddress();
    if (!ip_address) {
      this.isActionLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Network Error',
        detail: 'Unable to retrieve IP Address. Please check your connection.'
      });
      return;
    }

    const location_address = await this.getDetailedLocation(coords.latitude, coords.longitude);

    const payload: Partial<AttendanceRecord> = {
      os_name,
      browser_name,
      device_name,
      latitude: coords.latitude,
      longitude: coords.longitude,
      location_address: location_address,
      ip_address: ip_address
    };

    this.attendanceService.swipeIn(payload).subscribe({
      next: (res) => {
        this.isActionLoading = false;

        if (res.success) {
          const now = new Date().toISOString();

          const newRecord: any = {
            id: res.data?.id || res.data?.attendanceId,
            attendance_date: now.split('T')[0],
            swipe_in: now,
            swipe_out: null,
            total_work_minutes: 0,
            attendance_status: 'PRESENT',
            notes: '',
            os_name,
            browser_name,
            device_name,
            latitude: coords.latitude,
            longitude: coords.longitude,
            location_address: payload.location_address,
            ip_address: ip_address
          };

          this.activeRecord.set(newRecord);
          this.isSwipedIn.set(true);
          this.isOnBreak.set(false);
          //this.breakHistory.set([]);
          this.duration.set('00:00:00');
          this.breakDuration.set('00:00:00');

          this.buildTodayTimeline(newRecord, []);
          this.startTimerTicks(newRecord, []);

          this.messageService.add({
            severity: 'success',
            summary: 'Checked In',
            detail: 'Swiped in successfully!'
          });

          this.loadAllData();
        }
      },
      error: (err) => {
        this.isActionLoading = false;

        this.messageService.add({
          severity: 'error',
          summary: 'Swipe In Failed',
          detail: err.error?.message || 'Already checked in or server error.'
        });
      }
    });
  }

  confirmSwipeOut(): void {
    if (this.isOnBreak()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Action Blocked',
        detail: 'Please end your active break before checking out.'
      });
      return;
    }

    this.swipeOutNote = '';
    this.swipeOutDialogVisible = true;
  }

  async performSwipeOut(): Promise<void> {
    this.swipeOutDialogVisible = false;
    this.isActionLoading = true;

    const os_name = this.getOSName();
    const browser_name = this.getBrowserName();
    const device_name = this.getDeviceName();
    const coords = await this.getGeolocation();

    if (!coords.latitude || !coords.longitude) {
      this.isActionLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Location Required',
        detail: 'Location permission is mandatory to Swipe Out. Please allow location access.'
      });
      return;
    }

    const ip_address = await this.getIpAddress();
    if (!ip_address) {
      this.isActionLoading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Network Error',
        detail: 'Unable to retrieve IP Address. Please check your connection.'
      });
      return;
    }

    const location_address = await this.getDetailedLocation(coords.latitude, coords.longitude);

    const payload = {
      notes: this.swipeOutNote,
      os_name,
      browser_name,
      device_name,
      latitude: coords.latitude,
      longitude: coords.longitude,
      location_address: location_address,
      ip_address: ip_address
    };

    this.attendanceService.swipeOut(payload).subscribe({
      next: (res) => {
        this.isActionLoading = false;

        if (res.success) {
          const current = this.activeRecord();
          const now = new Date().toISOString();

          if (current) {
            const updatedRecord: any = {
              ...current,
              swipe_out: now,
              notes: this.swipeOutNote
            };

            this.activeRecord.set(updatedRecord);
          }

          this.isSwipedIn.set(false);
          this.isOnBreak.set(false);
          this.breakDuration.set('00:00:00');
          this.stopTimerTicks();

          this.messageService.add({
            severity: 'success',
            summary: 'Checked Out',
            detail: 'Swiped out successfully!'
          });

          this.loadAllData();
        }
      },
      error: (err) => {
        this.isActionLoading = false;

        this.messageService.add({
          severity: 'error',
          summary: 'Swipe Out Failed',
          detail: err.error?.message || 'Server error.'
        });
      }
    });
  }

  openBreakDialog(): void {
    if (!this.isSwipedIn()) return;
    this.selectedBreakReason = 'Lunch Break';
    this.breakDialogVisible = true;
  }

  performStartBreak(): void {
    this.breakDialogVisible = false;
    this.isActionLoading = true;

    this.attendanceService.startBreak(this.selectedBreakReason).subscribe({
      next: (res: any) => {
        this.isActionLoading = false;

        if (res.success) {
          this.isOnBreak.set(true);

          this.messageService.add({
            severity: 'success',
            summary: 'Break Started',
            detail: `Started: ${this.selectedBreakReason}`
          });

          this.loadAllData();
        }
      },
      error: (err) => {
        this.isActionLoading = false;

        this.messageService.add({
          severity: 'error',
          summary: 'Break Failed',
          detail: err.error?.message || 'Unable to start break session.'
        });
      }
    });
  }

  performEndBreak(): void {
    this.isActionLoading = true;

    this.attendanceService.endBreak().subscribe({
      next: (res: any) => {
        this.isActionLoading = false;

        if (res.success) {
          this.isOnBreak.set(false);
          this.breakDuration.set('00:00:00');

          this.messageService.add({
            severity: 'success',
            summary: 'Break Ended',
            detail: 'Returned from break successfully!'
          });

          this.loadAllData();
        }
      },
      error: (err) => {
        this.isActionLoading = false;

        this.messageService.add({
          severity: 'error',
          summary: 'Action Failed',
          detail: err.error?.message || 'Unable to end break session.'
        });
      }
    });
  }

  private resetTodayState(): void {
    this.activeRecord.set(null);
    this.isSwipedIn.set(false);
    this.isOnBreak.set(false);
    // this.breakHistory.set([]);
    this.todayPunches.set([]);
    this.duration.set('00:00:00');
    this.breakDuration.set('00:00:00');
    this.stopTimerTicks();
  }

  private startTimerTicks(record: AttendanceRecord, breaks: BreakRecord[]): void {
    if (this.timerIntervalId) clearInterval(this.timerIntervalId);

    const swipeInTime = this.parseDbDate(record.swipe_in);
    if (!swipeInTime) return;

    const previousWorkMs = (record.total_work_minutes || 0) * 60000;

    const completedBreaksMs = breaks
      .filter(b => b.break_end !== null)
      .reduce((sum, b) => sum + (b.break_minutes || 0) * 60000, 0);

    const activeBreak = breaks.find(b => b.break_end === null);
    const activeBreakStartTime = activeBreak ? this.parseDbDate(activeBreak.break_start) : null;

    this.timerIntervalId = setInterval(() => {
      const now = new Date();

      if (activeBreakStartTime) {
        const breakElapsed = now.getTime() - activeBreakStartTime.getTime();
        this.breakDuration.set(this.formatMsToHMS(breakElapsed));

        const currentSessionElapsedAtBreakStart =
          activeBreakStartTime.getTime() - swipeInTime.getTime() - completedBreaksMs;

        this.duration.set(this.formatMsToHMS(Math.max(0, previousWorkMs + currentSessionElapsedAtBreakStart)));
      } else {
        const currentSessionWorkElapsed = now.getTime() - swipeInTime.getTime() - completedBreaksMs;
        this.duration.set(this.formatMsToHMS(Math.max(0, previousWorkMs + currentSessionWorkElapsed)));
        this.breakDuration.set('00:00:00');
      }
    }, 1000);
  }

  private stopTimerTicks(): void {
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
  }

  private buildTodayTimeline(records: AttendanceRecord[] | AttendanceRecord | null, breaks: BreakRecord[]): void {
    const timeline: Array<{ type: string; time: string; timestamp: number; icon: string; colorClass: string }> = [];

    if (!records) {
      this.todayPunches.set([]);
      return;
    }

    const recordsList = Array.isArray(records) ? records : [records];

    recordsList.forEach(record => {
      if (record.swipe_in) {
        const dt = this.parseDbDate(record.swipe_in);
        const loc = record.swipe_in_address || record.location_address;
        timeline.push({
          type: loc ? `Swipe In (${loc})` : 'Swipe In',
          time: this.formatDateTimeToTime(record.swipe_in),
          timestamp: dt ? dt.getTime() : 0,
          icon: 'pi pi-sign-in',
          colorClass: 'border-emerald-500 bg-emerald-50 text-emerald-600'
        });
      }
      if (record.swipe_out) {
        const dt = this.parseDbDate(record.swipe_out);
        const loc = record.swipe_out_address;
        const typeStr = record.notes
          ? `Swipe Out (${record.notes})${loc ? ' @ ' + loc : ''}`
          : `Swipe Out${loc ? ' @ ' + loc : ''}`;
        timeline.push({
          type: typeStr,
          time: this.formatDateTimeToTime(record.swipe_out),
          timestamp: dt ? dt.getTime() : 0,
          icon: 'pi pi-sign-out',
          colorClass: 'border-rose-500 bg-rose-50 text-rose-600'
        });
      }
    });

    breaks.forEach(b => {
      if (b.break_start) {
        const dt = this.parseDbDate(b.break_start);
        timeline.push({
          type: b.reason ? `Break Started (${b.reason})` : 'Break Started',
          time: this.formatDateTimeToTime(b.break_start),
          timestamp: dt ? dt.getTime() : 0,
          icon: 'pi pi-pause',
          colorClass: 'border-amber-500 bg-amber-50 text-amber-600'
        });
      }

      if (b.break_end) {
        const dt = this.parseDbDate(b.break_end);
        timeline.push({
          type: 'Break Ended',
          time: this.formatDateTimeToTime(b.break_end),
          timestamp: dt ? dt.getTime() : 0,
          icon: 'pi pi-play',
          colorClass: 'border-sky-500 bg-sky-50 text-sky-600'
        });
      }
    });

    timeline.sort((a, b) => b.timestamp - a.timestamp);

    this.todayPunches.set(timeline.map(item => ({
      type: item.type,
      time: item.time,
      icon: item.icon,
      colorClass: item.colorClass
    })));
  }

  private parseDbDate(dateStr: string | null): Date | null {
    if (!dateStr) return null;
    const normalized = dateStr.replace(' ', 'T');
    const parsed = new Date(normalized);
    return isNaN(parsed.getTime()) ? new Date(dateStr) : parsed;
  }

  private formatMsToHMS(ms: number): string {
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return [hours, minutes, seconds].map(v => v < 10 ? '0' + v : v).join(':');
  }

  private formatMinutesToHMS(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return [hours, mins, 0].map(v => v < 10 ? '0' + v : v).join(':');
  }

  formatTotalWorkingHours(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  }

  private formatDateTimeToTime(dateStr: string | null): string {
    if (!dateStr) return '-';
    const date = this.parseDbDate(dateStr);
    if (!date) return '-';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  private formatDateTime(dateStr: string | null): string {
    if (!dateStr) return '-';
    const date = this.parseDbDate(dateStr);
    if (!date) return '-';
    const d = date.toISOString().split('T')[0];
    const t = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${d} ${t}`;
  }

  formatTimeString(dateStr: string | null): string {
    if (!dateStr) return '-';
    return this.formatDateTimeToTime(dateStr);
  }

  formatDecimal(val: any): string {
    if (val === null || val === undefined || isNaN(val)) return '-';
    return Number(val).toFixed(4);
  }

  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
    if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) return 'Opera';
    if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
    if (userAgent.indexOf('Safari') > -1) return 'Safari';
    if (userAgent.indexOf('Edge') > -1 || userAgent.indexOf('Edg') > -1) return 'Edge';
    if (userAgent.indexOf('Trident') > -1) return 'Internet Explorer';
    return 'Browser';
  }

  private getOSName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf('Windows') > -1) return 'Windows';
    if (userAgent.indexOf('Macintosh') > -1 || userAgent.indexOf('Mac OS') > -1) return 'macOS';
    if (userAgent.indexOf('Linux') > -1) return 'Linux';
    if (userAgent.indexOf('Android') > -1) return 'Android';
    if (userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1) return 'iOS';
    return 'Operating System';
  }

  private getDeviceName(): string {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    return isMobile ? 'Mobile' : 'Desktop';
  }

  private getGeolocation(): Promise<{ latitude: number | null; longitude: number | null }> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ latitude: null, longitude: null });
        return;
      }

      // First try with enableHighAccuracy: true and maximumAge: 0 to force bypass cache
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('High accuracy geolocation failed or timed out. Trying standard resolution...', error);
          // Fallback to enableHighAccuracy: false
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });
            },
            () => {
              resolve({ latitude: null, longitude: null });
            },
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 }
          );
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  }

  private async getIpAddress(): Promise<string | null> {
    try {
      const res = await fetch('https://api.ipify.org?format=json').then(r => r.json());
      return res.ip || null;
    } catch {
      return null;
    }
  }

  private async getDetailedLocation(lat: number, lon: number): Promise<string> {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      let displayName = data.display_name || `Lat: ${lat.toFixed(4)}, Long: ${lon.toFixed(4)}`;

      // Override OpenStreetMap's geocoding mistake for Uttam Nagar postcode 110059
      if (displayName.includes('110059') && displayName.includes('Patel Nagar')) {
        displayName = displayName.replace('Patel Nagar', 'Uttam Nagar');
      }

      return displayName;
    } catch {
      return `Lat: ${lat.toFixed(4)}, Long: ${lon.toFixed(4)}`;
    }
  }
}