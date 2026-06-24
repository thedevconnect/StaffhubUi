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
import { TableColumn, TableTemplate } from '../../../shared/ui/table-template/table-template';
import { UserService } from '../../../shared/services/user-service';
@Component({
  selector: 'app-role-master',
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
  ],
  providers: [
    ConfirmationService,
    MessageService
  ],
  templateUrl: './role-master.html',
  styleUrl: './role-master.scss'
})
export class RoleMaster {
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
    { key: 'role', header: 'Role', isVisible: true, isSortable: false },
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
      roletype: ['', [Validators.required,]],
    });
  }

  get f() { return this.activityMaster.controls }

  ngOnInit(): void {
    this.getTableData(true);
    setTimeout(() => {
      this.isLoading = false;
      this.cdr.detectChanges();
    }, 1000);
  }

  getTableData(isTrue: boolean) {
  }


  // getTableData(isTrue: boolean) {
  //   try {
  //     if (isTrue) {
  //       this.isLoading = true;
  //     }
  //     else {
  //       this.pageNo = 1;
  //     }
  //     const query = `userID=${sessionStorage.getItem('userId')}|searchText=${this.searchText}|pageIndex=${this.pageNo}|size=${this.pageSize}`;
  //     this.userService.getQuestionPaper(`uspGetRoleMasterDetails|${query}`).subscribe({
  //       next: (res: any) => {
  //         try {
  //           setTimeout(() => {
  //             this.data = res?.table1 || [];
  //             this.totalCount = res?.table?.[0]?.totalCnt || this.data.length;
  //             this.cdr.detectChanges();
  //           }, 0);
  //         }
  //         catch (innerErr) {
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
  //         console.error('API call failed:=====', err);
  //         this.isLoading = false;
  //         if (err.status === 403) {
  //           this.Customvalidation.loginroute(err.status);
  //         } else {
  //           this.data = [];
  //           this.totalCount = 0;
  //         }
  //       }
  //     });
  //   }
  //   catch (error) {
  //     console.error('Unexpected error in getTableData():', error);
  //     this.isLoading = false;
  //     // this.data = [];
  //     // this.totalCount = 0;
  //     // sessionStorage.clear();
  //     // localStorage.clear();
  //     // this.router.navigate(['/login']);
  //   }
  // }


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
      this.header = view === 'add' ? 'Add' : (view === 'update' ? 'Update' : 'View');
      this.headerIcon = view === 'add' ? 'pi pi-plus' : (view === 'update' ? 'pi pi-pencil' : 'pi pi-eye');
      setTimeout(() => {
        this.isFormLoading = false
        this.cdr.detectChanges();
      }, 1000);
    } else {
      this.visible = true;
      this.postType = view;
      this.header = view === 'add' ? 'Add' : (view === 'update' ? 'Update' : 'View');
      this.headerIcon = view === 'add' ? 'pi pi-plus' : (view === 'update' ? 'pi pi-pencil' : 'pi pi-eye');
      this.selectedIndex = data;
      if (view === 'view') {
        this.activityMaster.disable();
        setTimeout(() => {
          this.isFormLoading = false
          this.cdr.detectChanges();
        }, 1000);
      }
      this.activityMaster.patchValue({
        roletype: data.role ? data.role : '',
      })
      setTimeout(() => {
        this.isFormLoading = false
        this.cdr.detectChanges();
      }, 1000);
    }
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
          ///  this.submitcall();
        }
        else if (option === '2') {
          //  this.deleteData();
        } else if (option === '4') {

        } else if (option === '5') {

        }
      },
      reject: () => {
        if (option === '4') {
        }
      }
    });
  }

  deleteItem(item: any) {
    this.selectedIndex = item;
    this.openConfirmation("Confirm", "Are you sure want to delete?", '1', '2');
  }


  onSubmit(event: any) {
    if (!this.activityMaster.valid) {
      this.activityMaster.markAllAsTouched();
      return;
    }
    this.paramvaluedata = ``
    let roletype = this.activityMaster.get('roletype')?.value
    this.paramvaluedata = `role=${roletype}`
    this.openConfirmation('Confirm?', "Are you sure you want to proceed?", '1', '1', event);
  }



  // submitcall() {
  //   this.isFormLoading = true;
  //   let query = '';
  //   let SP = '';

  //   if (this.postType === 'update') {
  //     query = `action=update|${this.paramvaluedata}|id=${this.selectedIndex.id}|userId=${sessionStorage.getItem('userId')}`;
  //     SP = `uspUpdateDeleteRoleMaster`;
  //   }
  //   else {
  //     query = `${this.paramvaluedata}|userID=${sessionStorage.getItem('userId')}`;
  //     SP = `uspPostRoleMaster`;
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
  //   let query = `action=Delete|id=${this.selectedIndex.id}|role=''|userId=${sessionStorage.getItem('userId')}`;
  //   this.userService.SubmitPostTypeData(`uspUpdateDeleteRoleMaster`, query, 'header').subscribe((datacom: any) => {
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
