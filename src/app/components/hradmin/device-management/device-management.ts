import { Component, DestroyRef, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableTemplate, TableColumn } from '../../../shared/ui/table-template/table-template';
import { DeviceService, DeviceStatus } from '../../../shared/services/device.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';

@Component({
  selector: 'app-device-management',
  standalone: true,
  imports: [
    CommonModule,
    TableTemplate,
    ToastModule,
    ConfirmDialogModule,
    BreadcrumbModule,
    ButtonModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './device-management.html',
  styleUrl: './device-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeviceManagement implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly deviceService = inject(DeviceService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly cdr = inject(ChangeDetectorRef);

  breadcrumbItems = [
    { label: 'HR Administration', icon: 'pi pi-home', routerLink: '/hradmin' },
    { label: 'Employee Device Management', icon: 'pi pi-mobile' },
  ];

  columns: TableColumn[] = [
    { key: 'actions', header: 'Actions', isSortable: false },
    { key: 'employee_code', header: 'Emp Code', isSortable: true },
    { key: 'full_name', header: 'Employee Name', isSortable: true },
    { key: 'laptop_status', header: 'Laptop Status', format: 'status' },
    { key: 'laptop_device_info', header: 'Laptop Device', isSortable: false },
    { key: 'mobile_status', header: 'Mobile Status', format: 'status' },
    { key: 'mobile_device_info', header: 'Mobile Device', isSortable: false },
    { key: 'last_used_at', header: 'Last Used', isSortable: true, pipe: 'date', pipeArgs: 'medium' },
  ];

  tableActions = [
    { label: 'Reset Laptop', icon: 'pi pi-laptop', id: 'reset_laptop' },
    { label: 'Reset Mobile', icon: 'pi pi-mobile', id: 'reset_mobile' },
    { label: 'Reset Both', icon: 'pi pi-trash', id: 'reset_both' }
  ];

  devices: any[] = [];
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
                laptop_status: String(d.laptop_status).toUpperCase() === 'ACTIVE' ? 'success' : (String(d.laptop_status).toUpperCase() === 'INACTIVE' ? 'danger' : 'warning'),
                mobile_status: String(d.mobile_status).toUpperCase() === 'ACTIVE' ? 'success' : (String(d.mobile_status).toUpperCase() === 'INACTIVE' ? 'danger' : 'warning')
              }
            }));
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load devices' });
          this.cdr.markForCheck();
        }
      });
  }



  disableAction = (actionId: string, device: any): boolean => {
    if (actionId === 'reset_laptop') {
      return device.laptop_status === 'Not Registered';
    }
    if (actionId === 'reset_mobile') {
      return device.mobile_status === 'Not Registered';
    }
    if (actionId === 'reset_both') {
      return device.laptop_status === 'Not Registered' && device.mobile_status === 'Not Registered';
    }
    return false;
  };

  handleAction(event: { actionId: string; row: any }): void {
    const { actionId, row } = event;
    if (actionId === 'reset_laptop') {
      this.confirmReset(row, 'Laptop');
    } else if (actionId === 'reset_mobile') {
      this.confirmReset(row, 'Mobile');
    } else if (actionId === 'reset_both') {
      this.confirmReset(row, 'Both');
    }
  }

  confirmReset(device: any, type: 'Laptop' | 'Mobile' | 'Both'): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to reset the ${type} registration for ${device.full_name}?`,
      header: 'Confirm Reset',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.resetDevice(device.user_id, type);
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
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to reset device' });
          this.cdr.markForCheck();
        }
      });
  }
}
