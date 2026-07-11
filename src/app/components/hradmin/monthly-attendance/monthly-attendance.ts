import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { MonthlyAttendanceService } from '../../../shared/services/monthly-attendance.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppBreadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TableTemplate, TableColumn } from '../../../shared/ui/table-template/table-template';
import { DrawerModule } from 'primeng/drawer';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-hr-monthly-attendance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    SelectModule,
    ToastModule,
    AppBreadcrumb,
    ConfirmDialogModule,
    DialogModule,
    TableTemplate,
    DrawerModule,
    TextareaModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
  templateUrl: './monthly-attendance.html'
})
export class MonthlyAttendance implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private monthlyService = inject(MonthlyAttendanceService);
  private messageService = inject(MessageService);
  private datePipe = inject(DatePipe);

  breadcrumbItems = [
    { label: 'HR Administration', icon: 'pi pi-home', routerLink: '/hradmin' },
    { label: 'Monthly Final Attendance', icon: 'pi pi-calendar-times' },
  ];

  months = [
    { label: 'All', value: null },
    { label: 'January', value: 1 }, { label: 'February', value: 2 },
    { label: 'March', value: 3 }, { label: 'April', value: 4 },
    { label: 'May', value: 5 }, { label: 'June', value: 6 },
    { label: 'July', value: 7 }, { label: 'August', value: 8 },
    { label: 'September', value: 9 }, { label: 'October', value: 10 },
    { label: 'November', value: 11 }, { label: 'December', value: 12 },
  ];

  statusOptions = [
    { label: 'All', value: null },
    { label: 'Pending', value: 'Pending' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' },
  ];

  filterForm = inject(FormBuilder).group({
    month: [null],
    year: [null],
    status: [null]
  });

  columns: TableColumn[] = [
    { key: 'employee_name', header: 'Employee', isSortable: true },
    { key: 'department_name', header: 'Department', isSortable: true },
    { 
      key: 'month_year', 
      header: 'Month', 
      isCustom: true, 
      isSortable: false 
    },
    { 
      key: 'updated_at', 
      header: 'Submitted On', 
      isCustom: true, 
      isSortable: true 
    },
    { key: 'status', header: 'Status', isSortable: true }
  ];

  tableActions = [
    { id: 'view', label: 'View', icon: 'pi pi-eye', tooltip: 'Review Details', action: 'view', severity: 'secondary' as any }
  ];

  records = signal<any[]>([]);
  loading = signal(false);

  viewVisible = false;
  selectedRecord: any = null;
  selectedSummary: any = null;

  rejectVisible = false;
  hrRemarks = '';
  actionLoading = false;

  ngOnInit(): void {
    this.loadData();
    this.filterForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadData();
    });
  }

  loadData() {
    this.loading.set(true);
    this.monthlyService.getPendingList(this.filterForm.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            // Enhance data for table display
            const data = res.data.map((r: any) => {
              const monthName = this.months.find(m => m.value === r.month)?.label || r.month;
              return {
                ...r,
                month_year: `${monthName} ${r.year}`,
                badge_status: r.status,
                badge_severity: this.getSeverity(r.status)
              };
            });
            this.records.set(data);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load records' });
          this.loading.set(false);
        }
      });
  }

  getSeverity(status: string) {
    switch(status) {
      case 'Approved': return 'success';
      case 'Rejected': return 'danger';
      case 'Pending': return 'warning';
      default: return 'info';
    }
  }

  handleAction(event: any) {
    if (event.action === 'view') {
      this.openViewDrawer(event.row);
    }
  }

  openViewDrawer(record: any) {
    this.actionLoading = true;
    this.monthlyService.getMonthlyAttendanceById(record.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.selectedRecord = res.data;
            this.selectedSummary = res.data.summary;
            this.viewVisible = true;
          }
          this.actionLoading = false;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch details' });
          this.actionLoading = false;
        }
      });
  }

  approve() {
    this.actionLoading = true;
    this.monthlyService.approveAttendance(this.selectedRecord.header.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Approved', detail: 'Attendance approved successfully' });
          this.actionLoading = false;
          this.viewVisible = false;
          this.loadData();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Approval failed' });
          this.actionLoading = false;
        }
      });
  }

  openRejectDialog() {
    this.hrRemarks = '';
    this.rejectVisible = true;
  }

  confirmReject() {
    if (!this.hrRemarks.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Required', detail: 'Please enter rejection remarks' });
      return;
    }

    this.actionLoading = true;
    this.monthlyService.rejectAttendance(this.selectedRecord.header.id, this.hrRemarks)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Rejected', detail: 'Attendance rejected successfully' });
          this.actionLoading = false;
          this.rejectVisible = false;
          this.viewVisible = false;
          this.loadData();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Rejection failed' });
          this.actionLoading = false;
        }
      });
  }

  isWeekend(day: string): boolean {
    return day === 'Sunday';
  }
}
