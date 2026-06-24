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
import { MultiSelectModule } from 'primeng/multiselect';
import { TableColumn, TableTemplate } from '../../../shared/ui/table-template/table-template';
import { UserService } from '../../../shared/services/user-service';

interface DropdownItem {
  drpOption: string;
  drpValue: number | string;
}

@Component({
  selector: 'app-role-activity-mapping',
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
    MultiSelectModule,
    Toast,
    Tooltip,
  ],
  providers: [
    ConfirmationService,
    MessageService
  ],
  templateUrl: './role-activity-mapping.html',
  styleUrl: './role-activity-mapping.scss'
})

export class RoleActivityMapping {
  isLoading = true;
  visible: boolean = false;
  postType: string = '';
  header: any = '';
  selectedIndex: any = [];
  headerIcon: string = 'pi pi-plus';
  paramvaluedata: string = '';
  isFormLoading: boolean = false;
  data: any[] = [];
  groupMasterForm1: FormGroup;
  groupListArray = []
  totalCount = 0;

  columns: TableColumn[] = [
    { key: 'actions', header: '⚙️', isVisible: true, isSortable: false, isCustom: true, },
    { key: 'role', header: 'Role', isVisible: true, isSortable: false },
    { key: 'menu', header: 'Menu', isVisible: true, isSortable: false },
    { key: 'subMenu', header: 'Sub Menu', isVisible: true, isSortable: false },
    { key: 'activity', header: 'Activity', isVisible: true, isSortable: false },
  ];


  pageNo = 1;
  pageSize = 5;
  searchText = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  menuDrp: any = []
  subMenuDrp: any = []
  roleDrp: any = []
  activityDrp: any = []

  previousGroupType: any;
  selectedrowIndex: any
  itemDailog: boolean = false


  constructor(private fb: FormBuilder,
    private userService: UserService,
    private confirmationService: ConfirmationService,
    private message: MessageService,
    private cdr: ChangeDetectorRef) {

    this.groupMasterForm1 = this.fb.group({
      role: ['', Validators.required],
      menu: ['', Validators.required],
      submenu: ['', Validators.required],
      activity: ['', Validators.required],
    });

  }

  get f() { return this.groupMasterForm1.controls }

