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
    ConfirmDialogModule
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

  // Static mock requests list
  requests: any[] = [
    {
      id: 'REQ-REG-001',
      attendanceDate: new Date('2026-07-01'),
      correctionType: 'Missed Punch',
      checkIn: new Date('2026-07-01T09:00:00'),
      checkOut: new Date('2026-07-01T18:00:00'),
      reason: 'Card swiped failed at entrance gate due to system glitch.',
      status: 'Approved',
      submittedOn: new Date('2026-07-01T18:30:00'),
      managerRemarks: 'Verified check-in from department gate log. Approved.',
      hrRemarks: 'Attendance record updated.'
    },
    {
      id: 'REQ-REG-002',
      attendanceDate: new Date('2026-07-04'),
      correctionType: 'Late In',
      checkIn: new Date('2026-07-04T10:15:00'),
      checkOut: new Date('2026-07-04T18:30:00'),
      reason: 'Delayed due to official client meeting at Gurugram hub.',
      status: 'Pending',
      submittedOn: new Date('2026-07-04T19:00:00'),
      managerRemarks: null,
      hrRemarks: null
    },
    {
      id: 'REQ-REG-003',
      attendanceDate: new Date('2026-06-25'),
      correctionType: 'Early Out',
      checkIn: new Date('2026-06-25T09:00:00'),
      checkOut: new Date('2026-06-25T15:00:00'),
      reason: 'Approved early exit for emergency doctor appointment.',
      status: 'Rejected',
      submittedOn: new Date('2026-06-25T16:00:00'),
      managerRemarks: 'Prior approval was not requested. Rejected.',
      hrRemarks: 'No supporting document attached.'
    }
  ];

  // Filter bindings
  searchQuery: string = '';
  statusFilter: string = 'All';
  monthFilter: string = 'All';

  // Modal / Drawer variables
  drawerVisible: boolean = false;
  viewDrawerVisible: boolean = false;
  drawerType: string = 'add'; // 'add' or 'edit'
  selectedRequest: any = null;
  isLoading: boolean = false;

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
    { label: 'January', value: '0' },
    { label: 'February', value: '1' },
    { label: 'March', value: '2' },
    { label: 'April', value: '3' },
    { label: 'May', value: '4' },
    { label: 'June', value: '5' },
    { label: 'July', value: '6' },
    { label: 'August', value: '7' },
    { label: 'September', value: '8' },
    { label: 'October', value: '9' },
    { label: 'November', value: '10' },
    { label: 'December', value: '11' }
  ];

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.initForm();
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

    // Simulate submission latency
    setTimeout(() => {
      if (this.drawerType === 'add') {
        const newRequest = {
          id: 'REQ-REG-' + String(Date.now()).slice(-3),
          attendanceDate: formValue.attendanceDate,
          correctionType: formValue.correctionType,
          checkIn: formValue.checkIn,
          checkOut: formValue.checkOut,
          reason: formValue.reason,
          status: 'Pending',
          submittedOn: new Date(),
          managerRemarks: null,
          hrRemarks: null
        };

        this.requests = [newRequest, ...this.requests];
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Regularization request submitted successfully!' });
      } else {
        // Edit mode
        this.requests = this.requests.map(req => {
          if (req.id === this.selectedRequest.id) {
            return {
              ...req,
              attendanceDate: formValue.attendanceDate,
              correctionType: formValue.correctionType,
              checkIn: formValue.checkIn,
              checkOut: formValue.checkOut,
              reason: formValue.reason,
              status: 'Pending', // Resets back to Pending on resubmission
              submittedOn: new Date()
            };
          }
          return req;
        });
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Regularization request updated successfully!' });
      }

      this.drawerVisible = false;
      this.isLoading = false;
      this.cdr.markForCheck();
    }, 600);
  }

  onDelete(id: string) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this regularization request?',
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.requests = this.requests.filter(req => req.id !== id);
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Regularization request deleted successfully!' });
        this.cdr.markForCheck();
      }
    });
  }

  onRefresh() {
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
      this.messageService.add({ severity: 'info', summary: 'Refreshed', detail: 'Regularization requests list is up to date.' });
      this.cdr.markForCheck();
    }, 500);
  }
}
