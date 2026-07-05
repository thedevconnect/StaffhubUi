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

  constructor(
    private loadingService: LoadingService,
    private router: Router,
    private userService: UserService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
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
    this.ccDrp = [
      { drpOption: 'John Doe/Manager' },
      { drpOption: 'Jane Smith/HR' },
      { drpOption: 'Mike Johnson/Lead' }
    ];
    this.leaveTypeDrp = [
      { drpOption: 'Casual Leave', drpValue: 'Casual Leave' },
      { drpOption: 'Sick Leave', drpValue: 'Sick Leave' },
      { drpOption: 'Earned Leave', drpValue: 'Earned Leave' }
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

  get filteredData() {
    if (!this.searchText) return this.tblData;
    const search = this.searchText.toLowerCase();
    return this.tblData.filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(search)
      )
    );
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

    // Mocked Static Table Data instead of API Call
    setTimeout(() => {
      this.tblData = [
        {
          id: 1,
          'date From': '2026-06-01',
          'date To': '2026-06-02',
          'from Session': 'First Half',
          'to Session': 'Second Half',
          'leave Type': 'Casual Leave',
          'reason': 'Personal work',
          'cc To': 'John Doe/Manager',
          'leave Status': 'Apply'
        },
        {
          id: 2,
          'date From': '2026-05-15',
          'date To': '2026-05-15',
          'from Session': 'Full Day',
          'to Session': 'Full Day',
          'leave Type': 'Sick Leave',
          'reason': 'Medical Checkup',
          'cc To': 'Jane Smith/HR',
          'leave Status': 'Approved'
        }
      ];

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

        this.tableHeaders = [
          { key: 'rowNo', header: 'S.no', isVisible: true, isSortable: false },
          ...dynamicCols,
          { key: 'actions', header: 'Action', isVisible: true, isSortable: false, isCustom: true }
        ];

        // Add row numbers and expansion state to data
        this.tblData = this.tblData.map((item, index) => ({
          ...item,
          rowNo: index + 1,
          isExpanded: false
        }));
      }
      this.noDatafoundCard = this.tblData.length <= 0;
      this.isLoading = false;
      this.loadingService.stopLoading();
    }, 800);
  }

  onDrawerHide() {
    this.visible = false;
  }

  showDialog(type: string, data: any) {
    this.visible = true;
    this.header = type == 'add' ? 'Add Leave Application' : 'Edit Leave Application';
    this.headerIcon = type == 'add' ? 'pi pi-plus' : 'pi pi-pencil';
    this.postType = type;
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

        // Mocked Static Submission Response
        setTimeout(() => {
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
        }, 1000);
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

        // Mocked Static Withdraw Response
        setTimeout(() => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Your leave application has been withdrawn successfully!'
          });
          this.getViewData();
          this.loadingService.stopLoading();
        }, 1000);
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