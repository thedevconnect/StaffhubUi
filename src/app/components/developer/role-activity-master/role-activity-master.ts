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
  selector: 'app-role-activity-master',
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
  templateUrl: './role-activity-master.html',
  styleUrl: './role-activity-master.scss'
})
export class RoleActivityMaster {

  isLoading = true;
  visible: boolean = false;
  postType: string = '';
  header: any = '';
  selectedIndex: any = [];
  headerIcon: string = 'pi pi-plus';
  paramvaluedata: string = '';
  isFormLoading: boolean = false;
  data: any[] = [];
  roleActivityMaster: FormGroup;


  columns: TableColumn[] = [
    { key: 'actions', header: '⚙️', isVisible: true, isSortable: false, isCustom: true },
    { key: 'role', header: 'Role', isVisible: true, isSortable: false },
    { key: 'menu', header: 'Menu', isVisible: true, isSortable: false },
    { key: 'subMenu', header: 'Sub Menu', isVisible: true, isSortable: false },
    { key: 'activity', header: 'Activity', isVisible: true, isSortable: false },

    // { key: 'activity', header: 'Activity', isVisible: true, isSortable: false },

    // { key: 'activity', header: 'Activity', isVisible: true, isSortable: false },


    // { key: 'activity', header: 'Activity', isVisible: true, isSortable: false },

    // { key: 'activity', header: 'Activity', isVisible: true, isSortable: false },


  ];


  pageNo = 1;
  pageSize = 5;
  searchText = '';
  totalCount = 0;
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  roleDrp = []
  menuDrp = []
  subMenuDrp = []
  activityDrp = []


  constructor(private fb: FormBuilder,
    private userService: UserService,
    private confirmationService: ConfirmationService,
    private message: MessageService,
    private cdr: ChangeDetectorRef,
  ) {
    this.roleActivityMaster = this.fb.group({
      role: ['', Validators.required],
      menu: ['', Validators.required],
      subMenu: [''],
      activity: ['', Validators.required],
    });
  }

  get f() { return this.roleActivityMaster.controls }

