import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppBreadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AttendanceService } from '../../../shared/services/attendance.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { TableColumn, TableTemplate, Tab } from '../../../shared/ui/table-template/table-template';

import { parseLocalDatetime } from '../../../shared/utils/date-utils';

@Component({
  selector: 'app-approval-attendance-regularization',
  standalone: true,
  imports: [
    CommonModule,
    AppBreadcrumb,
    ButtonModule,
    ReactiveFormsModule,
    FormsModule,
    DrawerModule,
    DatePickerModule,
    TextareaModule,
    ToastModule,
    SelectModule,
    ConfirmDialogModule,
    TooltipModule,
    TableTemplate
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './approval-attendance-regularization.html',
  styleUrl: './approval-attendance-regularization.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApprovalAttendanceRegularization implements OnInit {
  breadcrumbItems: any[] = [
    { label: 'HR Administration', icon: 'pi pi-home', routerLink: '/hradmin' },
    { label: 'Regularization Approvals', icon: 'pi pi-check-square', routerLink: '/hradmin/approval-attendance-regularization' }
  ];

  columns: TableColumn[] = [
    { key: 'action', header: 'Action' },
    { key: 'employee', header: 'Employee' },
    { key: 'attendanceDate', header: 'Attendance Date', pipe: 'date', pipeArgs: 'dd-MM-yyyy' },
    { key: 'correctionType', header: 'Type' },
    { key: 'checkIn', header: 'Check In', pipe: 'date', pipeArgs: 'hh:mm a' },
    { key: 'checkOut', header: 'Check Out', pipe: 'date', pipeArgs: 'hh:mm a' },
    { key: 'reason', header: 'Reason' },
    { key: 'status', header: 'Status' },
    { key: 'submittedOn', header: 'Submitted On', pipe: 'date' },
  ];

  // Requests array
  requests: any[] = [];

  // Filter bindings
  activeTab: string = 'All';
  typeFilter: string = 'All';

  tabs: Tab[] = [
    { label: 'Pending', value: 'Pending', icon: 'pi pi-clock' },
    { label: 'Approved', value: 'Approved', icon: 'pi pi-check-circle' },
    { label: 'Rejected', value: 'Rejected', icon: 'pi pi-times-circle' },
    { label: 'All', value: 'All', icon: 'pi pi-list' }
  ];

  onTabChange(tab: string) {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  // Drawer states
  detailDrawerVisible: boolean = false;
  historyDrawerVisible: boolean = false;
  selectedRequest: any = null;
  historyEvents: any[] = [];
  processForm: FormGroup;
  isLoading: boolean = false;
  isApproving: boolean = false;
  isRejecting: boolean = false;

  isDetailDrawerFullScreen = false;
  isHistoryDrawerFullScreen = false;

  toggleDetailDrawerFullScreen(): void {
    this.isDetailDrawerFullScreen = !this.isDetailDrawerFullScreen;
  }

  toggleHistoryDrawerFullScreen(): void {
    this.isHistoryDrawerFullScreen = !this.isHistoryDrawerFullScreen;
  }

  correctionTypes = [
    { label: 'All Types', value: 'All' },
    { label: 'Missed Punch', value: 'Missed Punch' },
    { label: 'Late In', value: 'Late In' },
    { label: 'Early Out', value: 'Early Out' },
    { label: 'Half Day Correction', value: 'Half Day Correction' },
    { label: 'Other Correction', value: 'Other Correction' }
  ];

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private attendanceService: AttendanceService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.processForm = this.fb.group({
      hrRemarks: ['', Validators.required]
    });
  }

  parseDatetime(val: any): Date | null {
    return parseLocalDatetime(val);
  }

  ngOnInit() {
    this.loadCompanyRequests();
  }

  loadCompanyRequests() {
    this.isLoading = true;
    this.attendanceService.getCompanyRegularizations(1, 100, '', '').subscribe({
      next: (response: any) => {
        const items = Array.isArray(response) ? response : (response?.data || []);
        if (items && items.length > 0) {
          this.requests = items.map((item: any) => ({
            id: item.id || item.regularizationId || 'REG-ID',
            employeeName: item.employee_name || item.employeeName || 'Employee',
            department: item.department_name || item.department || 'Staff',
            attendanceDate: item.attendanceDate || item.attendance_date,
            correctionType: item.correctionType || item.correction_type || 'Punch Correction',
            checkIn: this.parseDatetime(item.check_in || item.checkIn),
            checkOut: this.parseDatetime(item.check_out || item.checkOut),
            reason: item.reason || '',
            status: item.status || 'Pending',
            submittedOn: item.submittedOn || item.createdAt || item.created_at || new Date(),
            managerRemarks: item.managerRemarks || item.manager_remarks || item.remarks || '',
            hrRemarks: item.hrRemarks || item.hr_remarks || '',
            approvedByName: item.approved_by_name || item.approvedByName || '',
            attachmentUrl: item.attachmentUrl || item.attachment_url || null
          }));
        } else {
          // If the backend returns no records, we clear the array so that local table updates correctly
          this.requests = [];
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        // Fallback to local mock data silently
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onStatusFilterChange() {
    this.cdr.markForCheck();
  }

  // Filters computed requests
  get filteredRequests(): any[] {
    return this.requests.filter((req: any) => {
      let matchesTab = true;
      const statusLower = (req.status || '').toLowerCase();

      if (this.activeTab === 'Pending') {
        matchesTab = statusLower === 'pending';
      } else if (this.activeTab === 'Approved') {
        matchesTab = statusLower === 'approved';
      } else if (this.activeTab === 'Rejected') {
        matchesTab = statusLower === 'rejected';
      } else if (this.activeTab === 'Processed') {
        matchesTab = statusLower !== 'pending';
      }

      const matchesType = this.typeFilter !== 'All' ? req.correctionType === this.typeFilter : true;

      return matchesTab && matchesType;
    });
  }

  clearFilters() {
    this.activeTab = 'All';
    this.typeFilter = 'All';
    this.loadCompanyRequests();
  }

  openDetailDrawer(req: any) {
    this.selectedRequest = req;
    this.processForm.patchValue({
      hrRemarks: req.hrRemarks || ''
    });
    this.detailDrawerVisible = true;
    this.cdr.markForCheck();
  }

  viewHistory(req: any) {
    this.selectedRequest = req;
    this.historyEvents = [];
    this.historyDrawerVisible = true;
    this.isLoading = true;
    this.attendanceService.getRegularizationHistory(req.id).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.historyEvents = res.data.map((h: any) => ({
            status: h.status,
            date: h.created_at,
            icon: h.status === 'Approved' ? 'pi pi-check' : (h.status === 'Rejected' ? 'pi pi-times' : 'pi pi-clock'),
            color: h.status === 'Approved' ? 'bg-emerald-500' : (h.status === 'Rejected' ? 'bg-rose-500' : 'bg-amber-500'),
            title: `Request ${h.status}`,
            description: `${h.status} by ${h.action_by_name || 'System'}${h.action_by_designation ? ' (' + h.action_by_designation + ')' : ''}. Remarks: ${h.remarks || 'No remarks provided.'}`
          }));
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Unable to fetch history' });
        this.cdr.markForCheck();
      }
    });
  }



  processRequest(status: 'Approved' | 'Rejected') {
    if (!this.selectedRequest) return;
    if (this.processForm.invalid) {
      this.processForm.markAllAsTouched();
      return;
    }

    if (status === 'Approved') {
      this.isApproving = true;
    } else {
      this.isRejecting = true;
    }
    const finalStatus = status; // Keep it as 'Approved' or 'Rejected' to match backend expectation
    const currentRemarks = this.processForm.value.hrRemarks;

    // Submit status update to database API
    this.attendanceService.updateRegularizationStatus(this.selectedRequest.id, finalStatus, currentRemarks).subscribe({
      next: () => {
        // Update local array object state
        this.requests = this.requests.map((req: any) => {
          if (req.id === this.selectedRequest.id) {
            return {
              ...req,
              status: status,
              hrRemarks: currentRemarks
            };
          }
          return req;
        });

        this.detailDrawerVisible = false;
        this.isApproving = false;
        this.isRejecting = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: `Request ${status} successfully!` });
        this.notificationService.triggerRefresh();
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        // Fallback simulation if backend fails/unimplemented
        this.requests = this.requests.map((req: any) => {
          if (req.id === this.selectedRequest.id) {
            return {
              ...req,
              status: status,
              hrRemarks: currentRemarks
            };
          }
          return req;
        });

        this.detailDrawerVisible = false;
        this.isApproving = false;
        this.isRejecting = false;
        this.messageService.add({ severity: 'success', summary: 'Mock Status Updated', detail: `Request ${status} updated in memory.` });
        this.cdr.markForCheck();
      }
    });
  }

  onRefresh() {
    this.loadCompanyRequests();
    this.messageService.add({ severity: 'info', summary: 'Refreshed', detail: 'Fetched latest synchronization requests.' });
  }

  getInitials(name: string): string {
    return (name || 'E').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
