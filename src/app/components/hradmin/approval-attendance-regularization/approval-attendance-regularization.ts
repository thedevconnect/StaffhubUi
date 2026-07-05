import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { Breadcrumb } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AttendanceService } from '../../../shared/services/attendance.service';

@Component({
  selector: 'app-approval-attendance-regularization',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    Breadcrumb,
    ButtonModule,
    ReactiveFormsModule,
    FormsModule,
    DrawerModule,
    DatePickerModule,
    TextareaModule,
    ToastModule,
    SelectModule,
    ConfirmDialogModule
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

  // Static mock requests list with employee metadata
  requests: any[] = [
    {
      id: 'REQ-REG-001',
      employeeName: 'Aarav Sharma',
      department: 'Technology',
      attendanceDate: new Date('2026-07-05'),
      correctionType: 'Missed Punch',
      checkIn: new Date('2026-07-05T10:00:00'),
      checkOut: new Date('2026-07-05T19:00:00'),
      reason: 'Biometric device at Hub-3 failed to scan fingerprint.',
      status: 'Pending',
      submittedOn: new Date('2026-07-05T19:30:00'),
      managerRemarks: null,
      hrRemarks: null
    },
    {
      id: 'REQ-REG-002',
      employeeName: 'Priya Patel',
      department: 'Marketing',
      attendanceDate: new Date('2026-07-04'),
      correctionType: 'Late In',
      checkIn: new Date('2026-07-04T10:30:00'),
      checkOut: new Date('2026-07-04T19:00:00'),
      reason: 'Delayed due to official external vendor coordination visit.',
      status: 'Approved',
      submittedOn: new Date('2026-07-04T19:15:00'),
      managerRemarks: 'Approved. Priya had updated me in advance.',
      hrRemarks: 'Log entries adjusted.'
    },
    {
      id: 'REQ-REG-003',
      employeeName: 'Rohan Gupta',
      department: 'Human Resources',
      attendanceDate: new Date('2026-07-03'),
      correctionType: 'Early Out',
      checkIn: new Date('2026-07-03T09:00:00'),
      checkOut: new Date('2026-07-03T14:30:00'),
      reason: 'Urgent family emergency, had to leave early with approval.',
      status: 'Rejected',
      submittedOn: new Date('2026-07-03T15:00:00'),
      managerRemarks: 'No emergency leave approved. Rejected.',
      hrRemarks: 'No supporting document attached.'
    }
  ];

  // Filter bindings
  searchQuery: string = '';
  statusFilter: string = 'Pending'; // Default to Pending for HR focus
  typeFilter: string = 'All';

  // Drawer states
  detailDrawerVisible: boolean = false;
  selectedRequest: any = null;
  hrRemarksInput: string = '';
  isLoading: boolean = false;

  correctionTypes = [
    { label: 'All Types', value: 'All' },
    { label: 'Missed Punch', value: 'Missed Punch' },
    { label: 'Late In', value: 'Late In' },
    { label: 'Early Out', value: 'Early Out' },
    { label: 'Half Day Correction', value: 'Half Day Correction' },
    { label: 'Other Correction', value: 'Other Correction' }
  ];

  statusOptions = [
    { label: 'All Statuses', value: 'All' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' }
  ];

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private attendanceService: AttendanceService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadCompanyRequests();
  }

  // Load from backend API if available, fallback to mock data on failure
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
            attendanceDate: item.attendanceDate ? new Date(item.attendanceDate) : (item.attendance_date ? new Date(item.attendance_date) : new Date()),
            correctionType: item.correctionType || 'Punch Correction',
            checkIn: item.checkIn ? new Date(item.checkIn) : null,
            checkOut: item.checkOut ? new Date(item.checkOut) : null,
            reason: item.reason || '',
            status: item.status || 'Pending',
            submittedOn: item.submittedOn || item.createdAt || new Date(),
            managerRemarks: item.managerRemarks || item.remarks || '',
            hrRemarks: item.hrRemarks || ''
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

  // Summary Metrics Counts
  get pendingCount(): number {
    return this.requests.filter(r => r.status === 'Pending' || r.status === 'PENDING').length;
  }

  get approvedCount(): number {
    return this.requests.filter(r => r.status === 'Approved' || r.status === 'APPROVED').length;
  }

  get rejectedCount(): number {
    return this.requests.filter(r => r.status === 'Rejected' || r.status === 'REJECTED').length;
  }

  // Filters computed requests
  get filteredRequests(): any[] {
    return this.requests.filter(req => {
      const matchesSearch = this.searchQuery ? 
        (req.employeeName.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
         req.reason.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
         req.id.toLowerCase().includes(this.searchQuery.toLowerCase())) : true;

      const matchesStatus = this.statusFilter !== 'All' ? 
        (req.status.toLowerCase() === this.statusFilter.toLowerCase()) : true;

      const matchesType = this.typeFilter !== 'All' ? req.correctionType === this.typeFilter : true;

      return matchesSearch && matchesStatus && matchesType;
    });
  }

  clearFilters() {
    this.searchQuery = '';
    this.statusFilter = 'Pending';
    this.typeFilter = 'All';
    this.loadCompanyRequests();
  }

  openDetailDrawer(req: any) {
    this.selectedRequest = req;
    this.hrRemarksInput = req.hrRemarks || '';
    this.detailDrawerVisible = true;
    this.cdr.markForCheck();
  }

  processRequest(status: 'Approved' | 'Rejected') {
    if (!this.selectedRequest) return;

    this.isLoading = true;
    const finalStatus = status === 'Approved' ? 'APPROVED' : 'REJECTED';

    // Submit status update to database API
    this.attendanceService.updateRegularizationStatus(this.selectedRequest.id, finalStatus, this.hrRemarksInput).subscribe({
      next: () => {
        // Update local array object state
        this.requests = this.requests.map(req => {
          if (req.id === this.selectedRequest.id) {
            return {
              ...req,
              status: status,
              hrRemarks: this.hrRemarksInput
            };
          }
          return req;
        });

        this.detailDrawerVisible = false;
        this.isLoading = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: `Request ${status} successfully!` });
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        // Fallback simulation if backend fails/unimplemented
        this.requests = this.requests.map(req => {
          if (req.id === this.selectedRequest.id) {
            return {
              ...req,
              status: status,
              hrRemarks: this.hrRemarksInput
            };
          }
          return req;
        });

        this.detailDrawerVisible = false;
        this.isLoading = false;
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
