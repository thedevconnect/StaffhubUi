import { Component, ChangeDetectorRef, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Popover } from 'primeng/popover';
import { Tooltip } from "primeng/tooltip";
import { ConfirmDialog } from 'primeng/confirmdialog';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CardModule } from 'primeng/card';
import { DrawerModule } from 'primeng/drawer';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Toast } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TableColumn, TableTemplate } from '../../../shared/ui/table-template/table-template';
import { UserService } from '../../../shared/services/user-service';


@Component({
  selector: 'app-activity-master',
  imports: [
    TableTemplate,
    CardModule,
    ButtonModule,
    DrawerModule,
    Popover,
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    SelectModule,
    DatePickerModule,
    ConfirmDialog,
    ProgressSpinner,
    Toast,
    Tooltip,
    BreadcrumbModule
  ],
  providers: [
    ConfirmationService,
    MessageService
  ],
  templateUrl: './activity-master.html',
  styleUrl: './activity-master.scss'
})
export class ActivityMaster {

  isLoading = true;
  visible: boolean = false;
  postType: string = '';
  header: any = '';
  selectedIndex: any = [];
  headerIcon: string = 'pi pi-plus';
  paramvaluedata: string = '';
  isFormLoading: boolean = false;
  data: any[] = [];
  activityMaster: FormGroup;


