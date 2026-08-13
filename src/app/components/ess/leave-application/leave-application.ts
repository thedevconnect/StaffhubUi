import { Component, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Breadcrumb } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CardModule } from 'primeng/card';
import { LoadingService } from '../../../shared/services/loading.service';
import { UserService } from '../../../shared/services/user-service';
import { TableColumn, TableTemplate } from '../../../shared/ui/table-template/table-template';
import { EmployeeManagementService } from '../../../shared/services/employee-management.service';
import { LeaveService, LeaveRequest } from '../../../shared/services/leave.service';

import { AuthService } from '../../../shared/services/services/auth.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-leave-application',
  standalone: true,
  imports: [
    CardModule,
    Breadcrumb,
    ButtonModule,
    TooltipModule,
    TableModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DialogModule,
    DrawerModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
    ToastModule,
    ConfirmDialogModule,
    TableTemplate
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './leave-application.html',
  styleUrl: './leave-application.scss'
})
export class LeaveApplication {
  authService = inject(AuthService);

  get isHrAdmin(): boolean {
    const user = this.authService.user();
    if (!user) return false;
    const roleStr = user.role || '';
    const roles = roleStr.split(',').map((r: string) => r.trim().toUpperCase());
    const roleObjs = (user.roles || []).map(r => (r.roleId || r.rolDes || '').toUpperCase());
    const privileged = ['HR_ADMIN', 'ADMIN', 'SUPER_ADMIN', 'SUPERADMIN', 'DEVELOPER', 'HRADMIN', 'HR'];
    return roles.some((r: string) => privileged.includes(r)) || roleObjs.some((r: string) => privileged.includes(r));
  }

  visible: boolean = false;
  header: string = '';
  headerIcon: string = '';
  postType: string = '';

  param: any;
  menulabel: any = '';
  formlable: any = '';

  breadcrumbItems: any[] = [];
  isLoading: boolean = false;
  leaveForm!: FormGroup;
  minDate: Date = new Date(new Date().setDate(new Date().getDate() - 10));

  sessionFrom: any;
  sessionTo: any;
  leaveTypedata: any;
  selectedCc: any;

  isHistoryDrawerVisible: boolean = false;
  leaveHistoryData: any[] = [];

  leaveSummary: any = null;
  employeeList: any[] = [];
  selectedEmployeeId: any = null;
  requestedDays: number = 1;

  constructor(
    private loadingService: LoadingService,
    private router: Router,
    private userService: UserService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private employeeService: EmployeeManagementService,
    private leaveService: LeaveService,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
  }

