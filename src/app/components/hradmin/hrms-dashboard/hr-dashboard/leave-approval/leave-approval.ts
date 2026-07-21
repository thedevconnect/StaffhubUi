import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LeaveService } from '../../../../../shared/services/leave.service';
import { TableTemplate, TableColumn } from '../../../../../shared/ui/table-template/table-template';

export interface LeaveRequestUI {
  id: string | number;
  employeeName: string;
  employeeCode: string;
  role: string;
  department: string;
  type: string;
  session: string;
  duration: string;
  reason: string;
  status: string;
  appliedDate: string;
  raw: any;
}

@Component({
  selector: 'app-leave-approval',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DrawerModule,
    DialogModule,
    DatePickerModule,
    ButtonModule,
    ToastModule,
    BreadcrumbModule,
    ConfirmDialogModule,
    TableTemplate
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './leave-approval.html',
  styleUrl: './leave-approval.scss',
})
export class LeaveApproval implements OnInit {
  breadcrumbItems: any[] = [
    { label: 'HR Administration', icon: 'pi pi-home', routerLink: '/hradmin' },
    { label: 'Leave Approval Center', icon: 'pi pi-calendar', routerLink: '/hradmin/leave-approval' },
  ];
  isLoading = false;

  tableColumns: TableColumn[] = [
    { key: 'employeeName', header: 'Employee Details' },
    { key: 'type', header: 'Leave Category' },
    { key: 'duration', header: 'Duration & Dates' },
    { key: 'reason', header: 'Reason' },
    { key: 'status', header: 'Status' },
    { key: 'actions', header: 'Actions' }
  ];

  leaveRequests: LeaveRequestUI[] = [];
  selectedRequest: LeaveRequestUI | null = null;
  actionType: 'Approve' | 'Reject' | null = null;
  showConfirmModal = false;
  showDetailsDrawer = false;
  remarks = '';

  isDetailsDrawerFullScreen = false;

  toggleDetailsDrawerFullScreen(): void {
    this.isDetailsDrawerFullScreen = !this.isDetailsDrawerFullScreen;
  }

  leaveHistory: any[] = [];
  isLoadingHistory = false;

  activeTab: string = 'Pending';

  tabs = [
    { label: 'Pending', value: 'Pending', icon: 'pi pi-clock' },
    { label: 'Approved', value: 'Approved', icon: 'pi pi-check-circle' },
    { label: 'Rejected', value: 'Rejected', icon: 'pi pi-times-circle' },
    { label: 'Processed', value: 'Processed', icon: 'pi pi-history' },
    { label: 'All', value: 'All', icon: 'pi pi-list' }
  ];

  onTabChange(tab: string) {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  get filteredLeaveRequests(): LeaveRequestUI[] {
    return this.leaveRequests.filter(req => {
      const statusUpper = (req.status || '').toUpperCase();
      if (this.activeTab === 'All') return true;
      if (this.activeTab === 'Pending') {
        return statusUpper === 'PENDING';
      }
      if (this.activeTab === 'Approved') {
        return statusUpper === 'APPROVED' || statusUpper === 'APPROVE';
      }
      if (this.activeTab === 'Rejected') {
        return statusUpper === 'REJECTED' || statusUpper === 'REJECT';
      }
      if (this.activeTab === 'Processed') {
        return statusUpper !== 'PENDING';
      }
      return true;
    });
  }

  constructor(
    private messageService: MessageService,
    private leaveService: LeaveService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadLeaves();
  }

  loadLeaves(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.leaveService.getLeaves().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.leaveRequests = res.data.map((l: any) => {
            const startStr = l.start_date ? String(l.start_date).substring(0, 10) : '';
            const endStr = l.end_date ? String(l.end_date).substring(0, 10) : '';

            let diffDays = 1;
            if (startStr && endStr) {
              const start = new Date(startStr);
              const end = new Date(endStr);
              const diffTime = Math.abs(end.getTime() - start.getTime());
              diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            }

            return {
              id: l.id,
              employeeName: l.employee_name || 'Unknown',
              employeeCode: l.employee_code || '-',
              role: l.action_by_role || 'Employee',
              department: '-',
              type: l.leave_type,
              session: l.session || '-',
              duration: `${diffDays} day(s) ${l.session && l.session !== 'Full Day' ? '(' + l.session + ')' : ''}`,
              reason: l.reason || 'No reason provided',
              status: l.status ? l.status.charAt(0).toUpperCase() + l.status.slice(1).toLowerCase() : 'Pending',
              appliedDate: l.created_at ? String(l.created_at).substring(0, 10) : startStr,
              raw: l
            };
          });
        }
        this.isLoading = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load leave requests.'
        });
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    });
  }

  onRefresh(): void {
    this.loadLeaves();
    this.messageService.add({
      severity: 'success',
      summary: 'Synchronized',
      detail: 'Leave applications successfully synchronized.'
    });
  }

  get pendingCount() {
    return this.leaveRequests.filter(r => (r.status || '').toUpperCase() === 'PENDING').length;
  }

  get approvedCount() {
    return this.leaveRequests.filter(r => (r.status || '').toUpperCase() === 'APPROVED' || (r.status || '').toUpperCase() === 'APPROVE').length;
  }

  get rejectedCount() {
    return this.leaveRequests.filter(r => (r.status || '').toUpperCase() === 'REJECTED' || (r.status || '').toUpperCase() === 'REJECT').length;
  }

  get totalCount() {
    return this.leaveRequests.length;
  }

  triggerAction(request: LeaveRequestUI, type: 'Approve' | 'Reject') {
    this.selectedRequest = request;
    this.actionType = type;
    this.remarks = '';
    this.showConfirmModal = true;
    this.cdr.markForCheck();
  }

  confirmAction(confirm: boolean) {
    this.showConfirmModal = false;
    if (!confirm || !this.selectedRequest || !this.actionType) {
      this.selectedRequest = null;
      this.actionType = null;
      this.cdr.markForCheck();
      return;
    }

    const req = this.selectedRequest;
    const currentAction = this.actionType;
    const newStatus = currentAction === 'Approve' ? 'APPROVED' : 'REJECTED';

    const startStr = req.raw.start_date ? String(req.raw.start_date).substring(0, 10) : '';
    const endStr = req.raw.end_date ? String(req.raw.end_date).substring(0, 10) : '';

    this.leaveService.updateLeave(req.id, {
      leaveType: req.raw.leave_type,
      startDate: startStr,
      endDate: endStr,
      reason: req.raw.reason,
      status: newStatus,
      remarks: this.remarks
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          const isApprove = currentAction === 'Approve';
          this.messageService.add({
            severity: isApprove ? 'success' : 'warn',
            summary: isApprove ? 'Leave Approved' : 'Leave Rejected',
            detail: `Leave request for ${req.employeeName} has been ${isApprove ? 'approved' : 'rejected'} successfully.`
          });
          this.loadLeaves();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: res.message || 'Failed to update leave request.'
          });
        }
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update leave request.'
        });
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    });

    this.selectedRequest = null;
    this.actionType = null;
    this.showDetailsDrawer = false;
    this.cdr.markForCheck();
  }

  viewDetails(request: LeaveRequestUI) {
    this.selectedRequest = request;
    this.showDetailsDrawer = true;
    this.leaveHistory = [];
    this.isLoadingHistory = true;
    this.cdr.markForCheck();

    this.leaveService.getLeaveHistory(request.id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.leaveHistory = res.data || [];
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
}
