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
} from '../../../services/attendance.service';

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
    FormsModule
  ],
  providers: [MessageService],
  templateUrl: './employee-attendance.html',
  styleUrl: './employee-attendance.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeAttendance implements OnInit, OnDestroy {
  // Real-time clock signals
  readonly currentTime = signal<string>('');
  readonly currentDate = signal<string>('');

  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Attendance', icon: 'pi pi-clock', routerLink: '/ess/employee-attendance' }
  ];

  // Active status signals
  readonly isSwipedIn = signal<boolean>(false);
  readonly isOnBreak = signal<boolean>(false);
  readonly activeRecord = signal<AttendanceRecord | null>(null);
  readonly breakHistory = signal<BreakRecord[]>([]);
  readonly todayPunches = signal<Array<{ type: string; time: string; icon: string; colorClass: string }>>([]);

  // Live timer signals
  readonly duration = signal<string>('00:00:00');
  readonly breakDuration = signal<string>('00:00:00');

  // Dashboard & historical log summaries
  readonly dashboardSummary = signal<DashboardSummary>({
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    halfDays: 0,
    totalWorkingMinutes: 0
  });

  readonly logs = signal<AttendanceRecord[]>([]);

  // UI interaction states (standard properties for direct template binding)
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

  /**
   * Load all attendance data from the backend
   */
  loadAllData(): void {
    this.isActionLoading = true;

    // Fetch today's record
    this.attendanceService.getTodayRecord().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const record = res.data;
          this.activeRecord.set(record);

          // If swiped in (swipe_out is null)
          if (record.swipe_in && !record.swipe_out) {
            this.isSwipedIn.set(true);

            // Fetch breaks for today
            this.attendanceService.getBreakHistory().subscribe({
              next: (breakRes) => {
                if (breakRes.success && Array.isArray(breakRes.data)) {
                  this.breakHistory.set(breakRes.data);

                  // Check if any break is active
                  const activeBreak = breakRes.data.find(b => b.break_end === null);
                  if (activeBreak) {
                    this.isOnBreak.set(true);
                  } else {
                    this.isOnBreak.set(false);
                  }

                  this.buildTodayTimeline(record, breakRes.data);
                  this.startTimerTicks(record, breakRes.data);
                } else {
                  this.buildTodayTimeline(record, []);
                  this.startTimerTicks(record, []);
                }
                this.isActionLoading = false;
              },
              error: () => {
                this.buildTodayTimeline(record, []);
                this.startTimerTicks(record, []);
                this.isActionLoading = false;
              }
            });
          } else {
            // Already swiped out today or no session yet
            this.isSwipedIn.set(false);
            this.isOnBreak.set(false);
            this.stopTimerTicks();

            // Show today's completed session duration
            if (record.swipe_out) {
              const minutes = record.total_work_minutes || 0;
              this.duration.set(this.formatMinutesToHMS(minutes));
            } else {
              this.duration.set('00:00:00');
            }
            this.breakDuration.set('00:00:00');
            this.buildTodayTimeline(record, []);
            this.isActionLoading = false;
          }
        } else {
          // No record today
          this.activeRecord.set(null);
          this.isSwipedIn.set(false);
          this.isOnBreak.set(false);
          this.stopTimerTicks();
          this.duration.set('00:00:00');
          this.breakDuration.set('00:00:00');
          this.todayPunches.set([]);
          this.isActionLoading = false;
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: err.error?.message || 'Failed to load today\'s status.'
        });
        this.isActionLoading = false;
      }
    });

    // Fetch dashboard summary
    this.attendanceService.getDashboardSummary().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.dashboardSummary.set(res.data);
        }
      }
    });

    // Fetch history
    this.attendanceService.getHistory().subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          this.logs.set(res.data);
        }
      }
    });
  }

  /**
   * Start Swipe-In Action
   */
  async performSwipeIn(): Promise<void> {
    this.isActionLoading = true;

    // Detect environment metadata
    const os_name = this.getOSName();
    const browser_name = this.getBrowserName();
    const device_name = this.getDeviceName();
    const coords = await this.getGeolocation();

    const payload: Partial<AttendanceRecord> = {
      os_name,
      browser_name,
      device_name,
      latitude: coords.latitude,
      longitude: coords.longitude,
      location_address: coords.latitude ? `Lat: ${coords.latitude.toFixed(4)}, Long: ${coords.longitude?.toFixed(4)}` : 'Location Access Not Granted'
    };

    this.attendanceService.swipeIn(payload).subscribe({
      next: (res) => {
        this.isActionLoading = false;
        if (res.success) {
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

  /**
   * Show Swipe Out confirmation Dialog
   */
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

  /**
   * Complete Swipe-Out Action
   */
  performSwipeOut(): void {
    this.swipeOutDialogVisible = false;
    this.isActionLoading = true;

    this.attendanceService.swipeOut({ notes: this.swipeOutNote }).subscribe({
      next: (res) => {
        this.isActionLoading = false;
        if (res.success) {
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

  /**
   * Open Break dialog
   */
  openBreakDialog(): void {
    if (!this.isSwipedIn()) return;
    this.selectedBreakReason = 'Lunch Break';
    this.breakDialogVisible = true;
  }

  /**
   * Start break action
   */
  performStartBreak(): void {
    this.breakDialogVisible = false;
    this.isActionLoading = true;

    this.attendanceService.startBreak(this.selectedBreakReason).subscribe({
      next: (res) => {
        this.isActionLoading = false;
        if (res.success) {
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

  /**
   * End break action
   */
  performEndBreak(): void {
    this.isActionLoading = true;

    this.attendanceService.endBreak().subscribe({
      next: (res) => {
        this.isActionLoading = false;
        if (res.success) {
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

  /**
   * Ticking interval logic for live shift and break counters
   */
  private startTimerTicks(record: AttendanceRecord, breaks: BreakRecord[]): void {
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
    }

    const swipeInTime = this.parseDbDate(record.swipe_in);
    if (!swipeInTime) return;

    // Retain total minutes from previous checked-out sessions
    const previousWorkMs = (record.total_work_minutes || 0) * 60000;

    // Calculate sum of completed break minutes in ms
    const completedBreaksMs = breaks
      .filter(b => b.break_end !== null)
      .reduce((sum, b) => sum + (b.break_minutes || 0) * 60000, 0);

    // Find if there is an active break session
    const activeBreak = breaks.find(b => b.break_end === null);
    const activeBreakStartTime = activeBreak ? this.parseDbDate(activeBreak.break_start) : null;

    this.timerIntervalId = setInterval(() => {
      const now = new Date();

      if (activeBreakStartTime) {
        // User is currently ON BREAK
        // Break duration ticks up
        const breakElapsed = now.getTime() - activeBreakStartTime.getTime();
        this.breakDuration.set(this.formatMsToHMS(breakElapsed));

        // Work duration frozen at the moment break started
        const currentSessionElapsedAtBreakStart = activeBreakStartTime.getTime() - swipeInTime.getTime() - completedBreaksMs;
        const totalWorkElapsedAtBreakStart = previousWorkMs + currentSessionElapsedAtBreakStart;
        this.duration.set(this.formatMsToHMS(Math.max(0, totalWorkElapsedAtBreakStart)));
      } else {
        // User is WORKING (Not on break)
        const currentSessionWorkElapsed = now.getTime() - swipeInTime.getTime() - completedBreaksMs;
        const totalWorkElapsed = previousWorkMs + currentSessionWorkElapsed;
        this.duration.set(this.formatMsToHMS(Math.max(0, totalWorkElapsed)));
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

  /**
   * Helper to construct chronological today timeline
   */
  private buildTodayTimeline(record: AttendanceRecord | null, breaks: BreakRecord[]): void {
    const timeline: Array<{ type: string; time: string; icon: string; colorClass: string }> = [];
    if (!record) {
      this.todayPunches.set([]);
      return;
    }

    // Add Swipe In
    if (record.swipe_in) {
      timeline.push({
        type: 'Swipe In',
        time: this.formatDateTimeToTime(record.swipe_in),
        icon: 'pi pi-sign-in',
        colorClass: 'border-emerald-500 bg-emerald-50 text-emerald-600'
      });
    }

    // Add breaks
    // Sort breaks chronologically
    const sortedBreaks = [...breaks].sort((a, b) => {
      const dateA = this.parseDbDate(a.break_start)?.getTime() || 0;
      const dateB = this.parseDbDate(b.break_start)?.getTime() || 0;
      return dateA - dateB;
    });

    sortedBreaks.forEach(b => {
      if (b.break_start) {
        timeline.push({
          type: `Break Started${b.reason ? ' (' + b.reason + ')' : ''}`,
          time: this.formatDateTimeToTime(b.break_start),
          icon: 'pi pi-pause',
          colorClass: 'border-amber-500 bg-amber-50 text-amber-600'
        });
      }
      if (b.break_end) {
        timeline.push({
          type: 'Break Ended',
          time: this.formatDateTimeToTime(b.break_end),
          icon: 'pi pi-play',
          colorClass: 'border-sky-500 bg-sky-50 text-sky-600'
        });
      }
    });

    // Add Swipe Out
    if (record.swipe_out) {
      timeline.push({
        type: 'Swipe Out',
        time: this.formatDateTimeToTime(record.swipe_out),
        icon: 'pi pi-sign-out',
        colorClass: 'border-rose-500 bg-rose-50 text-rose-600'
      });
    }

    // Reverse timeline to show most recent activities first (looks much better in logs panel)
    this.todayPunches.set(timeline.reverse());
  }

  /**
   * Helper formatting functions
   */
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

  private formatDateTimeToTime(dateStr: string): string {
    const date = this.parseDbDate(dateStr);
    if (!date) return '-';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  formatTimeString(dateStr: string | null): string {
    if (!dateStr) return '-';
    return this.formatDateTimeToTime(dateStr);
  }

  formatDecimal(val: any): string {
    if (val === null || val === undefined || isNaN(val)) return '-';
    return Number(val).toFixed(4);
  }

  /**
   * Browser environment utilities
   */
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
        { timeout: 5000 }
      );
    });
  }
}
