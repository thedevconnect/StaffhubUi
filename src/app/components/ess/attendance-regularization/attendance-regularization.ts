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
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AttendanceService } from '../../../shared/services/attendance.service';
import { TableColumn, TableTemplate } from '../../../shared/ui/table-template/table-template';

@Component({
  selector: 'app-attendance-regularization',
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
    ConfirmDialogModule,
    TooltipModule,
    TableTemplate
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './attendance-regularization.html',
  styleUrl: './attendance-regularization.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceRegularization implements OnInit {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Attendance Regularization', icon: 'pi pi-calendar-plus', routerLink: '/ess/attendance-regularization' }
  ];

  isFullScreen: boolean = false;
  requests: any[] = [];
  // Filter bindings
  searchQuery: string = '';
  statusFilter: string = 'All';
  monthFilter: string = 'All';

  // Modal / Drawer variables
  drawerVisible: boolean = false;
  viewDrawerVisible: boolean = false;
  historyDrawerVisible: boolean = false;
  drawerType: string = 'add'; // 'add' or 'edit'
  selectedRequest: any = null;
  historyEvents: any[] = [];
  isLoading: boolean = false;

  //   {
  //     "success": true,
  //     "message": "My requests fetched successfully",
  //     "data": [
  //         {
  //             "id": 5,
  //             "employeeId": 54,
  //             "attendanceDate": "2026-07-05T18:30:00.000Z",
  //             "correctionType": "Missed Punch",
  //             "checkIn": "2026-07-06T23:00:00.000Z",
  //             "checkOut": "2026-07-07T08:00:00.000Z",
  //             "reason": "test teste ttest",
  //             "status": "Pending",
  //             "submittedOn": "2026-07-07T06:21:43.000Z",
  //             "createdAt": "2026-07-07T06:21:43.000Z",
  //             "managerRemarks": null,
  //             "hrRemarks": null,
  //             "attachmentUrl": null,
  //             "approvedBy": null,
  //             "approvedByName": null
  //         }
  //     ]
  // }

  columns: TableColumn[] = [

    { key: 'actions', header: 'Action' },
    { key: 'attendanceDate', header: 'Attendance Date' },
    { key: 'correctionType', header: 'Correction Type' },
    { key: 'checkIn', header: 'Check In' },
    { key: 'checkOut', header: 'Check Out' },
    { key: 'reason', header: 'Reason' },
    { key: 'status', header: 'Status' },
    { key: 'managerRemarks', header: 'managerRemarks' },
    { key: 'approvedBy', header: 'approvedBy' },

    { key: 'submittedOn', header: 'Submitted On' },
  ];

  rowActions = [
    { label: 'View', icon: 'pi pi-eye', id: 'view' },
    { label: 'Edit', icon: 'pi pi-pencil', id: 'edit' },
    { label: 'History', icon: 'pi pi-history', id: 'history' },
    { label: 'Delete', icon: 'pi pi-trash', id: 'delete' }
  ];

  pageSize = 10;
  totalCount = 0;
  pageNo = 1;

  regForm!: FormGroup;
  selectedFileName: string = '';

  // Select Options
  correctionTypes = [
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

  monthOptions = [
    { label: 'All Months', value: 'All' },
    { label: 'January', value: '1' },
    { label: 'February', value: '2' },
    { label: 'March', value: '3' },
    { label: 'April', value: '4' },
    { label: 'May', value: '5' },
    { label: 'June', value: '6' },
    { label: 'July', value: '7' },
    { label: 'August', value: '8' },
    { label: 'September', value: '9' },
    { label: 'October', value: '10' },
    { label: 'November', value: '11' },
    { label: 'December', value: '12' }
  ];

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef,
    private attendanceService: AttendanceService
  ) { }

  ngOnInit() {
    this.initForm();
    this.fetchRequests();
  }

  toggleFullScreen(): void {
    this.isFullScreen = !this.isFullScreen;
    this.cdr.markForCheck();
  }

  fetchRequests() {
    this.isLoading = true;
    this.attendanceService.getMyRegularizations().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.requests = res.data.map((req: any) => ({
            ...req,
            id: req.id,
            attendanceDate: req.attendanceDate ? new Date(req.attendanceDate) : null,
            correctionType: req.correctionType,
            checkIn: req.checkIn ? new Date(req.checkIn) : null,
            checkOut: req.checkOut ? new Date(req.checkOut) : null,
            reason: req.reason,
            status: req.status,
            submittedOn: req.createdAt ? new Date(req.createdAt) : null,
            managerRemarks: req.managerRemarks,
            hrRemarks: req.hrRemarks,
            approvedBy: req.approvedBy,
            approvedByName: req.approvedByName,
            employeeName: req.employeeName
          }));
        } else {
          this.requests = [];
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch requests' });
        this.cdr.markForCheck();
      }
    });
  }

  initForm() {
    const defaultCheckIn = new Date();
    defaultCheckIn.setHours(10, 0, 0, 0);

    const defaultCheckOut = new Date();
    defaultCheckOut.setHours(19, 0, 0, 0);

    this.regForm = this.fb.group({
      attendanceDate: [null, Validators.required],
      correctionType: [null, Validators.required],
      checkIn: [defaultCheckIn, Validators.required],
      checkOut: [defaultCheckOut, Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]]
    });
  }

  // Summary Metrics Counts
  get pendingCount(): number {
    return this.requests.filter(r => r.status === 'Pending').length;
  }

  get approvedCount(): number {
    return this.requests.filter(r => r.status === 'Approved').length;
  }

  get rejectedCount(): number {
    return this.requests.filter(r => r.status === 'Rejected').length;
  }

  // Filter Logic
  get filteredRequests(): any[] {
    return this.requests.filter(req => {
      const matchesSearch = this.searchQuery ?
        (req.reason.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          req.correctionType.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          req.id.toLowerCase().includes(this.searchQuery.toLowerCase())) : true;

      const matchesStatus = this.statusFilter !== 'All' ? req.status === this.statusFilter : true;

      const matchesMonth = this.monthFilter !== 'All' ?
        req.attendanceDate.getMonth().toString() === this.monthFilter : true;

      return matchesSearch && matchesStatus && matchesMonth;
    });
  }

  clearFilters() {
    this.searchQuery = '';
    this.statusFilter = 'All';
    this.monthFilter = 'All';
    this.cdr.markForCheck();
  }

  isInvalid(controlName: string): boolean {
    const control = this.regForm.get(controlName);
    return !!(control?.invalid && (control?.touched || control?.dirty));
  }

  openNewDrawer() {
    this.drawerType = 'add';
    this.drawerVisible = true;

    const defaultCheckIn = new Date();
    defaultCheckIn.setHours(10, 0, 0, 0);

    const defaultCheckOut = new Date();
    defaultCheckOut.setHours(19, 0, 0, 0);

    this.regForm.reset({
      attendanceDate: null,
      correctionType: null,
      checkIn: defaultCheckIn,
      checkOut: defaultCheckOut,
      reason: ''
    });
    this.selectedFileName = '';
    this.cdr.markForCheck();
  }

  openEditDrawer(req: any) {
    this.drawerType = 'edit';
    this.selectedRequest = req;
    this.drawerVisible = true;
    this.selectedFileName = '';

    this.regForm.patchValue({
      attendanceDate: req.attendanceDate,
      correctionType: req.correctionType,
      checkIn: req.checkIn,
      checkOut: req.checkOut,
      reason: req.reason
    });
    this.cdr.markForCheck();
  }

  openViewDrawer(req: any) {
    this.selectedRequest = req;
    this.viewDrawerVisible = true;
    this.cdr.markForCheck();
  }

  openHistoryDrawer(req: any) {
    this.selectedRequest = req;
    this.historyEvents = [];
    
    // Created Event
    if (req.submittedOn) {
      this.historyEvents.push({
        status: 'Submitted',
        date: req.submittedOn,
        icon: 'pi pi-file-arrow-up',
        color: 'bg-blue-500',
        title: 'Request Submitted',
        description: `A regularization request for the date of ${new Date(req.attendanceDate).toLocaleDateString()} was submitted by ${req.employeeName || 'You'}.`
      });
      
      this.historyEvents.push({
        status: 'Forwarded',
        date: req.submittedOn,
        icon: 'pi pi-send',
        color: 'bg-purple-500',
        title: 'Request Forwarded',
        description: 'Your request has been automatically forwarded to your Reporting Manager and HR Admin for review.'
      });
    }

    // Pending State
    if (req.status === 'Pending') {
      this.historyEvents.push({
        status: 'Pending',
        date: req.submittedOn,
        icon: 'pi pi-clock',
        color: 'bg-amber-500',
        title: 'Pending Approval',
        description: 'Request is currently waiting for HR Admin or Manager approval.'
      });
    }

    // Processed State (Approved/Rejected)
    if (req.status === 'Approved' || req.status === 'Rejected') {
      const processedBy = req.approvedByName || (req.hrRemarks ? 'HR Admin' : (req.managerRemarks ? 'Manager' : 'HR Admin/Manager'));
      const remarks = req.hrRemarks || req.managerRemarks || 'No remarks provided.';
      
      this.historyEvents.push({
        status: req.status,
        date: req.updatedAt || req.submittedOn,
        icon: req.status === 'Approved' ? 'pi pi-check' : 'pi pi-times',
        color: req.status === 'Approved' ? 'bg-emerald-500' : 'bg-rose-500',
        title: `Request ${req.status}`,
        description: `Your request was ${req.status.toLowerCase()} by ${processedBy}. Remarks: ${remarks}`
      });
    }

    this.historyDrawerVisible = true;
    this.cdr.markForCheck();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
    }
  }

  onSubmit() {
    if (this.regForm.invalid) {
      this.regForm.markAllAsTouched();
      this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Please fill all required fields correctly.' });
      return;
    }

    this.isLoading = true;
    const formValue = this.regForm.getRawValue();

    const payload = {
      attendanceDate: formValue.attendanceDate,
      correctionType: formValue.correctionType,
      checkIn: formValue.checkIn,
      checkOut: formValue.checkOut,
      reason: formValue.reason,
      attachmentUrl: this.selectedFileName || null
    };

    if (this.drawerType === 'add') {
      this.attendanceService.submitRegularization(payload).subscribe({
        next: (res) => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Regularization request submitted successfully!' });
          this.drawerVisible = false;
          this.fetchRequests(); // reload list
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
          const errorMsg = err.error?.message || 'Failed to submit regularization request';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
          this.cdr.markForCheck();
        }
      });
    } else if (this.drawerType === 'edit') {
      this.attendanceService.updateRegularization(this.selectedRequest.id, payload).subscribe({
        next: (res) => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Regularization request updated successfully!' });
          this.drawerVisible = false;
          this.fetchRequests(); // reload list
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
          const errorMsg = err.error?.message || 'Failed to update regularization request';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
          this.cdr.markForCheck();
        }
      });
    }
  }

  onDelete(id: string) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this regularization request?',
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.isLoading = true;
        this.cdr.markForCheck();
        this.attendanceService.deleteRegularization(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Regularization request deleted successfully!' });
            this.fetchRequests();
          },
          error: (err) => {
            console.error(err);
            this.isLoading = false;
            const errorMsg = err.error?.message || 'Failed to delete regularization request';
            this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  onRefresh() {
    this.isLoading = true;
    this.fetchRequests();
    setTimeout(() => {
      this.messageService.add({ severity: 'info', summary: 'Refreshed', detail: 'Regularization requests list is up to date.' });
    }, 500);
  }

  disableAction = (actionId: string, row: any): boolean => {
    if (row.status !== 'Pending' && row.status !== 'Rejected') {
      if (actionId === 'edit') return true;
    }
    if (row.status !== 'Pending') {
      if (actionId === 'delete') return true;
    }
    return false;
  };

  onActionClicked(event: { actionId: string; row: any }) {
    if (event.actionId === 'edit') {
      this.openEditDrawer(event.row);
    } else if (event.actionId === 'view') {
      this.openViewDrawer(event.row);
    } else if (event.actionId === 'history') {
      this.openHistoryDrawer(event.row);
    } else if (event.actionId === 'delete') {
      this.onDelete(event.row.id);
    }
  }

  onPageChange(page: number) {
    this.pageNo = page;
  }

  onSearchChange(text: string) {
    this.searchQuery = text;
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
  }
}
