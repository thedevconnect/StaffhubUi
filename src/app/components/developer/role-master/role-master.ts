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

  //  "Id": 2,
  //           "RoleId": 2,
  //           "RoleCode": "SUPER_ADMIN",
  //           "RoleName": "Super Admin",
  //           "RoleDescription": "Complete System",
  //           "IsActive": 1,
  //           "CreatedBy": 1,
  //           "CreatedAt": "2026-05-13T12:18:28.000Z",

  columns: TableColumn[] = [
    { key: 'actions', header: '⚙️', isVisible: true, isSortable: false, isCustom: true },
    { key: 'RoleName', header: 'Role Name', isVisible: true, isSortable: false },
    { key: 'RoleDescription', header: 'Role Description', isVisible: true, isSortable: false },
    { key: 'IsActive', header: 'Status', isVisible: true, isSortable: false },
    // createdby
    { key: 'CreatedBy', header: 'Created By', isVisible: true, isSortable: false },
    // createdat
    { key: 'CreatedAt', header: 'Created Date', isVisible: true, isSortable: false },
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
    if (isTrue) {
      this.isLoading = true;
    } else {
      this.pageNo = 1;
    }
    this.userService.getRoles(this.pageNo, this.pageSize, this.searchText).subscribe({
      next: (res: any) => {
        this.data = res.data || [];
        this.totalCount = res.meta?.total || 0;
        setTimeout(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }, 500);
      },
      error: (err) => {
        console.error('API call failed:', err);
        this.isLoading = false;
        this.data = [];
        this.totalCount = 0;
        this.cdr.detectChanges();
      }
    });
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
        roletype: data.role_name ? data.role_name : '',
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
          this.submitcall();
        }
        else if (option === '2') {
          this.deleteData();
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
    this.openConfirmation('Confirm?', "Are you sure you want to proceed?", '1', '1', event);
  }



  submitcall() {
    this.isFormLoading = true;

    const payload = {
      role_name: this.activityMaster.get('roletype')?.value,
    };

    if (this.postType === 'update') {
      this.userService.updateRole(this.selectedIndex.id, payload).subscribe({
        next: (res: any) => {
          this.isFormLoading = false;
          this.getTableData(false);
          this.message.add({ severity: 'success', summary: 'Success', detail: 'Data Updated Successfully.' });
          this.onDrawerHide();
        },
        error: (err) => {
          this.isFormLoading = false;
          this.message.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to update' });
        }
      });
    } else {
      this.userService.createRole(payload).subscribe({
        next: (res: any) => {
          this.isFormLoading = false;
          this.getTableData(false);
          this.message.add({ severity: 'success', summary: 'Success', detail: 'Data Saved Successfully.' });
          this.onDrawerHide();
        },
        error: (err) => {
          this.isFormLoading = false;
          this.message.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to save' });
        }
      });
    }
  }

  deleteData() {
    this.userService.deleteRole(this.selectedIndex.id).subscribe({
      next: (res: any) => {
        this.getTableData(true);
        this.message.add({ severity: 'success', summary: 'Success', detail: 'Data deleted' });
        this.onDrawerHide();
      },
      error: (err) => {
        this.message.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to delete' });
      }
    });
  }


  isInvalid(field: string): boolean {
    const control = this.activityMaster.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
