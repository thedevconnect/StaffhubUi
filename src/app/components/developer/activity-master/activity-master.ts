import { Component, ChangeDetectorRef, signal, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
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
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TableColumn, TableTemplate } from '../../../shared/ui/table-template/table-template';
import { UserService } from '../../../shared/services/user-service';

@Component({
  selector: 'app-activity-master',
  standalone: true,
  imports: [
    TableTemplate,
    CardModule,
    ButtonModule,
    DrawerModule,
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    SelectModule,
    DatePickerModule,
    ConfirmDialog,
    ProgressSpinner,
    Toast,
    Tooltip,
    BreadcrumbModule,
    ToggleSwitchModule
  ],
  providers: [
    ConfirmationService,
    MessageService
  ],
  templateUrl: './activity-master.html',
  styleUrl: './activity-master.scss'
})
export class ActivityMaster implements OnInit {
  isLoading = true;
  visible: boolean = false;
  postType: string = '';
  header: any = '';
  selectedIndex: any = null;
  headerIcon: string = 'pi pi-plus';
  isFormLoading: boolean = false;
  data: any[] = [];
  activeMenus: any[] = [];
  activityMaster: FormGroup;

  columns: TableColumn[] = [
    { key: 'activity_name', header: 'Activity Name', isVisible: true, isSortable: true },
    { key: 'menuName', header: 'Parent Menu', isVisible: true, isSortable: true },
    { key: 'form_value', header: 'Form Value', isVisible: true, isSortable: true },
    { key: 'calling_page', header: 'Calling Page', isVisible: true, isSortable: true },
    { key: 'actions', header: 'Actions', isVisible: true, isSortable: false, isCustom: true }
  ];