  initForm() {
    this.leaveForm = this.fb.group({
      dateFrom: [new Date(), Validators.required],
      dateTo: [new Date(), Validators.required],
      session: ['Full Day', Validators.required],
      sessionFrom: ['Full Day'],
      sessionTo: ['Full Day'],
      leaveType: ['', Validators.required],
      ccTo: [null],
      reason: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(200)]]
    });
  }

  ngOnInit(): void {
    this.loadingService.startLoading();
    this.param = sessionStorage.getItem('menuItem');
    if (this.param) {
      let paramjs = JSON.parse(this.param);
      this.menulabel = paramjs.menu;
      this.formlable = paramjs.formName;
    }

    this.breadcrumbItems = [
      { label: 'Home', routerLink: '/ess/employee-attendance' },
      { label: this.menulabel || 'ESS', routerLink: '/ess' },
      { label: this.formlable || 'Leave Application' }
    ];
    this.loadingService.stopLoading();
    this.getViewData();
    this.getDrpData();
    this.fetchLeaveBalances();
  }

  fetchLeaveBalances() {
    this.leaveService.getLeaveBalances(this.selectedEmployeeId ? this.selectedEmployeeId.id || this.selectedEmployeeId : undefined).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.leaveSummary = res.data;
          this.updateLeaveTypeOptions();
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching leave balances:', err);
      }
    });
  }

  onEmployeeSelectChange() {
    this.fetchLeaveBalances();
  }

  onRunMonthlyCredit() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to trigger the monthly leave auto-credit (+1.0 EL & +0.5 CL per employee)?',
      header: 'Trigger Monthly Credit',
      icon: 'pi pi-calendar-plus',
      accept: () => {
        this.loadingService.startLoading();
        this.leaveService.triggerMonthlyCredit().subscribe({
          next: (res) => {
            this.loadingService.stopLoading();
            this.messageService.add({ severity: 'success', summary: 'Credit Completed', detail: res.message });
            this.fetchLeaveBalances();
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.loadingService.stopLoading();
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to credit monthly leaves' });
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  currentDate: Date = new Date();

  isInvalid(controlName: string): boolean {
    const control = this.leaveForm.get(controlName);
    return !!(control?.invalid && (control?.touched || control?.dirty));
  }

  getAttendanceData() {
    this.loadingService.startLoading();
    this.loadingService.stopLoading();
  }

  sessionDrp: any;
  ccDrp: any;
  leaveTypeDrp: any;
  leaveStatus: any;

  getDrpData() {
    // Mocked Static Data instead of API Call
    this.sessionDrp = [
      { drpOption: 'First Half', drpValue: 'First Half' },
      { drpOption: 'Second Half', drpValue: 'Second Half' },
      { drpOption: 'Full Day', drpValue: 'Full Day' }
    ];
    this.employeeService.getEmployees().subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.employeeList = res.map((emp: any) => ({
            id: emp.id,
            drpOption: `${emp.full_name} (${emp.emp_id || 'EMP'})`
          }));
          this.ccDrp = res.map((emp: any) => ({
            drpOption: `${emp.full_name}/${emp.designation || emp.role || 'Employee'}`
          }));
        } else {
          this.employeeList = [];
          this.ccDrp = [];
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.employeeList = [];
        this.ccDrp = [];
        this.cdr.markForCheck();
      }
    });
    this.updateLeaveTypeOptions();
    this.leaveStatus = 'Apply';

    if (this.sessionDrp?.length > 0) {
      this.selectSession('Full Day');
    }
    this.cdr.markForCheck();
  }

  updateLeaveTypeOptions() {
    const elBal = this.leaveSummary?.earnedLeave?.remaining ?? 0;
    const clBal = this.leaveSummary?.casualLeave?.remaining ?? 0;
    const slBal = this.leaveSummary?.sickLeave?.remaining ?? 0;
    const plBal = this.leaveSummary?.parentalLeave?.remaining ?? 5;

    this.leaveTypeDrp = [
      { drpOption: `Casual Leave (${clBal} bal)`, drpValue: 'Casual Leave', bal: clBal },
      { drpOption: `Earned Leave (${elBal} bal)`, drpValue: 'Earned Leave', bal: elBal },
      { drpOption: `Sick Leave (${slBal} bal)`, drpValue: 'Sick Leave', bal: slBal },
      { drpOption: `Parental Leave (${plBal} bal)`, drpValue: 'Parental Leave', bal: plBal },
      { drpOption: `Loss of Pay (LOP)`, drpValue: 'LOP', bal: 'LOP' }
    ];

    if (!this.leaveTypedata && this.leaveTypeDrp.length > 0) {
      this.selectLeaveType(this.leaveTypeDrp[0].drpValue);
    }
  }

  session = 'Full Day';

  selectSession(val: any) {
    this.session = val;
    this.sessionFrom = val;
    this.sessionTo = val;
    this.leaveForm.patchValue({ session: val, sessionFrom: val, sessionTo: val });
  }

  selectSessionFrom(val: any) {
    this.selectSession(val);
  }

  selectSessionTo(val: any) {
    this.selectSession(val);
  }

  selectLeaveType(val: any) {
    this.leaveTypedata = val;
    this.leaveForm.patchValue({ leaveType: val });
  }

  onDateFromChange() {
    const from = this.leaveForm.get('dateFrom')?.value;
    const to = this.leaveForm.get('dateTo')?.value;
    if (from && to && from > to) {
      this.leaveForm.patchValue({ dateTo: from });
    }
    this.calculateDays();
  }

  calculateDays() {
    const from = this.leaveForm.get('dateFrom')?.value;
    const to = this.leaveForm.get('dateTo')?.value;
    if (from && to) {
      const start = new Date(from).getTime();
      const end = new Date(to).getTime();
      const diffDays = Math.round((end - start) / (1000 * 3600 * 24)) + 1;
      this.requestedDays = diffDays > 0 ? diffDays : 1;
    }
  }
  noDatafoundCard: boolean = false;
  tblData: any[] = [];
  tableHeaders: any[] = [];
  columns: TableColumn[] = [];

  disableAction = (actionId: string, row: any): boolean => {
    const status = (row['leave Status'] || row['status'] || '').toString().toUpperCase();

    if (status === 'DELETED' || status === 'CANCELLED') {
      return true; // Completely disable all actions for deleted/cancelled leaves
    }

    if (status === 'PENDING' || status === 'REJECTED') {
      return false; // Enable actions (edit & delete) for PENDING and REJECTED leaves
    }

    // For Approved or other statuses, disable edit and delete
    return actionId === 'edit' || actionId === 'delete';
  };

  onActionClicked(event: { actionId: string; row: any }) {
    if (event.actionId === 'edit') {
      this.showDialog('edit', event.row);
    } else if (event.actionId === 'view') {
      this.showDialog('view', event.row);
    } else if (event.actionId === 'delete') {
      this.onWithdraw(event.row.id);
    }
  }

  activeTab: string = 'All';
  tabs: any[] = [
    { label: 'Pending', value: 'Pending', icon: 'pi pi-clock' },
    { label: 'Processed', value: 'Processed', icon: 'pi pi-check-circle' },
    { label: 'All', value: 'All', icon: 'pi pi-list' }
  ];

  onTabChange(tab: string) {
    this.activeTab = tab;
    this.pageNo = 1;
    this.cdr.markForCheck();
  }

  get filteredData() {
    let data = this.tblData;

    // Filter by Tab
    if (this.activeTab !== 'All') {
      if (this.activeTab === 'Pending') {
        data = data.filter(item => item['leave Status'] === 'Pending' || item['leave Status'] === 'PENDING');
      } else {
        data = data.filter(item => item['leave Status'] !== 'Pending' && item['leave Status'] !== 'PENDING');
      }
    }

    // Filter by Search
    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      data = data.filter(item =>
        Object.values(item).some(val =>
          String(val).toLowerCase().includes(search)
        )
      );
    }

    return data;
  }

  get totalCount() {
    return this.filteredData.length;
  }

  getViewData(showLoader: boolean = true) {
    if (showLoader) {
      this.isLoading = true;
      this.loadingService.startLoading();
    }
    this.cdr.markForCheck();

    this.leaveService.getLeaves().subscribe({
      next: (res) => {
        if (showLoader) {
          this.isLoading = false;
          this.loadingService.stopLoading();
        }
        if (res.success && Array.isArray(res.data)) {
          this.tblData = res.data.map((l: any) => {
            const startDate = l.start_date ? new Date(l.start_date) : null;
            const endDate = l.end_date ? new Date(l.end_date) : null;

            return {
              id: l.id,
              'employee Name': l.employee_name || 'Employee',
              'employee Code': l.employee_code || '-',
              'date From': startDate ? `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}` : '',
              'date To': endDate ? `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}` : '',
              'leave Type': l.leave_type,
              'reason': l.reason || '-',
              'leave Status': l.status || 'PENDING'
            };
          });

          if (this.tblData.length > 0) {
            const dynamicCols = Object.keys(this.tblData[0])
              .filter(key => key.toLowerCase() !== 'id')
              .map(key => {
                const header = key.split(/(?=[A-Z])|_/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                return {
                  key: key,
                  header: header,
                  isVisible: true,
                  isSortable: true,
                  isCustom: false
                };
              });

            this.columns = [
              { key: 'rowNo', header: 'S.no', isVisible: true, isSortable: false },
              ...dynamicCols,
              { key: 'actions', header: 'Action', isVisible: true, isSortable: false }
            ];
            this.tableHeaders = this.columns;

            this.tblData = this.tblData.map((item, index) => ({
              ...item,
              rowNo: index + 1,
              isExpanded: false
            }));
          } else {
            this.columns = [];
            this.tableHeaders = [];
            this.tblData = [];
          }
        }
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: () => {
        if (showLoader) {
          this.isLoading = false;
          this.loadingService.stopLoading();
        }
        this.tblData = [];
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    });
  }

  onDrawerHide() {
    this.visible = false;
    this.leaveForm.reset();
    this.leaveForm.enable();
    this.cdr.markForCheck();
  }

  viewHistory(id: number) {
    this.isHistoryDrawerVisible = true;
    this.loadingService.startLoading();
    this.cdr.markForCheck();
    this.leaveService.getLeaveHistory(id).subscribe({
      next: (res) => {
        this.loadingService.stopLoading();
        if (res.success) {
          this.leaveHistoryData = res.data;
        } else {
          this.leaveHistoryData = [];
        }
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingService.stopLoading();
        this.leaveHistoryData = [];
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    });
  }

  editingId: number | null = null;

  showDialog(type: string, data: any) {
    this.visible = true;
    this.postType = type;

    if (type === 'add') {
      this.header = 'Add Leave Application';
      this.headerIcon = 'pi pi-plus';
      this.leaveForm.enable();
    } else if (type === 'edit') {
      this.header = 'Edit Leave Application';
      this.headerIcon = 'pi pi-pencil';
      this.leaveForm.enable();
    } else if (type === 'view') {
      this.header = 'View Leave Application';
      this.headerIcon = 'pi pi-eye';
      this.leaveForm.disable();
    }

    if (type === 'edit' || type === 'view') {
      this.editingId = data.id;
      this.leaveForm.patchValue({
        dateFrom: data['date From'] ? new Date(data['date From']) : null,
        dateTo: data['date To'] ? new Date(data['date To']) : null,
        session: data['session'] || 'Full Day',
        sessionFrom: data['from Session'] || 'Full Day',
        sessionTo: data['to Session'] || 'Full Day',
        leaveType: data['leave Type'] || data['leave_type'],
        ccTo: data['cc To'],
        reason: data['reason']
      });
      this.session = data['session'] || 'Full Day';
      this.sessionFrom = data['from Session'] || 'Full Day';
      this.sessionTo = data['to Session'] || 'Full Day';
      this.leaveTypedata = data['leave Type'] || data['leave_type'];
    } else {
      this.editingId = null;
      const defaultLType = this.leaveTypeDrp?.[0]?.drpValue || 'Casual Leave';
      this.leaveTypedata = defaultLType;
      this.session = 'Full Day';
      this.leaveForm.reset({
        dateFrom: new Date(),
        dateTo: new Date(),
        session: 'Full Day',
        sessionFrom: 'Full Day',
        sessionTo: 'Full Day',
        leaveType: defaultLType
      });
    }
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  onSubmit() {
    if (this.leaveForm.invalid) {
      this.leaveForm.markAllAsTouched();
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill all required fields correctly.' });
      return;
    }

    this.confirmationService.confirm({
      message: 'Are you sure you want to submit this leave application?',
      header: 'Confirm Submission',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.loadingService.startLoading();

        const val = this.leaveForm.value;
        const formatDateStr = (d: any): string => {
          if (!d) return '';
          const dt = new Date(d);
          return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
        };

        const payload = {
          leaveType: val.leaveType || this.leaveTypedata,
          startDate: formatDateStr(val.dateFrom),
          endDate: formatDateStr(val.dateTo),
          session: val.session || this.session || 'Full Day',
          reason: val.reason,
          status: 'PENDING'
        };

        const req = (this.postType === 'edit' && this.editingId)
          ? this.leaveService.updateLeave(this.editingId, payload)
          : this.leaveService.createLeave(payload);

        req.subscribe({
          next: (res) => {
            this.loadingService.stopLoading();
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Data saved successfully!' });
            this.visible = false;

            const lType = this.leaveTypeDrp?.[0]?.drpValue || 'Casual Leave';

            this.leaveForm.reset({
              dateFrom: new Date(),
              dateTo: new Date(),
              session: 'Full Day',
              sessionFrom: 'Full Day',
              sessionTo: 'Full Day',
              leaveType: lType
            });

            this.session = 'Full Day';
            this.leaveTypedata = lType;

            this.getViewData();
            this.fetchLeaveBalances();
            this.cdr.markForCheck();
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.loadingService.stopLoading();
            const errMsg = err?.error?.message || err?.message || 'Failed to submit leave application';
            this.messageService.add({ severity: 'error', summary: 'Submission Error', detail: errMsg });
            this.cdr.markForCheck();
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  onWithdraw(id: any) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to withdraw this leave application?',
      header: 'Confirm Withdrawal',
      icon: 'pi pi-info-circle',
      accept: () => {
        this.loadingService.startLoading();

        this.leaveService.deleteLeave(id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Your leave application has been withdrawn successfully!'
            });
            this.getViewData();
            this.loadingService.stopLoading();
            this.cdr.markForCheck();
            this.cdr.detectChanges();
          },
          error: () => {
            this.loadingService.stopLoading();
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to withdraw leave application' });
            this.cdr.markForCheck();
            this.cdr.detectChanges();
          }
        });
      },
      reject: () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Cancelled',
          detail: 'You have cancelled your leave application withdrawal'
        });
      }
    });
  }

  pageNo: number = 1;
  pageSize: number = 10;
  searchText: string = '';

  onPageChange(newPage: number) {
    this.pageNo = newPage;
    this.getViewData(true);
  }

  onPageSizeChange(newSize: number) {
    this.pageSize = newSize;
    this.pageNo = 1;
    this.getViewData(true);
  }

  onSearchChange(search: string) {
    this.searchText = search;
    this.pageNo = 1;
  }
}