  menulabel: string = '';
  breadcrumbItems: any[] = [];
  FormName: string = '';
  ngOnInit(): void {
    // this.getDrp('ROLEMASTER')
    // this.getDrp('MENUMASTER')
    // this.getDrp('ACTIVITYMASTER')
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


  // getDrp(action: string) {
  //   this.userService.getQuestionPaper(`uspGetUserMastersDropdown|action=${action}|id=0|appUserId=${sessionStorage.getItem('userId')}`).subscribe({
  //     next: (res: any) => {
  //       if (action == 'ROLEMASTER') {
  //         this.roleDrp = res['table']
  //       } else if (action == 'MENUMASTER') {
  //         this.menuDrp = res['table']
  //       } else if (action == 'ACTIVITYMASTER') {
  //         this.activityDrp = res['table']
  //       }
  //     }, error: (err) => {
  //       if (err.status === 403) {
  //         this.Customvalidation.loginroute(err.status);
  //       }
  //     }
  //   }
  //   )
  // }

  // getSubMenu() {
  //   try {
  //     let menuId = this.roleActivityMaster.get('menu')?.value.drpValue ? this.roleActivityMaster.get('menu')?.value.drpValue : 0
  //     this.roleActivityMaster.patchValue({
  //       subMenu: ''
  //     })
  //     this.userService.getQuestionPaper(`uspGetUserMastersDropdown|action=SUBMENUMASTER|id=${menuId}|appUserId=${sessionStorage.getItem('userId')}`).subscribe({
  //       next: (res: any) => {
  //         this.subMenuDrp = res['table']
  //       }, error: (err) => {
  //         if (err.status === 403) {
  //           this.Customvalidation.loginroute(err.status);
  //         }
  //       }
  //     }
  //     )
  //   } catch (err: any) {
  //     this.subMenuDrp = []
  //     if (err.status === 403) {
  //       this.Customvalidation.loginroute(err.status);
  //     }
  //   }

  // }

  getTableData(isTrue: boolean) {

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
  //     this.userService.getQuestionPaper(`uspGetRoleActivityMaster|${query}`).subscribe({
  //       next: (res: any) => {
  //         try {
  //           this.data = res?.table1 || [];
  //           this.totalCount = res?.table?.[0]?.totalCnt || this.data.length;
  //           this.cdr.detectChanges();
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
    this.roleActivityMaster.enable()
    this.visible = false;
    this.onClear()
  }
  onClear() {
    this.roleActivityMaster.reset()
    this.subMenuDrp = []
  }

  showDialog(view: string, data: any) {
    this.isFormLoading = true
    if (view == 'add') {
      this.visible = true;
      this.postType = view;
      this.headerIcon = view === 'add' ? 'pi pi-plus' : (view === 'update' ? 'pi pi-pencil' : 'pi pi-eye');
      this.header = view === 'add' ? this.FormName : (view === 'update' ? this.FormName : this.FormName);
      setTimeout(() => {
        this.isFormLoading = false
        this.cdr.detectChanges();
      }, 1000);
    } else {
      this.visible = true;
      this.postType = view;
      this.headerIcon = view === 'add' ? 'pi pi-plus' : (view === 'update' ? 'pi pi-pencil' : 'pi pi-eye');
      this.header = view === 'add' ? this.FormName : (view === 'update' ? this.FormName : this.FormName);
      this.selectedIndex = data;
      if (view === 'view') {
        this.roleActivityMaster.disable();
        setTimeout(() => {
          this.isFormLoading = false
          this.cdr.detectChanges();
        }, 1000);
      }
      this.roleActivityMaster.patchValue({
        role: data.roleId ? { drpValue: data.roleId, drpOption: data.role } : '',
        menu: data.menuid ? { drpValue: data.menuid, drpOption: data.menu } : '',
        subMenu: data.subMenuId ? { drpValue: data.subMenuId, drpOption: data.subMenu } : '',
        activity: data.activityId ? { drpValue: data.activityId, drpOption: data.activity } : '',
      })
      // this.getSubMenu()
      setTimeout(() => {
        this.isFormLoading = false
        this.cdr.detectChanges();
      }, 1000);
    }
  }

  deleteItem(item: any) {
    this.selectedIndex = item;
    this.openConfirmation("Confirm", "Are You Sure Want To Delete?", '1', '2');
  }
  onSubmit(event: any) {

  }

  // onSubmit(event: any) {
  //   if (!this.roleActivityMaster.valid) {
  //     this.roleActivityMaster.markAllAsTouched();
  //     return;
  //   }
  //   this.paramvaluedata = ``
  //   let role = this.roleActivityMaster.get('role')?.value.drpValue
  //   let menu = this.roleActivityMaster.get('menu')?.value.drpValue
  //   let subMenu = this.roleActivityMaster.get('subMenu')?.value ? this.roleActivityMaster.get('subMenu')?.value.drpValue : 0
  //   let activity = this.roleActivityMaster.get('activity')?.value.drpValue
  //   this.paramvaluedata = `roleId=${role}|menuId=${menu}|subMenuId=${subMenu}|activityId=${activity}|viewBtn=0|editBtn=0|activeBtn=0|deleteBtn=0`
  //   this.openConfirmation('Confirm?', "Are you sure you want to proceed?", '1', '1', event);
  // }
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
          // this.submitcall();
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
  // submitcall() {
  //   try {
  //     this.isFormLoading = true;
  //     const currentRole = JSON.parse(sessionStorage.getItem('currentRole') || '{}');
  //     const roleID = currentRole?.roleId || '';
  //     const userId = sessionStorage.getItem('userId') || '';
  //     let query = '';
  //     let SP = '';
  //     if (this.postType === 'update') {
  //       query = `action=UPDATE|${this.paramvaluedata}|id=${this.selectedIndex.id}|appUserId=${userId}`;
  //       SP = `uspPostAndUpdateRoleActivityMaster`;
  //     } else {
  //       query = `action=ADD|id=0|${this.paramvaluedata}|appUserId=${userId}`;
  //       SP = `uspPostAndUpdateRoleActivityMaster`;
  //     }
  //     this.userService.SubmitPostTypeData(SP, query, 'header').subscribe({
  //       next: (datacom: any) => {
  //         this.isFormLoading = false;
  //         try {
  //           if (!datacom) return;
  //           const resultarray = datacom.split('-');
  //           if (resultarray[1] === 'success') {
  //             this.getTableData(false);
  //             this.message.add({
  //               severity: 'success',
  //               summary: 'Success',
  //               detail: this.postType === 'update' ? 'Data Updated Successfully.' : 'Data Saved Successfully.',
  //               life: 3000
  //             });
  //             this.onDrawerHide();
  //           } else {
  //             this.message.add({
  //               severity: 'warn',
  //               summary: 'Warning',
  //               detail: resultarray[1] || datacom,
  //               life: 3000
  //             });
  //           }
  //         } catch (innerErr) {
  //           console.error('Error processing response:', innerErr);
  //           this.message.add({
  //             severity: 'error',
  //             summary: 'Error',
  //             detail: 'Something went wrong while processing response.',
  //             life: 3000
  //           });
  //         }
  //       },

  //     });

  //   } catch (error) {
  //     console.error('Unexpected error in submitcall():', error);
  //     this.isFormLoading = false;
  //     this.message.add({
  //       severity: 'error',
  //       summary: 'Error',
  //       detail: 'Something went wrong',
  //       life: 3000
  //     });
  //     // sessionStorage.clear();
  //     // localStorage.clear();
  //     // this.router.navigate(['/login']);
  //   }
  // }



  // deleteData() {
  //   try {
  //     this.isFormLoading = true;
  //     const currentRole = JSON.parse(sessionStorage.getItem('currentRole') || '{}');
  //     const roleID = currentRole?.roleId || '';
  //     const userId = sessionStorage.getItem('userId') || '';
  //     const query = `action=DELETE|id=${this.selectedIndex.id}|roleId=0|menuId=0|subMenuId=0|activityId=0|viewBtn=0|editBtn=0|activeBtn=0|deleteBtn=0|appUserId=${userId}`;
  //     this.userService.SubmitPostTypeData(`uspPostAndUpdateRoleActivityMaster`, query, 'header').subscribe({
  //       next: (datacom: any) => {
  //         this.isFormLoading = false;
  //         try {
  //           if (!datacom) return;
  //           const resultarray = datacom.split('-');
  //           if (resultarray[1] === 'success') {
  //             this.getTableData(true);
  //             this.message.add({
  //               severity: 'success',
  //               summary: 'Success',
  //               detail: 'Data deleted successfully.',
  //               life: 3000
  //             });
  //             this.onDrawerHide();
  //           } else {
  //             this.message.add({
  //               severity: 'warn',
  //               summary: 'Warning',
  //               detail: resultarray[1] || datacom,
  //               life: 3000
  //             });
  //           }
  //         } catch (innerErr) {
  //           console.error('Error processing response:', innerErr);
  //           this.message.add({
  //             severity: 'error',
  //             summary: 'Error',
  //             detail: 'Something went wrong while processing response.',
  //             life: 3000
  //           });
  //         }
  //       },
  //       error: (err) => {
  //         this.isFormLoading = false;
  //         console.error('API call failed:', err);
  //         if (err.status === 401 || err.status === 403) {
  //           this.message.add({
  //             severity: 'error',
  //             summary: 'Session Expired',
  //             detail: 'Your session has expired. Please log in again.',
  //             life: 3000
  //           });
  //           this.Customvalidation.loginroute(err.status);
  //         } else {
  //           this.message.add({
  //             severity: 'error',
  //             summary: 'Error',
  //             detail: 'Failed to delete data. Please try again later.',
  //             life: 3000
  //           });
  //         }
  //       }
  //     });

  //   } catch (error) {
  //     console.error('Unexpected error in deleteData():', error);
  //     this.isFormLoading = false;
  //     // this.message.add({
  //     //   severity: 'error',
  //     //   summary: 'Error',
  //     //   detail: 'Unexpected error occurred. Please log in again.',
  //     //   life: 3000
  //     // });
  //     // sessionStorage.clear();
  //     // localStorage.clear();
  //     // this.router.navigate(['/login']);
  //   }
  // }





  isInvalid(field: string): boolean {
    const control = this.roleActivityMaster.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}



