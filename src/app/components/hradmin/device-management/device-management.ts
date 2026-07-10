import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableTemplate, TableColumn } from '../../../shared/ui/table-template/table-template';
import { DeviceService, DeviceStatus } from '../../../shared/services/device.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { BreadcrumbModule } from 'primeng/breadcrumb';

@Component({
  selector: 'app-device-management',
  standalone: true,
  imports: [
    CommonModule,
    TableTemplate,
    ToastModule,
    ConfirmDialogModule,
    ButtonModule,
    TooltipModule,
    BreadcrumbModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './device-management.html',
  styleUrl: './device-management.scss'
})
export class DeviceManagement implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly deviceService = inject(DeviceService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  breadcrumbItems = [
    { label: 'HR Administration', icon: 'pi pi-home', routerLink: '/hradmin' },
    { label: 'Employee Device Management', icon: 'pi pi-mobile' },
  ];

  columns: TableColumn[] = [
    { key: 'actions', header: 'Actions', isSortable: false },
    { key: 'employee_code', header: 'Emp Code', isSortable: true },
    { key: 'full_name', header: 'Employee Name', isSortable: true },
    { key: 'laptop_status', header: 'Laptop', format: 'status' },
    { key: 'mobile_status', header: 'Mobile', format: 'status' },
    { key: 'last_used_at', header: 'Last Used', isSortable: true, pipe: 'date', pipeArgs: 'medium' },
  ];

  devices: any[] = [];
  filteredDevices: any[] = [];
  pageNo = 1;
  pageSize = 10;
  totalCount = 0;
  loading = signal(false);

  ngOnInit(): void {
    this.loadDevices();
  }

  loadDevices(): void {
    this.loading.set(true);
    this.deviceService.getEmployeesDevices()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success) {
            this.devices = res.data.map((d: any) => ({
              ...d,
              _badges: {
                laptop_status: d.laptop_status === 'Active' ? 'success' : (d.laptop_status === 'Inactive' ? 'danger' : 'warning'),
                mobile_status: d.mobile_status === 'Active' ? 'success' : (d.mobile_status === 'Inactive' ? 'danger' : 'warning')
              }
            }));
            this.updatePagination();
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load devices' });
        }
      });
  }

  updatePagination(): void {
    this.totalCount = this.devices.length;
    const startIndex = (this.pageNo - 1) * this.pageSize;
    this.filteredDevices = this.devices.slice(startIndex, startIndex + this.pageSize);
  }

  handlePageChange(page: number): void {
    this.pageNo = page;
    this.updatePagination();
  }

  handlePageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageNo = 1;
    this.updatePagination();
  }

  confirmReset(device: any, type: 'Laptop' | 'Mobile' | 'Both'): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to reset the ${type} registration for ${device.full_name}?`,
      header: 'Confirm Reset',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.resetDevice(device.employee_id, type);
      }
    });
  }

  resetDevice(employeeId: number, type: 'Laptop' | 'Mobile' | 'Both'): void {
    this.deviceService.resetDevice(employeeId, type)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: res.message });
            this.loadDevices();
          }
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to reset device' });
        }
      });
  }
}