  pageNo = 1;
  pageSize = 10;
  searchText = '';
  totalCount = 0;
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  menulabel: string = 'Developer';
  breadcrumbItems: any[] = [];
  FormName: string = 'Activity Master';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private confirmationService: ConfirmationService,
    private message: MessageService,
    private cdr: ChangeDetectorRef,
  ) {
    this.activityMaster = this.fb.group({
      menuId: ['', Validators.required],
      activity: ['', Validators.required],
      formValue: ['', Validators.required],
      callingPage: [''],
      menuFlag: ['Y'],
      iconClass: ['pi pi-cog'],
      isActive: [true]
    });
  }

  get f() { return this.activityMaster.controls; }

  ngOnInit(): void {
    this.loadActiveMenus();
    this.getTableData(true);

    const paramStr = sessionStorage.getItem('menuItem');
    if (paramStr) {
      try {
        const p = JSON.parse(paramStr);
        this.menulabel = p.menu || 'Developer';
        this.FormName = p.formName || 'Activity Master';
      } catch (e) {}
    }

    this.breadcrumbItems = [
      { label: 'Developer', icon: 'pi pi-code', routerLink: '/developer' },
      { label: this.FormName || 'Activity Master' }
    ];
  }

  loadActiveMenus(): void {
    this.userService.getActiveMenus().subscribe({
      next: (res: any) => {
        const rawMenus = Array.isArray(res) ? res : (res.data || res.data || []);
        this.activeMenus = rawMenus.map((m: any) => ({
          label: m.menuName || m.menu_name || m.title,
          value: m.id || m.menu_id
        }));
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load active menus:', err);
      }
    });
  }

  getTableData(isTrue: boolean): void {
    if (isTrue) {
      this.isLoading = true;
    } else {
      this.pageNo = 1;
    }
    this.cdr.markForCheck();

    this.userService.getActivities(this.pageNo, this.pageSize, this.searchText).subscribe({
      next: (res: any) => {
        this.data = res.data || [];
        this.totalCount = res.total || (res.data ? res.data.length : 0);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('API call failed:', err);
        this.isLoading = false;
        this.data = [];
        this.totalCount = 0;
        this.cdr.markForCheck();
      }
    });
  }

  onPageChange(newPage: number): void {
    this.pageNo = newPage;
    this.getTableData(true);
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.pageNo = 1;
    this.getTableData(true);
  }

  onSearchChange(search: string): void {
    this.searchText = search;
    this.pageNo = 1;
    this.getTableData(false);
  }

  onSortChange(event: { column: string, direction: 'asc' | 'desc' }): void {
    this.sortColumn = event.column;
    this.sortDirection = event.direction;
    this.getTableData(true);
  }

  onDrawerHide(): void {
    document.body.style.overflow = 'visible';
    this.activityMaster.enable();
    this.visible = false;
    this.onClear();
  }

  onClear(): void {
    this.activityMaster.reset({
      menuId: '',
      activity: '',
      formValue: '',
      callingPage: '',
      menuFlag: 'Y',
      iconClass: 'pi pi-cog',
      isActive: true
    });
  }

  showDialog(view: string, data: any): void {
    this.isFormLoading = true;
    this.visible = true;
    this.postType = view;
    this.headerIcon = view === 'add' ? 'pi pi-plus' : (view === 'update' ? 'pi pi-pencil' : 'pi pi-eye');
    this.header = view === 'add' ? 'Add Activity' : (view === 'update' ? 'Edit Activity' : 'View Activity Details');

    if (view === 'add') {
      this.activityMaster.enable();
      this.onClear();
      setTimeout(() => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
      }, 200);
    } else {
      this.selectedIndex = data;
      if (view === 'view') {
        this.activityMaster.disable();
      } else {
        this.activityMaster.enable();
      }

      this.activityMaster.patchValue({
        menuId: data.menu_id ? Number(data.menu_id) : '',
        activity: data.activity_name || '',
        formValue: data.form_value || '',
        callingPage: data.calling_page || '',
        menuFlag: data.menu_flag || 'Y',
        iconClass: data.icon_class || 'pi pi-cog',
        isActive: data.is_active !== undefined ? !!data.is_active : true
      });

      setTimeout(() => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
      }, 200);
    }
  }

  onSubmit(event: any): void {
    if (!this.activityMaster.valid) {
      this.activityMaster.markAllAsTouched();
      this.message.add({ severity: 'warn', summary: 'Validation', detail: 'Please fill all required fields.' });
      return;
    }
    this.openConfirmation('Confirm Action', `Are you sure you want to ${this.postType === 'add' ? 'create' : 'update'} this activity?`, '1', '1', event);
  }

  openConfirmation(title: string, msg: string, id: any, option?: string, event?: any): void {
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
        } else if (option === '2') {
          this.deleteData();
        }
      }
    });
  }

  deleteItem(item: any): void {
    this.selectedIndex = item;
    this.openConfirmation("Delete Activity", `Are you sure you want to delete "${item.activity_name}"?`, '1', '2');
  }

  submitcall(): void {
    this.isFormLoading = true;
    const val = this.activityMaster.value;

    const payload = {
      menu_id: Number(val.menuId),
      activity_name: val.activity,
      form_value: val.formValue,
      calling_page: val.callingPage || val.formValue,
      menu_flag: val.menuFlag || 'Y',
      icon_class: val.iconClass || 'pi pi-cog',
      is_active: val.isActive ? 1 : 0
    };

    if (this.postType === 'update') {
      this.userService.updateActivity(this.selectedIndex.id, payload).subscribe({
        next: (res: any) => {
          this.isFormLoading = false;
          this.getTableData(false);
          this.message.add({ severity: 'success', summary: 'Success', detail: 'Activity Updated Successfully.' });
          this.onDrawerHide();
        },
        error: (err) => {
          this.isFormLoading = false;
          this.message.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to update activity' });
        }
      });
    } else {
      this.userService.createActivity(payload).subscribe({
        next: (res: any) => {
          this.isFormLoading = false;
          this.getTableData(false);
          this.message.add({ severity: 'success', summary: 'Success', detail: 'Activity Created Successfully.' });
          this.onDrawerHide();
        },
        error: (err) => {
          this.isFormLoading = false;
          this.message.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to create activity' });
        }
      });
    }
  }

  deleteData(): void {
    if (!this.selectedIndex?.id) return;
    this.userService.deleteActivity(this.selectedIndex.id).subscribe({
      next: (res: any) => {
        this.getTableData(true);
        this.message.add({ severity: 'success', summary: 'Success', detail: 'Activity deleted successfully' });
        this.onDrawerHide();
      },
      error: (err) => {
        this.message.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to delete activity' });
      }
    });
  }

  isInvalid(field: string): boolean {
    const control = this.activityMaster.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
