import { Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EmployeeManagementService } from '../../../shared/services/employee-management.service';
import { AttendanceService, AttendanceRecord } from '../../../shared/services/attendance.service';
import { Employee } from '../../../shared/services/models/employee.model';
import { TableTemplate, TableColumn, Tab } from '../../../shared/ui/table-template/table-template';

import { BreadcrumbModule } from 'primeng/breadcrumb';

@Component({
  selector: 'app-hr-attendance-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    SelectModule,
    ToastModule,
    TooltipModule,
    BreadcrumbModule,
    TableTemplate
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

  tabs: Tab[] = [
    { label: 'Monthly (This Month)', value: 0, icon: 'pi pi-calendar' },
    { label: 'Weekly (This Week)', value: 1, icon: 'pi pi-calendar-plus' },
    { label: 'All Time', value: 2, icon: 'pi pi-list' }
  ];
  activeTab = signal<number>(0);

  columns: TableColumn[] = [
    { key: 'attendance_date', header: 'Date', isSortable: true, pipe: 'date', pipeArgs: 'mediumDate' },
    { key: 'attendance_status', header: 'Status', isSortable: true },
    { key: 'swipe_in', header: 'Swipe In', isSortable: true, pipe: 'date', pipeArgs: 'shortTime' },
    { key: 'swipe_out', header: 'Swipe Out', isSortable: true, pipe: 'date', pipeArgs: 'shortTime' },
    { key: 'work_hours', header: 'Work Hours', isSortable: false, formatter: (val, row) => this.formatDuration(row.total_work_minutes) },
    { key: 'device_info', header: 'Device Info', isSortable: false, formatter: (val, row) => `${row.device_name || 'Unknown'} - ${row.browser_name || ''} ${row.os_name ? '(' + row.os_name + ')' : ''}` },
    { key: 'ip_address', header: 'IP Address', isSortable: false },
    { key: 'location', header: 'Location', isSortable: false, formatter: (val, row) => row.swipe_in_address || row.location_address || '' },
  ];

  currentRecords = computed(() => {
    const tab = this.activeTab();
    const now = new Date();

    if (tab === 0) {
      // Monthly
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      firstDay.setHours(0, 0, 0, 0);
      return this.allRecords().filter(r => new Date(r.attendance_date) >= firstDay);
    } else if (tab === 1) {
      // Weekly
      const day = now.getDay() || 7;
      const firstDay = new Date(now);
      firstDay.setHours(0, 0, 0, 0);
      firstDay.setDate(now.getDate() - day + 1);
      return this.allRecords().filter(r => new Date(r.attendance_date) >= firstDay);
    }
    // All time
    return this.allRecords();
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
          const todayStr = new Date().toISOString().split('T')[0];
          const activeEmployees = (res || []).filter(e => {
            const statusUpper = String(e.status || '').toUpperCase();
            const lwdVal = e.last_working_day || e.lastWorkingDay;
            if (statusUpper === 'INACTIVE') {
              if (lwdVal) {
                const lwdStr = new Date(lwdVal).toISOString().split('T')[0];
                return todayStr <= lwdStr;
              }
              return false;
            }
            if (lwdVal) {
              const lwdStr = new Date(lwdVal).toISOString().split('T')[0];
              return todayStr <= lwdStr;
            }
            return true;
          });
          this.employees.set(activeEmployees);
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

  onRefresh() {
    if (this.selectedEmployee()) {
      this.loadAttendanceReport(this.selectedEmployee()!);
    }
  }

  onTabChange(tabValue: number) {
    this.activeTab.set(tabValue);
  }

  loadAttendanceReport(employeeId: number) {
    this.loading.set(true);
    this.attendanceService.getEmployeeHistory(employeeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.allRecords.set(this.consolidateRecords(res.data));
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

  consolidateRecords(records: AttendanceRecord[]): AttendanceRecord[] {
    if (!records || records.length === 0) return [];
    const grouped = new Map<string, AttendanceRecord[]>();

    // Group by date
    for (const record of records) {
      if (!record.attendance_date) continue;
      const dateKey = record.attendance_date.split('T')[0];
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(record);
    }

    const result: AttendanceRecord[] = [];

    for (const dayRecords of grouped.values()) {
      if (dayRecords.length === 1) {
        result.push(dayRecords[0]);
        continue;
      }

      // Sort by swipe_in ascending
      dayRecords.sort((a, b) => {
        const timeA = a.swipe_in ? new Date(a.swipe_in).getTime() : 0;
        const timeB = b.swipe_in ? new Date(b.swipe_in).getTime() : 0;
        return timeA - timeB;
      });

      const firstRecord = dayRecords[0];
      const lastRecord = dayRecords[dayRecords.length - 1];
      const totalMinutes = dayRecords.reduce((sum, r) => sum + (Number(r.total_work_minutes) || 0), 0);

      const isPresent = dayRecords.some(r => r.attendance_status === 'PRESENT' || r.attendance_status === 'Present');

      result.push({
        ...lastRecord,
        swipe_in: firstRecord.swipe_in,
        swipe_in_address: firstRecord.swipe_in_address,
        swipe_out: lastRecord.swipe_out,
        swipe_out_address: lastRecord.swipe_out_address,
        total_work_minutes: totalMinutes,
        attendance_status: isPresent ? 'PRESENT' : lastRecord.attendance_status
      });
    }

    // Sort descending by date
    result.sort((a, b) => new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime());
    return result;
  }

  formatDuration(minutes: number | null): string {
    if (minutes === null || minutes === undefined) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  }
}
