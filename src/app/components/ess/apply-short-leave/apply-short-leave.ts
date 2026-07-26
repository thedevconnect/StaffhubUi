import { ChangeDetectionStrategy, Component, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { Breadcrumb } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DrawerModule } from 'primeng/drawer';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';

import { ShortLeaveService, ShortLeaveRequest } from '../../../shared/services/short-leave.service';
import { AuthService } from '../../../shared/services/services/auth.service';
import { EmployeeManagementService } from '../../../shared/services/employee-management.service';
import { TableColumn, TableTemplate, TableAction } from '../../../shared/ui/table-template/table-template';

@Component({
  selector: 'app-apply-short-leave',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    Breadcrumb,
    ButtonModule,
    SelectModule,
    ToastModule,
    ConfirmDialogModule,
    DrawerModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    TagModule,
    TableTemplate
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './apply-short-leave.html',
  styleUrl: './apply-short-leave.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplyShortLeave implements OnInit {
  private shortLeaveService = inject(ShortLeaveService);
  private authService = inject(AuthService);
  private employeeService = inject(EmployeeManagementService);
  private cdr = inject(ChangeDetectorRef);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Apply Short Leave', icon: 'pi pi-clock', routerLink: '/ess/apply-short-leave' }
  ];

  shortLeaves: ShortLeaveRequest[] = [];
  isLoading: boolean = false;
  isHrAdmin: boolean = false;

  // Employee Dropdown Options for To Mail
  employeeMailOptions: { label: string; value: string }[] = [];

  // TableTemplate Props
  activeTab: string = 'All';
  searchQuery: string = '';
  pageNo: number = 1;
  pageSize: number = 10;

  tabs = [
    { label: 'All', value: 'All', icon: 'pi pi-list' },
    { label: 'Pending', value: 'PENDING', icon: 'pi pi-clock' },
    { label: 'Approved', value: 'APPROVED', icon: 'pi pi-check-circle' }
  ];

  columns: TableColumn[] = [
    { key: 'actions', header: 'Action' },
    { key: 'leaveDate', header: 'Date' },
    { key: 'session', header: 'Session' },
    { key: 'duration', header: 'Duration' },
    { key: 'reason', header: 'Reason' },
    { key: 'toMail', header: 'To Mail' },
    { key: 'status', header: 'Status' }
  ];

  rowActions: TableAction[] = [
    { label: 'View', icon: 'pi pi-eye', id: 'view' },
    { label: 'Edit', icon: 'pi pi-pencil', id: 'edit' },
    { label: 'Withdraw', icon: 'pi pi-undo', id: 'withdraw' },
    { label: 'Delete', icon: 'pi pi-trash', id: 'delete' }
  ];

  // Form State
  drawerVisible: boolean = false;
  isEditMode: boolean = false;
  editingId: number | null = null;

  formData = {
    leave_date: '',
    session: 'First Session',
    reason: '',
    to_mail: ''
  };

  sessionOptions = [
    { label: 'First Session (Morning - 2 Hours)', value: 'First Session' },
    { label: 'Second Session (Afternoon - 2 Hours)', value: 'Second Session' }
  ];

  // View Modal
  viewDialogVisible: boolean = false;
  selectedLeave: ShortLeaveRequest | null = null;

  ngOnInit(): void {
    const roleId = (this.authService.selectedRoleId() || localStorage.getItem('role') || '').toLowerCase();
    this.isHrAdmin = roleId.includes('hr') || roleId.includes('admin') || roleId.includes('superadmin');

    if (this.isHrAdmin) {
      this.columns = [
        { key: 'actions', header: 'Action' },
        { key: 'employeeName', header: 'Employee' },
        { key: 'leaveDate', header: 'Date' },
        { key: 'session', header: 'Session' },
        { key: 'duration', header: 'Duration' },
        { key: 'reason', header: 'Reason' },
        { key: 'toMail', header: 'To Mail' },
        { key: 'status', header: 'Status' }
      ];

      this.rowActions = [
        { label: 'View', icon: 'pi pi-eye', id: 'view' },
        { label: 'Approve', icon: 'pi pi-check', id: 'approve' },
        { label: 'Reject', icon: 'pi pi-times', id: 'reject' },
        { label: 'Edit', icon: 'pi pi-pencil', id: 'edit' },
        { label: 'Withdraw', icon: 'pi pi-undo', id: 'withdraw' },
        { label: 'Delete', icon: 'pi pi-trash', id: 'delete' }
      ];
    }
    this.loadEmployees();
    this.loadShortLeaves();
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (employees: any[]) => {
        if (Array.isArray(employees)) {
          this.employeeMailOptions = employees.map(emp => {
            const name = emp.full_name || emp.employee_name || 'Employee';
            const email = emp.email || emp.work_email || '';
            const code = emp.employee_code || emp.emp_id || '';
            const displayLabel = email
              ? `${name} (${email})`
              : `${name} [${code || 'No Email'}]`;
            const mailValue = email || `${name.toLowerCase().replace(/\s+/g, '')}@company.com`;
            return {
              label: displayLabel,
              value: mailValue
            };
          });
        }
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error fetching employees for mail dropdown:', err)
    });
  }

  loadShortLeaves(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.shortLeaveService.getShortLeaves().subscribe({
      next: (res) => {
        this.shortLeaves = res?.data || [];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get filteredShortLeaves(): ShortLeaveRequest[] {
    return this.shortLeaves.filter(req => {
      if (this.activeTab !== 'All') {
        return (req.status || '').toUpperCase() === this.activeTab.toUpperCase();
      }
      return true;
    });
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  disableAction = (actionId: string, row: ShortLeaveRequest): boolean => {
    const status = (row.status || '').toUpperCase();
    if (status !== 'PENDING') {
      if (['edit', 'delete', 'withdraw', 'approve', 'reject'].includes(actionId)) {
        return true;
      }
    }
    return false;
  };

  onActionClicked(event: { actionId: string; row: ShortLeaveRequest }): void {
    const { actionId, row } = event;
    if (actionId === 'view') this.openViewModal(row);
    else if (actionId === 'edit') this.openEditForm(row);
    else if (actionId === 'withdraw') this.confirmWithdraw(row);
    else if (actionId === 'delete') this.confirmDelete(row);
    else if (actionId === 'approve') this.approveLeave(row);
    else if (actionId === 'reject') this.rejectLeave(row);
  }

  openNewForm(): void {
    this.isEditMode = false;
    this.editingId = null;
    this.formData = {
      leave_date: new Date().toISOString().split('T')[0],
      session: 'First Session',
      reason: '',
      to_mail: this.employeeMailOptions[0]?.value || ''
    };
    this.drawerVisible = true;
    this.cdr.markForCheck();
  }

  openEditForm(leave: ShortLeaveRequest): void {
    if ((leave.status || '').toUpperCase() !== 'PENDING') return;

    this.isEditMode = true;
    this.editingId = leave.id;
    const rawDate = leave.leave_date || leave.date || leave.from_date || '';
    this.formData = {
      leave_date: rawDate ? String(rawDate).split('T')[0] : '',
      session: leave.session || 'First Session',
      reason: leave.reason || '',
      to_mail: leave.to_mail || ''
    };
    this.drawerVisible = true;
    this.cdr.markForCheck();
  }

  openViewModal(leave: ShortLeaveRequest): void {
    this.selectedLeave = leave;
    this.viewDialogVisible = true;
    this.cdr.markForCheck();
  }

  saveShortLeave(): void {
    if (!this.formData.leave_date || !this.formData.session || !this.formData.reason) {
      this.messageService.add({ severity: 'warn', summary: 'Required', detail: 'Please fill Date, Session, and Reason.' });
      return;
    }

    const payload = {
      leave_date: this.formData.leave_date,
      session: this.formData.session,
      reason: this.formData.reason,
      to_mail: this.formData.to_mail
    };

    const action = this.isEditMode && this.editingId
      ? this.shortLeaveService.updateShortLeave(this.editingId, payload)
      : this.shortLeaveService.createShortLeave(payload);

    action.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Short leave request submitted.' });
        this.drawerVisible = false;
        this.loadShortLeaves();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Operation failed.' });
      }
    });
  }

  confirmDelete(leave: ShortLeaveRequest): void {
    this.confirmationService.confirm({
      message: 'Delete this short leave request?',
      header: 'Confirm Delete',
      icon: 'pi pi-trash',
      accept: () => {
        this.shortLeaveService.deleteShortLeave(leave.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Request deleted.' });
            this.loadShortLeaves();
          }
        });
      }
    });
  }

  confirmWithdraw(leave: ShortLeaveRequest): void {
    this.confirmationService.confirm({
      message: 'Withdraw this short leave request?',
      header: 'Confirm Withdraw',
      icon: 'pi pi-undo',
      accept: () => {
        this.shortLeaveService.withdrawShortLeave(leave.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'info', summary: 'Withdrawn', detail: 'Request withdrawn.' });
            this.loadShortLeaves();
          }
        });
      }
    });
  }

  approveLeave(leave: ShortLeaveRequest): void {
    this.confirmationService.confirm({
      message: `Approve 2-hour short leave for ${leave.employee_name || 'Employee'}? If 7 hours are completed, attendance will automatically adjust to 9 hours.`,
      header: 'Approve Short Leave',
      icon: 'pi pi-check-circle',
      accept: () => {
        this.shortLeaveService.updateStatus(leave.id, 'APPROVED', 'Approved by HR/Admin').subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Approved', detail: 'Approved. Attendance updated to 9 hours if 7 hours done.' });
            this.loadShortLeaves();
          }
        });
      }
    });
  }

  rejectLeave(leave: ShortLeaveRequest): void {
    this.confirmationService.confirm({
      message: 'Reject this short leave request?',
      header: 'Reject Request',
      icon: 'pi pi-times-circle',
      accept: () => {
        this.shortLeaveService.updateStatus(leave.id, 'REJECTED', 'Rejected by HR/Admin').subscribe({
          next: () => {
            this.messageService.add({ severity: 'warn', summary: 'Rejected', detail: 'Request rejected.' });
            this.loadShortLeaves();
          }
        });
      }
    });
  }

  getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    switch ((status || '').toUpperCase()) {
      case 'APPROVED': return 'success';
      case 'PENDING': return 'warn';
      case 'REJECTED': return 'danger';
      case 'WITHDRAWN': return 'secondary';
      default: return 'info';
    }
  }

  onRefresh(): void { this.loadShortLeaves(); }
  onPageChange(page: number): void { this.pageNo = page; }
  onSearchChange(text: string): void { this.searchQuery = text; }
  onPageSizeChange(size: number): void { this.pageSize = size; }
}
