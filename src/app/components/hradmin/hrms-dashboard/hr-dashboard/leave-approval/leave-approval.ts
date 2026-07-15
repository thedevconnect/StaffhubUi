import { Component, OnInit } from '@angular/core';
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
  
  activeTab: string = 'All';
  
  tabs = [
    { label: 'Pending', value: 'Pending', icon: 'pi pi-clock' },
    { label: 'Processed', value: 'Processed', icon: 'pi pi-check-circle' },
    { label: 'All', value: 'All', icon: 'pi pi-list' }
  ];

  onTabChange(tab: string) {
    this.activeTab = tab;
  }
  
  get filteredLeaveRequests(): LeaveRequestUI[] {
    return this.leaveRequests.filter(req => {
      if (this.activeTab === 'All') return true;
      if (this.activeTab === 'Pending') {
        return req.status === 'Pending' || req.status === 'PENDING';
      } else {
        return req.status !== 'Pending' && req.status !== 'PENDING';
      }
    });
  }

  constructor(
    private messageService: MessageService,
    private leaveService: LeaveService
  ) { }

  ngOnInit(): void {
    this.loadLeaves();
  }

  loadLeaves(): void {
    this.isLoading = true;
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
              role: l.action_by_role || 'Employee', // default as we don't have it in API response
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
      },
      error: (err: any) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load leave requests.'
        });
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
    return this.leaveRequests.filter(r => r.status === 'Pending').length;
  }

  get approvedCount() {
    return this.leaveRequests.filter(r => r.status === 'Approved').length;
  }

  get rejectedCount() {
    return this.leaveRequests.filter(r => r.status === 'Rejected').length;
  }

  get totalCount() {
    return this.leaveRequests.length;
  }

  triggerAction(request: LeaveRequestUI, type: 'Approve' | 'Reject') {
    this.selectedRequest = request;
    this.actionType = type;
    this.showConfirmModal = true;
  }

  confirmAction(confirm: boolean) {
    this.showConfirmModal = false;
    if (!confirm || !this.selectedRequest || !this.actionType) {
      this.selectedRequest = null;
      this.actionType = null;
      return;
    }

    const req = this.selectedRequest;
    const newStatus = this.actionType === 'Approve' ? 'APPROVED' : 'REJECTED';

    // Fallback formatting for dates in case they aren't parsed nicely
    const startStr = req.raw.start_date ? String(req.raw.start_date).substring(0, 10) : '';
    const endStr = req.raw.end_date ? String(req.raw.end_date).substring(0, 10) : '';

    this.leaveService.updateLeave(req.id, {
      leaveType: req.raw.leave_type,
      startDate: startStr,
      endDate: endStr,
      reason: req.raw.reason,
      status: newStatus
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.messageService.add({
            severity: this.actionType === 'Approve' ? 'success' : 'error',
            summary: this.actionType === 'Approve' ? 'Leave Approved' : 'Leave Rejected',
            detail: `Leave request for ${req.employeeName} has been ${this.actionType === 'Approve' ? 'approved' : 'rejected'} successfully.`
          });
          this.loadLeaves(); // Reload to get fresh data
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: res.message || 'Failed to update leave request.'
          });
        }
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update leave request.'
        });
      }
    });

    this.selectedRequest = null;
    this.actionType = null;
    this.showDetailsDrawer = false;
  }

  viewDetails(request: LeaveRequestUI) {
    this.selectedRequest = request;
    this.showDetailsDrawer = true;
  }
}
