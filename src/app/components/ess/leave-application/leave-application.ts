import { Component } from '@angular/core';
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

  constructor(
    private loadingService: LoadingService,
    private router: Router,
    private userService: UserService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private employeeService: EmployeeManagementService,
    private leaveService: LeaveService
  ) {
    this.initForm();
  }

  initForm() {
    this.leaveForm = this.fb.group({
      dateFrom: [new Date(), Validators.required],
      dateTo: [new Date(), Validators.required],
      sessionFrom: ['', Validators.required],
      sessionTo: ['', Validators.required],
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
          this.ccDrp = res.map((emp: any) => ({
            drpOption: `${emp.full_name}/${emp.designation || emp.role || 'Employee'}`
          }));
        } else {
          this.ccDrp = [];
        }
      },
      error: () => {
        this.ccDrp = [];
      }
    });
    this.leaveTypeDrp = [
      { drpOption: 'Casual Leave', drpValue: 'Casual Leave' },
      { drpOption: 'Sick Leave', drpValue: 'Sick Leave' },
      { drpOption: 'Earned Leave', drpValue: 'Earned Leave' },
      { drpOption: 'Loss of Pay (LOP)', drpValue: 'LOP' }
    ];
    this.leaveStatus = 'Apply';

    // Set defaults if chips aren't selected
    if (this.sessionDrp?.length > 0) {
      this.selectSessionFrom(this.sessionDrp[0].drpValue);
      this.selectSessionTo(this.sessionDrp[0].drpValue);
    }
    if (this.leaveTypeDrp?.length > 0) {
      this.selectLeaveType(this.leaveTypeDrp[0].drpValue);
    }
  }

  selectSessionFrom(val: any) {
    this.sessionFrom = val;
    this.leaveForm.patchValue({ sessionFrom: val });
  }

  selectSessionTo(val: any) {
    this.sessionTo = val;
    this.leaveForm.patchValue({ sessionTo: val });
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
  }

  noDatafoundCard: boolean = false;
  tblData: any[] = [];
  tableHeaders: any[] = [];
  columns: TableColumn[] = [];

  disableAction = (actionId: string, row: any): boolean => {
    if (row['leave Status'] !== 'PENDING') {
      return actionId === 'edit' || actionId === 'delete';
    }
    return false;
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

  get paginatedData() {
    const filtered = this.filteredData;
    const start = (this.pageNo - 1) * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  }

  get totalCount() {
    return this.filteredData.length;
  }

  getViewData(showLoader: boolean = true) {
    if (showLoader) {
      this.isLoading = true;
      this.loadingService.startLoading();
    }

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
      },
      error: () => {
        if (showLoader) {
          this.isLoading = false;
          this.loadingService.stopLoading();
        }
        this.tblData = [];
      }
    });
  }

  onDrawerHide() {
    this.visible = false;
    this.leaveForm.reset();
    this.leaveForm.enable();
  }

  viewHistory(id: number) {
    this.isHistoryDrawerVisible = true;
    this.loadingService.startLoading();
    this.leaveService.getLeaveHistory(id).subscribe({
      next: (res) => {
        this.loadingService.stopLoading();
        if (res.success) {
          this.leaveHistoryData = res.data;
        } else {
          this.leaveHistoryData = [];
        }
      },
      error: () => {
        this.loadingService.stopLoading();
        this.leaveHistoryData = [];
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
        sessionFrom: data['from Session'],
        sessionTo: data['to Session'],
        leaveType: data['leave Type'],
        ccTo: data['cc To'],
        reason: data['reason']
      });
      this.sessionFrom = data['from Session'];
      this.sessionTo = data['to Session'];
      this.leaveTypedata = data['leave Type'];
    } else {
      this.editingId = null;
      this.leaveForm.reset({
        dateFrom: new Date(),
        dateTo: new Date(),
        sessionFrom: this.sessionDrp?.[0]?.drpValue,
        sessionTo: this.sessionDrp?.[0]?.drpValue,
        leaveType: this.leaveTypeDrp?.[0]?.drpValue
      });
    }
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
          leaveType: val.leaveType,
          startDate: formatDateStr(val.dateFrom),
          endDate: formatDateStr(val.dateTo),
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

            const sFrom = this.sessionDrp?.[0]?.drpValue;
            const sTo = this.sessionDrp?.[0]?.drpValue;
            const lType = this.leaveTypeDrp?.[0]?.drpValue;

            this.leaveForm.reset({
              dateFrom: new Date(),
              dateTo: new Date(),
              sessionFrom: sFrom,
              sessionTo: sTo,
              leaveType: lType
            });

            this.sessionFrom = sFrom;
            this.sessionTo = sTo;
            this.leaveTypedata = lType;

            this.getViewData();
          },
          error: (err) => {
            this.loadingService.stopLoading();
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to submit leave application' });
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
          },
          error: () => {
            this.loadingService.stopLoading();
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to withdraw leave application' });
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