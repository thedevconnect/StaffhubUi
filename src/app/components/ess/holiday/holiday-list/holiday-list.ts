import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule
} from '@angular/forms';

import { AppBreadcrumb } from '../../../../shared/ui/breadcrumb/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';

import { MessageService, ConfirmationService } from 'primeng/api';
import { AttendanceService } from '../../../../shared/services/attendance.service';
import {
  TableColumn,
  TableTemplate
} from '../../../../shared/ui/table-template/table-template';

@Component({
  selector: 'app-holiday-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,

    CardModule,
    AppBreadcrumb,
    ButtonModule,
    TooltipModule,
    TableModule,
    DialogModule,
    DrawerModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
    ToastModule,
    ConfirmDialogModule,
    InputTextModule,

    TableTemplate
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './holiday-list.html',
  styleUrl: './holiday-list.scss',
})
export class HolidayList implements OnInit {
  pageNo = 1;
  pageSize = 10;
  totalCount = 0;
  searchText = '';

  holiday_calendar: any[] = [];

  showAssetDrawer = false;
  isEditMode = false;

  assetForm!: FormGroup;
  showDialog = false;
  isHoliday = false;
  loading = signal(false);

  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Holiday List', icon: 'pi pi-clock', routerLink: '/ess/holiday-list' }
  ];

  columns: TableColumn[] = [
    { key: 'holiday_date', header: 'Holiday Date', isVisible: true, isSortable: true },
    { key: 'holiday_name', header: 'Holiday Name', isVisible: true, isSortable: true },
    { key: 'holiday_type', header: 'Holiday Type', isVisible: true, isSortable: true },
    { key: 'region', header: 'Region', isVisible: true, isSortable: true },
    { key: 'is_active', header: 'Is Active', isVisible: true, isSortable: true },
    { key: 'created_at', header: 'Created At', isVisible: true, isSortable: true },
  ];

  rowActions = [
    { label: 'View', icon: 'pi pi-eye', id: 'view' },
    { label: 'Edit', icon: 'pi pi-pencil', id: 'edit' },
    { label: 'Delete', icon: 'pi pi-trash', id: 'delete' }
  ];

  constructor(
    private readonly user: AttendanceService,
    private readonly fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadAllData();
  }

  initForm(): void {
    this.assetForm = this.fb.group({
      EmployeeId: ['', Validators.required],
      Department: ['', Validators.required],
      AssetType: ['', Validators.required],
      AssetName: ['', Validators.required],
      AssignedDate: ['', Validators.required],
      OfficeLocationId: [''],
      OfficeLocation: [''],
      DeptRemarks: [''],
      EmployeeRemarks: ['']
    });
  }

  loadDashboardData(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loading.set(true);

    this.user.getHolidays(this.pageNo, this.pageSize, this.searchText).subscribe({
      next: (res: any) => {
        this.holiday_calendar = res?.holiday_calendar ?? [];
        this.totalCount = res?.totalCount ?? this.holiday_calendar.length;
        this.loading.set(false);

        console.log('Holiday Calendar:', this.holiday_calendar);
      },
      error: (err) => {
        console.error('Holiday API Error:', err);
        this.holiday_calendar = [];
        this.totalCount = 0;
        this.loading.set(false);
      }
    });
  }

  openAddDrawer(): void {
    this.showAssetDrawer = true;
    this.isEditMode = false;
    this.assetForm.reset();
  }

  saveAsset(): void {
    if (this.assetForm.invalid) {
      this.assetForm.markAllAsTouched();
      return;
    }

    console.log('Form Value:', this.assetForm.value);

    this.showAssetDrawer = false;
    this.isEditMode = false;
    this.assetForm.reset();
  }

  onPageChange(newPage: number): void {
    this.pageNo = newPage;
    this.loadAllData();
  }

  onSearchChange(value: string): void {
    this.searchText = value;
    this.pageNo = 1;
    this.loadAllData();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageNo = 1;
    this.loadAllData();
  }

  onSortChange(event: any): void {
    console.log('Sort Event', event);
  }


}