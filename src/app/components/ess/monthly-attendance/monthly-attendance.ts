import { Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormArray } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ActivatedRoute } from '@angular/router';

import { MonthlyAttendanceService } from '../../../shared/services/monthly-attendance.service';
import { EmployeeManagementService } from '../../../shared/services/employee-management.service';
import { UserService } from '../../../shared/services/user-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppBreadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-monthly-attendance',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    SelectModule,
    ToastModule,
    AppBreadcrumb,
    ConfirmDialogModule,
    InputTextModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './monthly-attendance.html'
})
export class MonthlyAttendance implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly monthlyService = inject(MonthlyAttendanceService);
  private readonly employeeService = inject(EmployeeManagementService);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  isPrivileged = false;
  employees: any[] = [];

  breadcrumbItems = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Monthly Final Attendance', icon: 'pi pi-calendar-times' },
  ];

  allMonths = [
    { label: 'January', value: 1 }, { label: 'February', value: 2 },
    { label: 'March', value: 3 }, { label: 'April', value: 4 },
    { label: 'May', value: 5 }, { label: 'June', value: 6 },
    { label: 'July', value: 7 }, { label: 'August', value: 8 },
    { label: 'September', value: 9 }, { label: 'October', value: 10 },
    { label: 'November', value: 11 }, { label: 'December', value: 12 },
  ];

  years = [
    { label: '2026', value: 2026 },
    { label: '2025', value: 2025 },
    { label: '2024', value: 2024 },
  ];

  statusOptions = [
    { label: 'Present', value: 'Present' },
    { label: 'Absent', value: 'Absent' },
    { label: 'Weekly Off', value: 'Weekly Off' },
    { label: 'Holiday', value: 'Holiday' },
    { label: 'Casual Leave', value: 'CL' },
    { label: 'Earned Leave', value: 'EL' },
    { label: 'Sick Leave', value: 'SL' },
    { label: 'Half Day', value: 'Half Day' },
    { label: 'Casual Leave/2', value: 'CL/2' },
    { label: 'Earned Leave/2', value: 'EL/2' },
    { label: 'Sick Leave/2', value: 'SL/2' },
    { label: 'Work From Home', value: 'WFH' },
    { label: 'Other Duty', value: 'OD' },
    { label: 'Leave Without Pay', value: 'LWP' }
  ];

  filterForm: FormGroup;
  attendanceForm: FormGroup;
  loading = signal(false);
  saving = signal(false);
  submitting = signal(false);

  currentRecord: any = null;
  summary: any = null;

  // Dynamically filter months up to current month for current year
  availableMonths = computed(() => {
    const filterYear = Number(this.filterForm?.get('year')?.value || new Date().getFullYear());
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;

    let maxMonth = 12;
    if (filterYear === curYear) {
      maxMonth = curMonth;
    } else if (filterYear > curYear) {
      maxMonth = 0;
    }

    return this.allMonths.filter(m => m.value <= maxMonth);
  });

  // Current month & Last month can be edited/submitted
  isEditable = computed(() => {
    const filter = this.filterForm?.value;
    if (!filter) return true;

    const selMonth = Number(filter.month);
    const selYear = Number(filter.year);

    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();

    // Current month
    if (selYear === curYear && selMonth === curMonth) {
      return true;
    }

    // Previous month in same year
    if (selYear === curYear && selMonth === curMonth - 1) {
      return true;
    }

    // Previous month across year boundary (e.g. Jan 2026 -> Dec 2025)
    if (curMonth === 1 && selYear === curYear - 1 && selMonth === 12) {
      return true;
    }

    return false; // Older months are read-only
  });

  constructor() {
    this.filterForm = this.fb.group({
      employee_id: [null],
      month: [new Date().getMonth() + 1],
      year: [new Date().getFullYear()]
    });

    this.attendanceForm = this.fb.group({
      details: this.fb.array([])
    });

    this.attendanceForm.valueChanges.pipe(takeUntilDestroyed()).subscribe(val => {
      this.calculateSummary(val.details);
    });
  }

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['month'] && params['year']) {
        this.filterForm.patchValue({
          month: Number(params['month']),
          year: Number(params['year'])
        });
      }
      this.loadAttendance();
    });

    this.userService.getUserSidebar('').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loadEmployees();
      }
    });
  }

  loadEmployees() {
    this.employeeService.getGlobalEmployees().subscribe({
      next: (res) => {
        this.employees = res || [];
        if (this.employees.length > 0) {
          this.isPrivileged = true;
        }
      },
      error: () => {
        this.isPrivileged = false;
      }
    });
  }

  get detailsArray() {
    return this.attendanceForm.get('details') as FormArray;
  }

  loadAttendance() {
    if (this.filterForm.invalid) return;
    this.loading.set(true);

    const { month, year, employee_id } = this.filterForm.value;

    this.monthlyService.createMonthlyAttendance(month, year, employee_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.currentRecord = res.data.header;
            this.summary = res.data.summary;
            this.buildForm(res.data.details);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to load attendance' });
          this.loading.set(false);
        }
      });
  }

  buildForm(details: any[]) {
    this.detailsArray.clear();
    const editable = this.isEditable();
    details.forEach(d => {
      this.detailsArray.push(this.fb.group({
        id: [d.id],
        date: [d.date],
        day: [d.day],
        attendance_status: [{ value: d.attendance_status || (d.day === 'Sunday' ? 'Weekly Off' : 'Present'), disabled: !editable }],
        remarks: [{ value: d.remarks || '', disabled: !editable }]
      }));
    });
  }

  calculateSummary(details: any[]) {
    if (!details) return;

    const sum: any = {
      Present: 0, Absent: 0, 'Weekly Off': 0, Holiday: 0,
      CL: 0, EL: 0, SL: 0, 'Half Day': 0,
      'CL/2': 0, 'EL/2': 0, 'SL/2': 0,
      WFH: 0, OD: 0, LWP: 0, 'Paid Days': 0
    };

    details.forEach(d => {
      if (sum[d.attendance_status] !== undefined) {
        sum[d.attendance_status] += 1;
      }
    });

    const effectiveWeeklyOffs = sum.Present >= 6 ? sum['Weekly Off'] : 0;

    sum['Paid Days'] =
      sum.Present + effectiveWeeklyOffs + sum.Holiday +
      sum.CL + sum.EL + sum.SL + sum.WFH + sum.OD +
      ((sum['Half Day'] + sum['CL/2'] + sum['EL/2'] + sum['SL/2']) * 0.5);

    this.summary = sum;
  }

  saveDraft() {
    if (!this.currentRecord || !this.isEditable()) return;
    this.saving.set(true);

    const payload = this.attendanceForm.getRawValue().details;
    const filter = this.filterForm.value;

    this.monthlyService.saveDraft(
      this.currentRecord.id,
      payload,
      filter.month || this.currentRecord.month,
      filter.year || this.currentRecord.year,
      filter.employee_id || this.currentRecord.employee_id
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Draft saved successfully' });
          this.saving.set(false);
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to save draft' });
          this.saving.set(false);
        }
      });
  }

  submitAttendance() {
    if (!this.currentRecord || !this.isEditable()) return;

    this.confirmationService.confirm({
      message: "Are you sure you want to submit this month's attendance? After submission you cannot edit until HR reviews it.",
      header: 'Submit Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.submitting.set(true);
        const payload = this.attendanceForm.getRawValue().details;
        const filter = this.filterForm.value;
        this.monthlyService.saveDraft(
          this.currentRecord.id,
          payload,
          filter.month || this.currentRecord.month,
          filter.year || this.currentRecord.year,
          filter.employee_id || this.currentRecord.employee_id
        ).subscribe({
          next: () => {
            this.monthlyService.submitAttendance(this.currentRecord.id).subscribe({
              next: () => {
                this.messageService.add({ severity: 'success', summary: 'Submitted', detail: 'Attendance submitted to HR.' });
                this.submitting.set(false);
                this.loadAttendance();
              },
              error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to submit' });
                this.submitting.set(false);
              }
            });
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save before submitting' });
            this.submitting.set(false);
          }
        });
      }
    });
  }

  isWeekend(day: string): boolean {
    return day === 'Sunday';
  }

  applyBulkStatus(status: string) {
    if (!status || !this.isEditable()) return;
    this.detailsArray.controls.forEach(ctrl => {
      if (this.isWeekend(ctrl.get('day')?.value)) {
        ctrl.get('attendance_status')?.setValue('Weekly Off');
      } else {
        ctrl.get('attendance_status')?.setValue(status);
      }
    });
  }
}
