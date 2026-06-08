import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { Breadcrumb } from 'primeng/breadcrumb';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { 
  AttendanceService, 
  AttendanceRecord, 
  DashboardSummary 
} from '../../../services/attendance.service';

@Component({
  selector: 'app-ess-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    Breadcrumb,
    RouterLink
  ],
  templateUrl: './ess-dashboard.html',
  styleUrl: './ess-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EssDashboard implements OnInit {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Dashboard', icon: 'pi pi-chart-bar', routerLink: '/ess/ess-dashboard' }
  ];

  readonly employeeName = signal<string>('');
  readonly employeeEmail = signal<string>('');
  
  readonly dashboardSummary = signal<DashboardSummary>({
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    halfDays: 0,
    totalWorkingMinutes: 0
  });

  readonly recentLogs = signal<AttendanceRecord[]>([]);
  readonly loading = signal<boolean>(false);

  constructor(
    private readonly authService: AuthService,
    private readonly attendanceService: AttendanceService
  ) {}

  ngOnInit(): void {
    const user = this.authService.user();
    if (user) {
      this.employeeName.set(user.employeeName || 'Employee');
      this.employeeEmail.set(user.username || '');
    }
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading.set(true);
    
    // Fetch dashboard summary
    this.attendanceService.getDashboardSummary().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.dashboardSummary.set(res.data);
        }
      }
    });

    // Fetch history logs
    this.attendanceService.getHistory().subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          // Take only latest 5 logs for dashboard overview
          this.recentLogs.set(res.data.slice(0, 5));
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  formatTotalWorkingHours(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  }

  formatTimeString(dateStr: string | null): string {
    if (!dateStr) return '-';
    const normalized = dateStr.replace(' ', 'T');
    const date = new Date(normalized);
    const parsed = isNaN(date.getTime()) ? new Date(dateStr) : date;
    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }
}
