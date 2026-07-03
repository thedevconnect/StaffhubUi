import { Component, ChangeDetectorRef, signal, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Popover } from 'primeng/popover';
import { Tooltip } from "primeng/tooltip";
import { ConfirmDialogModule } from 'primeng/confirmdialog';
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
import { AuthService } from '../../../shared/services/services/auth.service';

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
    ConfirmDialogModule,
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
export class RoleMaster implements OnInit {
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
    { key: 'roleName', header: 'Role Name', isVisible: true, isSortable: false },
    { key: 'roleCode', header: 'Role Code', isVisible: true, isSortable: false },
    { key: 'isActive', header: 'Status', isVisible: true, isSortable: false },
    { key: 'createdAt', header: 'Created Date', isVisible: true, isSortable: false },
  ];
  pageNo = 1;
  pageSize = 5;
  searchText = '';
  totalCount = 0;
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  statusOptions = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false }
  ];

  constructor(private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private confirmationService: ConfirmationService,
    private message: MessageService,
    private cdr: ChangeDetectorRef,
  ) {
    this.activityMaster = this.fb.group({
      roletype: ['', [Validators.required]],
      isActive: [true]
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

  getCompanyId(): number {
    const user = this.authService.user?.();
    if (user && (user as any).companyId) {
      return (user as any).companyId;
    }
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload && payload.companyId) {
          return payload.companyId;
        }
      }
    } catch (e) { }
    return 1;
  }

  getTableData(isTrue: boolean) {
    if (isTrue) {
      this.isLoading = true;
    } else {
      this.pageNo = 1;
    }
    this.userService.getRoles(this.pageNo, this.pageSize, this.searchText).subscribe({
      next: (res: any) => {
        this.data = res.roleTable || res.data || [];
        this.totalCount = res.total || res.meta?.total || 0;
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
    this.pageNo = 1;
    this.getTableData(true);
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
    document.body.style.overflow = 'visible';
    this.activityMaster.enable();
    this.visible = false;
    this.onClear();
  }
  onClear() {
    this.activityMaster.reset({
      roletype: '',
      isActive: true
    });
  }

  showDialog(view: string, data: any) {
    this.isFormLoading = true;
    this.visible = true;
    this.postType = view;
    this.header = view === 'add' ? 'Add' : (view === 'update' ? 'Update' : 'View');
    this.headerIcon = view === 'add' ? 'pi pi-plus' : (view === 'update' ? 'pi pi-pencil' : 'pi pi-eye');

    if (view === 'add') {
      this.activityMaster.reset({
        roletype: '',
        isActive: true
      });
      setTimeout(() => {
        this.isFormLoading = false;
        this.cdr.detectChanges();
      }, 300);
    } else {
      this.selectedIndex = data;
      if (view === 'view') {
        this.activityMaster.disable();
      } else {
        this.activityMaster.enable();
      }
      this.activityMaster.patchValue({
        roletype: data?.roleName ?? data?.RoleName ?? '',
        isActive: data?.isActive === 1 || data?.isActive === true || data?.IsActive === 1 || data?.IsActive === true
      });
      setTimeout(() => {
        this.isFormLoading = false;
        this.cdr.detectChanges();
      }, 300);
    }
  }

  getRoleId(item: any): number | string | null {
    return item?.id ?? item?.roleId ?? item?.RoleId ?? null;
  }

  openConfirmation(title: string, msg: string, id: any, option?: string, event?: any) {
    const confirmConfig: any = {
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
      }
    };

    if (event?.target) {
      confirmConfig.target = event.target;
    }

    this.confirmationService.confirm(confirmConfig);
  }

  deleteItem(item: any, event?: any) {
    this.selectedIndex = item;
    this.openConfirmation("Confirm", "Are you sure want to delete?", '1', '2', event);
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

    if (this.postType === 'update') {
      const roleId = this.getRoleId(this.selectedIndex);
      if (!roleId) {
        this.isFormLoading = false;
        this.message.add({ severity: 'error', summary: 'Error', detail: 'Role id not found for update.' });
        return;
      }

      const payload = {
        RoleName: this.activityMaster.get('roletype')?.value,
        IsActive: this.activityMaster.get('isActive')?.value ? 1 : 0
      };
      this.userService.updateRole(Number(roleId), payload).subscribe({
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
      const payload = {
        RoleName: this.activityMaster.get('roletype')?.value,
        CompanyId: this.getCompanyId()
      };
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
    const roleId = this.getRoleId(this.selectedIndex);
    if (!roleId) {
      this.message.add({ severity: 'error', summary: 'Error', detail: 'Role id not found for delete.' });
      return;
    }

    this.userService.deleteRole(Number(roleId)).subscribe({
      next: (res: any) => {
        this.getTableData(true);
        this.message.add({ severity: 'success', summary: 'Success', detail: 'Data Deleted Successfully.' });
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
