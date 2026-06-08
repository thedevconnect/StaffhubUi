import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { Breadcrumb } from 'primeng/breadcrumb';

@Component({
  selector: 'app-employee-attendance',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    Breadcrumb,

  ],
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
    { label: 'Attendance', icon: 'pi pi-clock', routerLink: '/ess/attendance' }
  ];
  // Swipe state signals
  readonly isSwipedIn = signal<boolean>(false);
  readonly todayPunches = signal<Array<{ type: string; time: string }>>([]);
  readonly duration = signal<string>('00:00:00');

  // Historical logs state
  readonly logs = signal([
    { date: '2026-06-05', checkIn: '09:02 AM', checkOut: '06:15 PM', status: 'Present', duration: '9h 13m' },
    { date: '2026-06-04', checkIn: '08:58 AM', checkOut: '06:02 PM', status: 'Present', duration: '9h 04m' },
    { date: '2026-06-03', checkIn: '09:12 AM', checkOut: '06:30 PM', status: 'Present', duration: '9h 18m' },
    { date: '2026-06-02', checkIn: '-', checkOut: '-', status: 'Weekly Off', duration: '-' },
    { date: '2026-06-01', checkIn: '09:05 AM', checkOut: '06:05 PM', status: 'Present', duration: '9h 00m' }
  ]);

  private clockIntervalId: any;
  private durationIntervalId: any;
  private checkInTime: Date | null = null;

  ngOnInit(): void {
    this.updateClock();
    this.clockIntervalId = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    if (this.clockIntervalId) clearInterval(this.clockIntervalId);
    if (this.durationIntervalId) clearInterval(this.durationIntervalId);
  }

  private updateClock(): void {
    const now = new Date();
    this.currentTime.set(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    this.currentDate.set(now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }

  toggleSwipe(): void {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    if (!this.isSwipedIn()) {
      // Swipe In
      this.isSwipedIn.set(true);
      this.checkInTime = now;
      this.todayPunches.update(punches => [...punches, { type: 'Swipe In', time: timeStr }]);

      // Start duration counter
      this.durationIntervalId = setInterval(() => {
        if (this.checkInTime) {
          const diffMs = new Date().getTime() - this.checkInTime.getTime();
          this.duration.set(this.formatDuration(diffMs));
        }
      }, 1000);
    } else {
      // Swipe Out
      this.isSwipedIn.set(false);
      this.todayPunches.update(punches => [...punches, { type: 'Swipe Out', time: timeStr }]);

      if (this.durationIntervalId) {
        clearInterval(this.durationIntervalId);
      }

      // Add record to history log
      const checkInStr = this.todayPunches()[0]?.time || '09:00 AM';
      const durationVal = this.duration();
      const hoursMinutes = this.formatDurationToHoursMinutes(durationVal);

      const todayDateStr = now.toISOString().split('T')[0];

      this.logs.update(history => [
        { date: todayDateStr, checkIn: checkInStr, checkOut: timeStr, status: 'Present', duration: hoursMinutes },
        ...history
      ]);

      // Reset duration
      this.duration.set('00:00:00');
      this.checkInTime = null;
    }
  }

  private formatDuration(ms: number): string {
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    return [hours, minutes, seconds]
      .map(v => v < 10 ? '0' + v : v)
      .join(':');
  }

  private formatDurationToHoursMinutes(durationStr: string): string {
    const parts = durationStr.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    return `${hours}h ${minutes}m`;
  }
}
