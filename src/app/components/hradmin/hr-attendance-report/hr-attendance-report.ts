import { Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AppBreadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EmployeeManagementService } from '../../../shared/services/employee-management.service';
import { AttendanceService, AttendanceRecord } from '../../../shared/services/attendance.service';
import { Employee } from '../../../shared/services/models/employee.model';

@Component({
  selector: 'app-hr-attendance-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    SelectModule,
    TabsModule,
    ToastModule,
    AppBreadcrumb
  ],
  providers: [MessageService],
  templateUrl: './hr-attendance-report.html'
})
export class HrAttendanceReport implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private employeeService = inject(EmployeeManagementService);
  private attendanceService = inject(AttendanceService);
  private messageService = inject(MessageService);

  breadcrumbItems = [
    { label: 'HR Administration', icon: 'pi pi-home', routerLink: '/hradmin' },
    { label: 'Attendance Report', icon: 'pi pi-chart-line' },
  ];

  employees = signal<Employee[]>([]);
  selectedEmployee = signal<number | null>(null);

  loading = signal(false);
  allRecords = signal<AttendanceRecord[]>([]);

  // Filtering Logic
  monthlyRecords = computed(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    firstDay.setHours(0, 0, 0, 0);
    return this.allRecords().filter(r => new Date(r.attendance_date) >= firstDay);
  });

  weeklyRecords = computed(() => {
    const now = new Date();
    // Start of current week (assuming Monday)
    const day = now.getDay() || 7;
    const firstDay = new Date(now);
    firstDay.setHours(0, 0, 0, 0);
    firstDay.setDate(now.getDate() - day + 1);
    return this.allRecords().filter(r => new Date(r.attendance_date) >= firstDay);
  });

  constructor() { }

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees() {
    this.employeeService.getEmployees()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.employees.set(res);
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load employees' });
        }
      });
  }

  onEmployeeSelect(event: any) {
    if (!this.selectedEmployee()) return;
    this.loadAttendanceReport(this.selectedEmployee()!);
  }

  loadAttendanceReport(employeeId: number) {
    this.loading.set(true);
    this.attendanceService.getEmployeeHistory(employeeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.allRecords.set(res.data);
          } else {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: res.message });
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to load report' });
          this.loading.set(false);
        }
      });
  }

  formatDuration(minutes: number | null): string {
    if (minutes === null || minutes === undefined) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  }
}