  columns: TableColumn[] = [
    { key: 'actions', header: '⚙️', isVisible: true, isSortable: false, isCustom: true },
    { key: 'formName', header: 'Activity', isVisible: true, isSortable: false },
    { key: 'formValue', header: 'Form Value', isVisible: true, isSortable: false },
    { key: 'formType', header: 'Form Type', isVisible: true, isSortable: false },
  ];
  pageNo = 1;
  pageSize = 5;
  searchText = '';
  totalCount = 0;
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private fb: FormBuilder,
    private userService: UserService,
    private confirmationService: ConfirmationService,
    private message: MessageService,
    private cdr: ChangeDetectorRef,
  ) {
    this.activityMaster = this.fb.group({
      activity: ['', Validators.required],
      formValue: ['', Validators.required],
      formType: ['', Validators.required]
    });
  }


  get f() { return this.activityMaster.controls }


  menulabel: string = '';
  breadcrumbItems: any[] = [];
  FormName: string = '';


  ngOnInit(): void {
    this.getTableData(true);

    const paramStr = sessionStorage.getItem('menuItem');

    const p = JSON.parse(paramStr || '{}');
    this.menulabel = p.menu;
    this.FormName = p.formName;
    this.breadcrumbItems = [
      { label: 'Home', icon: 'pi pi-home', routerLink: '/home' },
      { label: this.menulabel },
      { label: this.FormName }
    ];
  }



  // getTableData(isTrue: boolean) {
  //   try {
  //     if (isTrue) {
  //       this.isLoading = true;
  //     } else {
  //       this.pageNo = 1;
  //     }

  //     const currentRole = JSON.parse(sessionStorage.getItem('currentRole') || '{}');
  //     const roleId = currentRole?.roleId || '';
  //     const userId = sessionStorage.getItem('userId') || '';
  //     const districtId = sessionStorage.getItem('District') || '';

  //     const query = `appUserId=${userId}|appUserRole=${roleId}|districtId=${districtId}|searchText=${this.searchText}|pageIndex=${this.pageNo}|size=${this.pageSize}|activity=header`;
  //     this.userService.getQuestionPaper(`uspGetActivityMaster|${query}`).subscribe({
  //       next: (res: any) => {
  //         try {
  //           this.data = res?.table1 || [];
  //           this.totalCount = res?.table?.[0]?.totalCnt || this.data.length;
  //         } catch (innerErr) {
  //           console.error('Error processing response:', innerErr);
  //           this.data = [];
  //           this.totalCount = 0;
  //         } finally {
  //           setTimeout(() => {
  //             this.isLoading = false;
  //             this.cdr.detectChanges();
  //           }, 1000);
  //         }
  //       },
  //       error: (err) => {
  //         console.error('API call failed:', err);
  //         this.isLoading = false;
  //         if (err.status === 403) {
  //           this.Customvalidation.loginroute(err.status);
  //         } else {
  //           this.data = [];
  //           this.totalCount = 0;
  //         }
  //       }
  //     });

  //   } catch (error) {
  //     console.error('Unexpected error in getTableData():', error);
  //     this.isLoading = false;
  //   }
  // }

  getTableData(isTrue: boolean) {
    try {

    } catch (error) {

    }
  }
  onPageChange(newPage: number) {
    this.pageNo = newPage;
    this.getTableData(true);
  }

  onPageSizeChange(newSize: number) {
    this.pageSize = newSize;
    this.pageNo = 1; // reset to first page
    this.getTableData(true); // fetch data from API again
  }

  onSearchChange(search: string) {
    this.searchText = search;
    this.pageNo = 1;
    this.getTableData(false);
  }

  onSortChange(event: { column: string, direction: 'asc' | 'desc' }) {
    this.sortColumn = event.column;
    this.sortDirection = event.direction;
    this.getTableData(true);
  }

  onDrawerHide() {
    document.body.style.overflow = 'visible'; // restore scroll
    this.activityMaster.enable()
    this.visible = false;
    this.onClear()
  }
  onClear() {
    this.activityMaster.reset()

  }

  showDialog(view: string, data: any) {
    this.isFormLoading = true
    if (view == 'add') {
      this.visible = true;
      this.postType = view;
      this.headerIcon = view === 'add' ? 'pi pi-plus' : (view === 'update' ? 'pi pi-pencil' : 'pi pi-eye');
      this.header = view === 'add' ? 'Add ' + this.FormName : (view === 'update' ? 'Update ' + this.FormName : 'View ' + this.FormName);
      setTimeout(() => {
        this.isFormLoading = false
        this.cdr.detectChanges();
      }, 1000);
    } else {
      this.visible = true;
      this.postType = view;
      this.headerIcon = view === 'add' ? 'pi pi-plus' : (view === 'update' ? 'pi pi-pencil' : 'pi pi-eye');
      this.header = view === 'add' ? 'Add ' + this.FormName : (view === 'update' ? 'Update ' + this.FormName : 'View ' + this.FormName);
      this.selectedIndex = data;
      if (view === 'view') {
        this.activityMaster.disable();
        setTimeout(() => {
          this.isFormLoading = false
          this.cdr.detectChanges();
        }, 1000);
      }
      this.activityMaster.patchValue({
        activity: data.formName ? data.formName : '',
        formValue: data.formValue ? data.formValue : '',
        formType: data.formType ? data.formType : '',
      })
      setTimeout(() => {
        this.isFormLoading = false
        this.cdr.detectChanges();
      }, 1000);
    }
  }

  onSubmit(event: any) {
    if (!this.activityMaster.valid) {
      this.activityMaster.markAllAsTouched();
      return;
    }

    this.paramvaluedata = ``
    let activity = this.activityMaster.get('activity')?.value
    let formValue = this.activityMaster.get('formValue')?.value
    let formType = this.activityMaster.get('formType')?.value
    this.paramvaluedata = `activity=${activity}|formValue=${formValue}|formType=${formType}`
    this.openConfirmation('Confirm?', "Are you sure you want to proceed?", '1', '1', event);
  }


  openConfirmation(title: string, msg: string, id: any, option?: string, event?: any) {
    this.confirmationService.confirm({
      target: event?.target as EventTarget,
      message: msg,
      header: title,
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'No', severity: 'secondary', outlined: true },
      acceptButtonProps: { label: 'Yes' },
      accept: () => {
        if (option === '1') {
          //  this.submitcall();
        }
        else if (option === '2') {
          //  this.deleteData();
        } else if (option === '4') {

        } else if (option === '5') {

        }
      },
      reject: () => {
        if (option === '4') {
          // this.inputTypeData.patchValue({
          //   groupType: this.previousGroupType
          // })
        }
      }
    });
  }

  deleteItem(item: any) {
    this.selectedIndex = item;
    this.openConfirmation("Confirm", "Are you sure want to delete?", '1', '2');
  }

  // submitcall() {

  //   this.isFormLoading = true;
  //   // const roleID = JSON.parse(sessionStorage.getItem('currentRole') || '{}').roleId;
  //   let query = '';
  //   let SP = '';

  //   if (this.postType === 'update') {
  //     query = `action=UPDATE|id=${this.selectedIndex.activityId}|${this.paramvaluedata}|appUserId=${sessionStorage.getItem('userId')}`;
  //     SP = `uspPostAndUpdateActivityMaster`;
  //   }
  //   else {
  //     query = `action=ADD|id=0|${this.paramvaluedata}|appUserId=${sessionStorage.getItem('userId')}`;
  //     SP = `uspPostAndUpdateActivityMaster`;
  //   }

  //   this.userService.SubmitPostTypeData(SP, query, 'header').subscribe((datacom: any) => {
  //     this.isFormLoading = false;
  //     if (!datacom) return;
  //     const resultarray = datacom.split("-");
  //     if (resultarray[1] === "success") {
  //       this.getTableData(false);
  //       this.message.add({
  //         severity: 'success',
  //         summary: 'Success',
  //         detail: this.postType === 'update' ? 'Data Updated Successfully.' : 'Data Saved Successfully.',
  //       });
  //       this.onDrawerHide();
  //     }
  //     else if (resultarray[0] == "2") {
  //       this.message.add({ severity: 'warn', summary: 'Warn', detail: resultarray[1] || datacom });
  //     }
  //     else {
  //       this.message.add({ severity: 'warn', summary: 'Warn', detail: datacom, });
  //     }
  //   });

  // }

  // deleteData() {

  //   const roleID = JSON.parse(sessionStorage.getItem('currentRole') || '{}').roleId;
  //   let query = `action=DELETE|id=${this.selectedIndex.activityId}|activity=|formValue=|formType=|appUserId=${sessionStorage.getItem('userId')}`;
  //   this.userService.SubmitPostTypeData(`uspPostAndUpdateActivityMaster`, query, 'header').subscribe((datacom: any) => {
  //     this.isFormLoading = false;
  //     if (!datacom) return;
  //     const resultarray = datacom.split("-");
  //     if (resultarray[1] === "success") {
  //       this.getTableData(true);
  //       this.message.add({ severity: 'success', summary: 'Success', detail: 'Data deleted' });
  //       this.onDrawerHide();
  //     } else {
  //       this.message.add({ severity: 'warn', summary: 'Warn', detail: resultarray[1] || datacom, });
  //     }
  //   });
  // }







  isInvalid(field: string): boolean {
    const control = this.activityMaster.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
