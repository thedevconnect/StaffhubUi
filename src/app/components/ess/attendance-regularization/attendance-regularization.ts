import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { ActivatedRoute } from '@angular/router';
import { AttendanceService } from '../../../shared/services/attendance.service';
import { TableColumn, TableTemplate } from '../../../shared/ui/table-template/table-template';
import { parseLocalDatetime } from '../../../shared/utils/date-utils';

@Component({
  selector: 'app-attendance-regularization',
  standalone: true,
  imports: [
    CommonModule,
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

  activeTab: string = 'All';
  
  tabs = [
    { label: 'Pending', value: 'Pending', icon: 'pi pi-clock' },
    { label: 'Approved', value: 'Approved', icon: 'pi pi-check-circle' },
    { label: 'Rejected', value: 'Rejected', icon: 'pi pi-times-circle' },
    { label: 'Processed', value: 'Processed', icon: 'pi pi-check' },
    { label: 'All', value: 'All', icon: 'pi pi-list' }
  ];

  onTabChange(tab: string) {
    this.activeTab = tab;
  }

  columns: TableColumn[] = [
    { key: 'actions', header: 'Action' },
    { key: 'attendanceDate', header: 'Attendance Date' },
    { key: 'correctionType', header: 'Correction Type' },
    { key: 'checkIn', header: 'Check In' },
    { key: 'checkOut', header: 'Check Out' },
    { key: 'reason', header: 'Reason' },
    { key: 'status', header: 'Status' },
    { key: 'managerRemarks', header: 'managerRemarks' },
    { key: 'approvedByName', header: 'Approved By' },
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
  selectedFileBase64: string = '';

  // Select Options
  correctionTypes = [
    { label: 'Missed Punch', value: 'Missed Punch' },
    { label: 'Late In', value: 'Late In' },
    { label: 'Early Out', value: 'Early Out' },
    { label: 'Half Day Correction', value: 'Half Day Correction' },
    { label: 'Other Correction', value: 'Other Correction' }
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
    private attendanceService: AttendanceService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.initForm();
    this.fetchRequests();
    this.checkQueryParamDate();
  }

  checkQueryParamDate() {
    this.route.queryParams.subscribe(params => {
      if (params['date']) {
        const targetDate = new Date(params['date']);
        if (!isNaN(targetDate.getTime())) {
          setTimeout(() => this.openNewDrawer(targetDate), 200);
        }
      }
    });
  }

  toggleFullScreen(): void {
    this.isFullScreen = !this.isFullScreen;
    this.cdr.markForCheck();
  }

  parseDatetime(val: any): Date | null {
    return parseLocalDatetime(val);
  }

  fetchRequests() {
    this.isLoading = true;
    this.attendanceService.getMyRegularizations().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.requests = res.data.map((req: any) => ({
            ...req,
            id: req.id,
            attendanceDate: req.attendanceDate || req.attendance_date,
            correctionType: req.correctionType,
            checkIn: this.parseDatetime(req.checkIn),
            checkOut: this.parseDatetime(req.checkOut),
            reason: req.reason,
            status: req.status,
            submittedOn: req.createdAt ? new Date(req.createdAt) : null,
            managerRemarks: req.managerRemarks,
            hrRemarks: req.hrRemarks,
            approvedBy: req.approvedBy,
            approvedByName: req.approvedByName,
            employeeName: req.employeeName,
            attachmentUrl: req.attachmentUrl || req.attachment_url || null
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

  // Filter Logic
  get filteredRequests(): any[] {
    return this.requests.filter(req => {
      let matchesTab = true;
      const statusUpper = (req.status || '').toUpperCase();

      if (this.activeTab === 'Pending') {
        matchesTab = statusUpper === 'PENDING';
      } else if (this.activeTab === 'Approved') {
        matchesTab = statusUpper === 'APPROVED';
      } else if (this.activeTab === 'Rejected') {
        matchesTab = statusUpper === 'REJECTED';
      } else if (this.activeTab === 'Processed') {
        matchesTab = statusUpper !== 'PENDING';
      }

      let matchesMonth = true;
      if (this.monthFilter !== 'All' && req.attendanceDate) {
        const dt = new Date(req.attendanceDate);
        matchesMonth = !isNaN(dt.getTime()) && (dt.getMonth() + 1).toString() === this.monthFilter;
      }

      return matchesTab && matchesMonth;
    });
  }

  clearFilters() {
    this.activeTab = 'All';
    this.monthFilter = 'All';
    this.cdr.markForCheck();
  }

  isInvalid(controlName: string): boolean {
    const control = this.regForm.get(controlName);
    return !!(control?.invalid && (control?.touched || control?.dirty));
  }

  openNewDrawer(targetDate?: Date | string) {
    this.drawerType = 'add';
    this.drawerVisible = true;

    const defaultCheckIn = new Date();
    defaultCheckIn.setHours(10, 0, 0, 0);

    const defaultCheckOut = new Date();
    defaultCheckOut.setHours(19, 0, 0, 0);

    let parsedDate: Date | null = null;
    if (targetDate) {
      parsedDate = targetDate instanceof Date ? targetDate : new Date(targetDate);
    }

    this.regForm.reset({
      attendanceDate: parsedDate,
      correctionType: 'Missed Punch',
      checkIn: defaultCheckIn,
      checkOut: defaultCheckOut,
      reason: ''
    });
    this.selectedFileName = '';
    this.selectedFileBase64 = '';
    this.cdr.markForCheck();
  }

  openEditDrawer(req: any) {
    this.drawerType = 'edit';
    this.selectedRequest = req;
    this.drawerVisible = true;
    this.selectedFileName = req.attachmentUrl ? (req.attachmentUrl.startsWith('data:') ? 'Uploaded Attachment' : req.attachmentUrl) : '';
    this.selectedFileBase64 = req.attachmentUrl || '';

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
            description: `${h.status} by ${h.action_by_name || 'System'}${h.action_by_designation ? ' (' + h.action_by_designation + ')' : ''}. Remarks: ${h.remarks || 'No remarks provided.'}`,
            actionByName: h.action_by_name || 'System',
            actionByDesignation: h.action_by_designation || ''
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

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFileName = file.name;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedFileBase64 = e.target.result;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
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

    const formatDateStr = (d: any) => {
      if (!d) return null;
      const dt = new Date(d);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    };

    const payload = {
      attendanceDate: formatDateStr(formValue.attendanceDate),
      correctionType: formValue.correctionType,
      checkIn: formValue.checkIn,
      checkOut: formValue.checkOut,
      reason: formValue.reason,
      attachmentUrl: this.selectedFileBase64 || this.selectedFileName || null
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
