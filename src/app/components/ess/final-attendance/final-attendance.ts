import { ChangeDetectionStrategy, Component, ChangeDetectorRef, OnInit, inject, signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { AppBreadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DrawerModule } from 'primeng/drawer';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { MonthlyAttendanceService } from '../../../shared/services/monthly-attendance.service';
import { EmployeeManagementService } from '../../../shared/services/employee-management.service';
import { AuthService } from '../../../shared/services/services/auth.service';
import { Employee } from '../../../shared/services/models/employee.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-final-attendance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    AppBreadcrumb,
    ButtonModule,
    SelectModule,
    ToastModule,
    ConfirmDialogModule,
    DrawerModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './final-attendance.html',
  styleUrl: './final-attendance.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinalAttendance implements OnInit {
  private readonly router = inject(Router);
  private readonly monthlyService = inject(MonthlyAttendanceService);
  private readonly employeeService = inject(EmployeeManagementService);
  private readonly authService = inject(AuthService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  isHrView = signal<boolean>(false);

  breadcrumbItems: any[] = [];

  selectedYear: number = new Date().getFullYear();
  years = [
    { label: '2026', value: 2026 },
    { label: '2025', value: 2025 },
    { label: '2024', value: 2024 }
  ];

  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  records: any[] = [];
  loading: boolean = false;

  // HR Admin Employee Selection
  employees = signal<Employee[]>([]);
  selectedEmployeeId = signal<number | null>(null);

  // Detail drawer variables
  detailDrawerVisible: boolean = false;
  selectedMonthRecord: any = null;
  dailyDetails: any[] = [];
  loadingDetails: boolean = false;

  ngOnInit(): void {
    const currentUrl = this.router.url;
    const isHrRoute = currentUrl.includes('/hradmin');
    this.isHrView.set(isHrRoute);

    if (isHrRoute) {
      this.breadcrumbItems = [
        { label: 'HR Administration', icon: 'pi pi-home', routerLink: '/hradmin' },
        { label: 'Final Attendance Summary', icon: 'pi pi-check-square', routerLink: '/hradmin/final-attendance' }
      ];
      this.loadEmployeeList();
    } else {
      this.breadcrumbItems = [
        { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
        { label: 'Final Attendance Summary', icon: 'pi pi-check-square', routerLink: '/ess/final-attendance' }
      ];
      this.loadYearlyRecords();
    }
  }

  loadEmployeeList(): void {
    this.employeeService.getEmployees().subscribe({
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

        if (activeEmployees.length > 0) {
          const firstEmpId = activeEmployees[0].id || (activeEmployees[0] as any).user_id || null;
          this.selectedEmployeeId.set(firstEmpId);
          this.loadYearlyRecords();
        }
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load employee list' });
      }
    });
  }

  onEmployeeSelect(): void {
    this.loadYearlyRecords();
  }

  onYearChange(): void {
    this.loadYearlyRecords();
  }

  get totalYtdDays(): number {
    return this.records.reduce((acc, r) => acc + (r.totalDays || 0), 0);
  }

  get totalYtdPresent(): number {
    return this.records.reduce((acc, r) => acc + (r.present || 0), 0);
  }

  get totalYtdPayable(): number {
    return this.records.reduce((acc, r) => acc + (r.paidDays || 0), 0);
  }

  get averageAttendanceRate(): number {
    if (this.totalYtdDays === 0) return 0;
    return Math.round((this.totalYtdPayable / this.totalYtdDays) * 100);
  }

  loadYearlyRecords(): void {
    this.loading = true;
    let employeeId: number | null = null;

    if (this.isHrView()) {
      employeeId = this.selectedEmployeeId();
    } else {
      const user = this.authService.user();
      employeeId = user?.id || null;
    }

    if (!employeeId) {
      this.records = [];
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    const year = this.selectedYear;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    let maxMonthToLoad = 12;
    if (year > currentYear) {
      maxMonthToLoad = 0;
    } else if (year === currentYear) {
      maxMonthToLoad = currentMonth;
    }

    if (maxMonthToLoad === 0) {
      this.records = [];
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    const allMonthsRecords: any[] = [];
    let completedRequests = 0;

    for (let month = 1; month <= maxMonthToLoad; month++) {
      const daysInMonth = new Date(year, month, 0).getDate();
      const monthName = this.monthNames[month - 1];

      this.monthlyService.createMonthlyAttendance(month, year, employeeId).subscribe({
        next: (res) => {
          completedRequests++;
          if (res && res.success && res.data && res.data.header) {
            const h = res.data.header;
            const s = res.data.summary || {};
            const details = res.data.details || [];

            let present = s.Present || 0;
            let halfDays = (s['Half Day'] || 0) + (s['CL/2'] || 0) + (s['EL/2'] || 0) + (s['SL/2'] || 0);
            let absent = s.Absent || 0;
            let leaves = (s.CL || 0) + (s.EL || 0) + (s.SL || 0) + (s.LWP || 0) + (s.Leave || 0);
            let holidays = s.Holiday || 0;
            let weeklyOffs = s['Weekly Off'] || 0;
            let paidDays = s['Paid Days'] || 0;

            // Fallback calculation directly from details if summary keys were not populated
            if (!present && !absent && details.length > 0) {
              const todayStr = new Date().toISOString().split('T')[0];
              details.forEach((d: any) => {
                const st = (d.attendance_status || '').trim();
                const dStr = typeof d.date === 'string' ? d.date.split('T')[0] : '';
                if (dStr > todayStr && !st) return;

                const upper = st.toUpperCase();
                if (['PRESENT', 'LATE_COMING', 'EARLY_GOING', 'RG', 'REGULARIZED', 'P'].includes(upper)) present++;
                else if (['HALF_DAY', 'HALF DAY', 'HD'].includes(upper)) halfDays++;
                else if (['ABSENT', 'A'].includes(upper)) absent++;
                else if (['WEEKLY_OFF', 'WEEKLY OFF', 'WO', 'WEEKOFF'].includes(upper)) weeklyOffs++;
                else if (['HOLIDAY', 'H'].includes(upper)) holidays++;
                else if (['ON_LEAVE', 'LEAVE', 'L', 'CL', 'SL', 'EL', 'LOP'].includes(upper)) leaves++;
              });
              paidDays = present + weeklyOffs + holidays + leaves + (halfDays * 0.5);
            }

            allMonthsRecords.push({
              monthNumber: month,
              month: `${monthName} ${year}`,
              totalDays: daysInMonth,
              present,
              halfDays,
              absent,
              leaves,
              holidays,
              weeklyOffs,
              paidDays,
              status: h.status || 'Draft',
              submitDate: h.updated_at || h.created_at,
              recordId: h.id,
              rawDetails: details
            });
          } else {
            allMonthsRecords.push(this.getDefaultMonthRecord(month, year, daysInMonth, monthName));
          }

          if (completedRequests === maxMonthToLoad) {
            this.records = allMonthsRecords.sort((a, b) => a.monthNumber - b.monthNumber);
            this.loading = false;
            this.cdr.markForCheck();
          }
        },
        error: () => {
          completedRequests++;
          allMonthsRecords.push(this.getDefaultMonthRecord(month, year, daysInMonth, monthName));

          if (completedRequests === maxMonthToLoad) {
            this.records = allMonthsRecords.sort((a, b) => a.monthNumber - b.monthNumber);
            this.loading = false;
            this.cdr.markForCheck();
          }
        }
      });
    }
  }

  private getDefaultMonthRecord(month: number, year: number, daysInMonth: number, monthName: string) {
    let sundays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      if (new Date(year, month - 1, d).getDay() === 0) sundays++;
    }
    const present = 0;
    const effectiveWeeklyOffs = present >= 6 ? sundays : 0;

    const joiningStr = localStorage.getItem('joiningDate');
    let isBeforeJoiningMonth = false;
    if (joiningStr) {
      try {
        const doj = new Date(joiningStr);
        doj.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59);
        if (endOfMonth < doj) {
          isBeforeJoiningMonth = true;
        }
      } catch (e) { }
    }

    return {
      monthNumber: month,
      month: `${monthName} ${year}`,
      totalDays: daysInMonth,
      present: 0,
      halfDays: 0,
      absent: isBeforeJoiningMonth ? 0 : (daysInMonth - sundays),
      leaves: 0,
      holidays: 0,
      weeklyOffs: sundays,
      paidDays: effectiveWeeklyOffs,
      status: isBeforeJoiningMonth ? 'Not Applicable' : 'Not Started',
      submitDate: null,
      recordId: null,
      rawDetails: []
    };
  }

  openDetailDrawer(rec: any): void {
    this.selectedMonthRecord = rec;
    this.detailDrawerVisible = true;
    this.dailyDetails = rec.rawDetails || [];
    this.cdr.markForCheck();
  }

  navigateToMonthlyAttendance(record: any): void {
    const routePrefix = this.isHrView() ? '/hradmin' : '/ess';
    this.router.navigate([`${routePrefix}/monthly-attendance`], {
      queryParams: { month: record.monthNumber, year: this.selectedYear }
    });
  }
}
