import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LeaveService } from '../../../shared/services/leave.service';

@Component({
  selector: 'app-employee-leave-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DrawerModule,
    DialogModule,
    ButtonModule,
    ToastModule,
    BreadcrumbModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './employee-leave-management.html',
  styleUrl: './employee-leave-management.scss'
})
export class EmployeeLeaveManagement implements OnInit {
  breadcrumbItems: any[] = [
    { label: 'HR Administration', icon: 'pi pi-home', routerLink: '/hradmin' },
    { label: 'Employee Leave Management', icon: 'pi pi-users', routerLink: '/hradmin/employee-leave-management' }
  ];

  isLoading = false;
  companyLeaveSummaries: any[] = [];
  searchText = '';

  // Edit Drawer state
  showEditDrawer = false;
  selectedEmp: any = null;
  editForm = {
    earnedLeave: 0,
    casualLeave: 0,
    sickLeave: 0,
    parentalLeave: 5,
    lossOfPay: 0,
    reason: ''
  };

  // History Drawer state
  showHistoryDrawer = false;
  historyLogs: any[] = [];
  isLoadingHistory = false;

  constructor(
    private leaveService: LeaveService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSummaries();
  }

  loadSummaries(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.leaveService.getCompanyLeaveSummary().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.companyLeaveSummaries = res.data;
        }
        this.isLoading = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load employee leave balances' });
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    });
  }

  get filteredSummaries(): any[] {
    if (!this.searchText) return this.companyLeaveSummaries;
    const search = this.searchText.toLowerCase();
    return this.companyLeaveSummaries.filter(emp =>
      (emp.employeeName || '').toLowerCase().includes(search) ||
      (emp.employeeCode || '').toLowerCase().includes(search) ||
      (emp.designation || '').toLowerCase().includes(search)
    );
  }

  openEditDrawer(emp: any): void {
    this.selectedEmp = emp;
    this.editForm = {
      earnedLeave: emp.summary?.earnedLeave?.credited || 0,
      casualLeave: emp.summary?.casualLeave?.credited || 0,
      sickLeave: emp.summary?.sickLeave?.credited || 0,
      parentalLeave: emp.summary?.parentalLeave?.credited !== undefined ? emp.summary?.parentalLeave?.credited : 5,
      lossOfPay: emp.summary?.lossOfPay?.credited || 0,
      reason: ''
    };
    this.showEditDrawer = true;
    this.cdr.markForCheck();
  }

  submitBalanceUpdate(): void {
    if (!this.selectedEmp) return;

    this.confirmationService.confirm({
      message: `Are you sure you want to update leave balances for ${this.selectedEmp.employeeName}?`,
      header: 'Confirm Leave Balance Update',
      icon: 'pi pi-pencil',
      accept: () => {
        this.isLoading = true;
        const payload = {
          employeeId: this.selectedEmp.employeeId,
          earnedLeave: parseFloat(this.editForm.earnedLeave as any) || 0,
          casualLeave: parseFloat(this.editForm.casualLeave as any) || 0,
          sickLeave: parseFloat(this.editForm.sickLeave as any) || 0,
          parentalLeave: parseFloat(this.editForm.parentalLeave as any) || 0,
          lossOfPay: parseFloat(this.editForm.lossOfPay as any) || 0,
          reason: this.editForm.reason || 'Manual balance update by HR'
        };

        this.leaveService.adjustLeaveBalance(payload).subscribe({
          next: (res: any) => {
            this.isLoading = false;
            this.showEditDrawer = false;
            this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Leave balances updated successfully!' });
            this.loadSummaries();
            this.cdr.markForCheck();
          },
          error: (err: any) => {
            this.isLoading = false;
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update leave balance.' });
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  openHistoryDrawer(emp: any): void {
    this.selectedEmp = emp;
    this.showHistoryDrawer = true;
    this.historyLogs = [];
    this.isLoadingHistory = true;
    this.cdr.markForCheck();

    this.leaveService.getLeaveBalanceHistory(emp.employeeId).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.historyLogs = res.data || [];
        }
        this.isLoadingHistory = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingHistory = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    });
  }

  onRunMonthlyCredit(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to trigger the monthly auto-credit (+1.0 EL & +0.5 CL per employee)?',
      header: 'Trigger Monthly Auto-Credit',
      icon: 'pi pi-bolt',
      accept: () => {
        this.isLoading = true;
        this.leaveService.triggerMonthlyCredit().subscribe({
          next: (res: any) => {
            this.isLoading = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Credit Processed',
              detail: res.message || '1.0 EL & 0.5 CL credited successfully for all active employees!'
            });
            this.loadSummaries();
            this.cdr.markForCheck();
          },
          error: () => {
            this.isLoading = false;
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to credit monthly leaves' });
            this.cdr.markForCheck();
          }
        });
      }
    });
  }
}