  ngOnInit(): void {
    this.getTableData(true);
    // this.getRole()
    // this.getMenuMaster()
    // this.getActivityMAster();
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  // getRole() {
  //   setTimeout(() => {
  //     this.isLoading = false;
  //     this.cdr.detectChanges();
  //   }, 1000);
  //   const userid = sessionStorage.getItem('userId') || '';
  //   this.userService.getQuestionPaper(`uspGetRoleMaster|userID=${userid}`).subscribe((res: any) => {
  //     this.roleDrp = res['table']
  //   })
  //   setTimeout(() => {
  //     this.isLoading = false;
  //     this.cdr.detectChanges();
  //   }, 1000);
  // }

  // getMenuMaster() {
  //   setTimeout(() => {
  //     this.isLoading = false;
  //     this.cdr.detectChanges();
  //   }, 1000);
  //   const userid = sessionStorage.getItem('userId') || '';
  //   this.userService.getQuestionPaper(`uspGetMenuMaster|userID=${userid}`).subscribe((res: any) => {
  //     this.menuDrp = res['table']
  //   })
  //   setTimeout(() => {
  //     this.isLoading = false;
  //     this.cdr.detectChanges();
  //   }, 1000);
  // }


  // getSubMenu(event: any) {
  //   const selectedValue = event?.value;
  //   console.log("selectedValue====", selectedValue);

  //   const userid = sessionStorage.getItem('userId') || '';
  //   setTimeout(() => {
  //     this.isLoading = false;
  //     this.cdr.detectChanges();
  //   }, 1000);
  //   this.userService.getQuestionPaper(`uspGetSubMenuMaster|userID=${userid}|menuId=${selectedValue}`).subscribe((res: any) => {
  //     this.subMenuDrp = res['table'];
  //   })
  //   setTimeout(() => {
  //     this.isLoading = false;
  //     this.cdr.detectChanges();
  //   }, 1000);
  // }


  // getActivityMAster() {
  //   const userid = sessionStorage.getItem('userId') || '';
  //   setTimeout(() => {
  //     this.isLoading = false;
  //     this.cdr.detectChanges();
  //   }, 1000);
  //   this.userService.getQuestionPaper(`uspGetActivityMaster|userID=${userid}`).subscribe((res: any) => {
  //     this.activityDrp = res['table'];
  //   })
  //   setTimeout(() => {
  //     this.isLoading = false;
  //     this.cdr.detectChanges();
  //   }, 1000);
  // }


  // getTableData(isTrue: boolean) {
  //   try {
  //     if (isTrue) {
  //       this.isLoading = true;
  //     }
  //     else {
  //       this.pageNo = 1;
  //     }
  //     const districtId = sessionStorage.getItem('District') || '';
  //     const userId = sessionStorage.getItem('userId') || '';
  //     const query = `userID=${userId}|searchText=${this.searchText}|pageIndex=${this.pageNo}|size=${this.pageSize}|districtId=${districtId}`;
  //     this.userService.getQuestionPaper(`uspGetUserRoleActivityMapping|${query}`).subscribe({
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


  showDialog(view: string, data: any) {
    this.selectedIndex = data;
    this.visible = true;
    this.postType = view;
    this.header = view === 'add' ? 'Add' : view === 'update' ? 'Update' : 'View';
    this.headerIcon = view === 'add' ? 'pi pi-plus' : view === 'update' ? 'pi pi-pencil' : 'pi pi-eye';

    if (view === 'add') {
      this.groupMasterForm1.reset();
      this.groupMasterForm1.enable();
    }
    else {
      if (view === 'view') {
        this.groupMasterForm1.disable();
      }
      else {
        this.groupMasterForm1.enable();
      }

      // const userObj = this.userDrp.find(
      //   (x: any) => String(x.drpValue) === String(data.userId)
      // );

      // const roleObj = this.roleDrp.find(
      //   (x: any) => String(x.drpValue) === String(data.roleId)
      // );

      this.groupMasterForm1.patchValue({
        role: data?.roleId ? data?.roleId : '',
        menu: data?.menuId ? data?.menuId : '',
        submenu: data?.subMenuId ? data?.subMenuId : '',
        activity: data?.activityId ? data?.activityId : '',
      });
    }
    document.body.style.overflow = 'hidden'; // prevent background scroll
  }


  isInvalid(field: string): boolean {
    const control = this.groupMasterForm1.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getTableData(isTrue: boolean) {

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


  deleteItem(item: any) {
    this.selectedIndex = item;
    this.openConfirmation("Confirm", "Are you sure want to delete?", '1', '2');
  }

  onDrawerHide() {
    document.body.style.overflow = 'visible'; // restore scroll
    this.groupMasterForm1.enable()
    this.groupMasterForm1.reset()
    this.groupMasterForm1.patchValue({
      userType: '',
      userRole: '',
    });
    this.visible = false;
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
          this.submitcall();
        }
        else if (option === '2') {
          this.deleteData();
        }
        else if (option === '4') {
          // this.childArrData = []
        }
        else if (option === '5') {
          this.groupMasterForm1.reset()
        }
      },
      reject: () => {
        if (option === '4') {
          this.groupMasterForm1.patchValue({
            groupType: this.previousGroupType
          })
        }
      }
    });
  }

  onClear() {
    this.groupMasterForm1.reset();
  }


  onSubmit(event: any) {
    if (!this.groupMasterForm1.valid) {
      this.groupMasterForm1.markAllAsTouched();
      return;
    }

    const role = this.groupMasterForm1.get('role')?.value || 0;
    const menu = this.groupMasterForm1.get('menu')?.value || 0;
    const submenu = this.groupMasterForm1.get('submenu')?.value || 0;
    const activity = this.groupMasterForm1.get('activity')?.value || 0;

    this.paramvaluedata = `roleId=${role}|menuID=${menu}|subMenuID=${submenu}|activityID=${activity}`;
    this.openConfirmation('Confirm?', 'Are you sure you want to proceed?', '1', '1', event);

  }


  submitcall() {
    try {
      this.isFormLoading = true;
      let query = '';
      let SP = '';
      const districtId = sessionStorage.getItem('District') || '';

      if (this.postType === 'update') {
        query = `${this.paramvaluedata}|action=update|Id=${this.selectedIndex.id}|userId=${sessionStorage.getItem('userId')}`;
        SP = `uspUpdateDeletetblUserRoleActivityMapping`;
      }
      else {
        query = `${this.paramvaluedata}|userID=${sessionStorage.getItem('userId')}|districtId=${districtId}`;
        SP = `uspPostUserRoleActivityMapping`;
      }
      // this.userService.SubmitPostTypeData(SP, query, 'header').subscribe({
      //   next: (datacom: any) => {
      //     this.isFormLoading = false;
      //     try {
      //       if (!datacom) return;
      //       const resultarray = datacom.split('-');
      //       if (resultarray[1] === 'success') {
      //         this.getTableData(false);
      //         this.message.add({
      //           severity: 'success',
      //           summary: 'Success',
      //           detail: this.postType === 'update' ? 'Data Updated Successfully.' : 'Data Saved Successfully.',
      //           life: 3000
      //         });
      //         this.onDrawerHide();
      //       } else {
      //         this.message.add({
      //           severity: 'warn',
      //           summary: 'Warning',
      //           detail: resultarray[1] || datacom,
      //           life: 3000
      //         });
      //       }
      //     } catch (innerErr) {
      //       console.error('Error processing response:', innerErr);
      //       this.message.add({
      //         severity: 'error',
      //         summary: 'Error',
      //         detail: 'Something went wrong while processing response.',
      //         life: 3000
      //       });
      //     }
      //   },
      //   error: (err) => {
      //     this.isFormLoading = false;
      //     console.error('API call failed:', err);

      //     if (err.status === 401 || err.status === 403) {
      //       console.warn('Unauthorized or Forbidden - redirecting to login...');
      //       this.message.add({
      //         severity: 'error',
      //         summary: 'Session Expired',
      //         detail: 'Your session has expired. Please log in again.',
      //         life: 3000
      //       });
      //       this.Customvalidation.loginroute(err.status);
      //     } else {
      //       this.message.add({
      //         severity: 'error',
      //         summary: 'Error',
      //         detail: 'Something went wrong.',
      //         life: 3000
      //       });
      //     }
      //   }
      // });

    } catch (error) {
      console.error('Unexpected error in submitcall():', error);
      this.isFormLoading = false;
      this.message.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Something went wrong',
        life: 3000
      });
      // sessionStorage.clear();
      // localStorage.clear();
      // this.router.navigate(['/login']);
    }
  }


  deleteData() {
    try {
      this.isFormLoading = true;
      let query = `action=delete|Id=${this.selectedIndex.id}|menuID=0|subMenuID=0|activityID=0|roleId=0|userId=${sessionStorage.getItem('userId')}`;
      // this.userService.SubmitPostTypeData(`uspUpdateDeletetblUserRoleActivityMapping`, query, 'header').subscribe({
      //   next: (datacom: any) => {
      //     this.isFormLoading = false;
      //     try {
      //       if (!datacom) return;
      //       const resultarray = datacom.split('-');
      //       if (resultarray[1] === 'success') {
      //         this.pageNo = 1;
      //         this.getTableData(true);
      //         this.message.add({
      //           severity: 'success',
      //           summary: 'Success',
      //           detail: 'Data deleted successfully.',
      //           life: 3000
      //         });
      //         this.onDrawerHide();
      //       } else {
      //         this.message.add({
      //           severity: 'warn',
      //           summary: 'Warning',
      //           detail: resultarray[1] || datacom,
      //           life: 3000
      //         });
      //       }
      //     } catch (innerErr) {
      //       console.error('Error processing response:', innerErr);
      //       this.message.add({
      //         severity: 'error',
      //         summary: 'Error',
      //         detail: 'Something went wrong while processing response.',
      //         life: 3000
      //       });
      //     }
      //   },
      //   error: (err) => {
      //     this.isFormLoading = false;
      //     console.error('API call failed:', err);
      //     if (err.status === 401 || err.status === 403) {
      //       this.message.add({
      //         severity: 'error',
      //         summary: 'Session Expired',
      //         detail: 'Your session has expired. Please log in again.',
      //         life: 3000
      //       });
      //       this.Customvalidation.loginroute(err.status);
      //     } else {
      //       this.message.add({
      //         severity: 'error',
      //         summary: 'Error',
      //         detail: 'Failed to delete data. Please try again later.',
      //         life: 3000
      //       });
      //     }
      //   }
      // });

    } catch (error) {
      console.error('Unexpected error in deleteData():', error);
      this.isFormLoading = false;
      // this.message.add({
      //   severity: 'error',
      //   summary: 'Error',
      //   detail: 'Unexpected error occurred. Please log in again.',
      //   life: 3000
      // });
      // sessionStorage.clear();
      // localStorage.clear();
      // this.router.navigate(['/login']);
    }
  }


  onDeleteRow(data: any, index: number) {
    this.selectedrowIndex = index
    this.openConfirmation("Confirm", "Are you sure want to delete?", '1', '5');
  }


  showGrouplist(data: any) {
    this.itemDailog = true;
    try {
      const custArray = JSON.parse(data?.customerDetails || '[]');
      this.groupListArray = custArray.flatMap((c: any) => c.ct.map((x: any) => ({
        CustomerId: x.CustomerId,
        CustomerValue: x.CustomerValue
      })));
    } catch (e) {
      console.error('Error parsing customerDetails', e);
      this.groupListArray = [];
    }
  }

}
