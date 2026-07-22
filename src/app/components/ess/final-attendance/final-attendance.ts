import { ChangeDetectionStrategy, Component, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { AppBreadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { MonthlyAttendanceService } from '../../../shared/services/monthly-attendance.service';
import { AuthService } from '../../../shared/services/services/auth.service';
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
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './final-attendance.html',
  styleUrl: './final-attendance.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinalAttendance implements OnInit {
  private readonly router = inject(Router);
  private readonly monthlyService = inject(MonthlyAttendanceService);
  private readonly authService = inject(AuthService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Final Attendance Summary', icon: 'pi pi-check-square', routerLink: '/ess/final-attendance' }
  ];

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

  ngOnInit(): void {
    this.loadYearlyRecords();
  }

  onYearChange(): void {
    this.loadYearlyRecords();
  }

  loadYearlyRecords(): void {
    this.loading = true;
    const user = this.authService.user();
    const employeeId = user?.id;

    if (!employeeId) {
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
            allMonthsRecords.push({
              monthNumber: month,
              month: `${monthName} ${year}`,
              totalDays: daysInMonth,
              present: s.Present || 0,
              leaves: (s.CL || 0) + (s.EL || 0) + (s.SL || 0) + (s.LWP || 0),
              holidays: s.Holiday || 0,
              weeklyOffs: s['Weekly Off'] || 0,
              paidDays: s['Paid Days'] || 0,
              status: h.status || 'Draft',
              submitDate: h.updated_at || h.created_at,
              recordId: h.id
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
    return {
      monthNumber: month,
      month: `${monthName} ${year}`,
      totalDays: daysInMonth,
      present: 0,
      leaves: 0,
      holidays: 0,
      weeklyOffs: sundays,
      paidDays: effectiveWeeklyOffs,
      status: 'Not Started',
      submitDate: null,
      recordId: null
    };
  }

  navigateToMonthlyAttendance(record: any): void {
    this.router.navigate(['/ess/monthly-attendance'], {
      queryParams: { month: record.monthNumber, year: this.selectedYear }
    });
  }
}
