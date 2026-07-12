import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MessageService } from 'primeng/api';
import { UserService } from '../../../shared/services/user-service';
import { EmployeeManagementService } from '../../../shared/services/employee-management.service';
import { Employee } from '../../../shared/services/models/employee.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TabsModule } from 'primeng/tabs';
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';
import { DrawerModule } from 'primeng/drawer';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-office-location-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    BreadcrumbModule,
    TabsModule,
    CheckboxModule,
    TableModule,
    DrawerModule,
    TagModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './office-location-settings.html',
  styleUrl: './office-location-settings.scss'
})
export class OfficeLocationSettings implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  breadcrumbItems: any[] = [
    { label: 'HR Administration', icon: 'pi pi-home', routerLink: '/hradmin' },
    { label: 'Office Location Settings', icon: 'pi pi-map-marker' },
  ];

  companyName: string = '';
  locationForm: FormGroup;
  loading = signal(false);

  // Employee Custom Location
  employees: Employee[] = [];
  selectedEmployee: Employee | null = null;
  employeeLocationForm: FormGroup;
  employeeLoading = signal(false);
  isDrawerVisible = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly userService: UserService,
    private readonly employeeService: EmployeeManagementService,
    private readonly messageService: MessageService
  ) {
    this.locationForm = this.fb.group({
      address: ['', [Validators.required]],
      officeLatitude: ['', [Validators.required]],
      officeLongitude: ['', [Validators.required]],
      allowedRadius: [50, [Validators.required, Validators.min(1)]]
    });

    this.employeeLocationForm = this.fb.group({
      customLocationAllowed: [false],
      customLatitude: [{ value: '', disabled: true }, [Validators.required]],
      customLongitude: [{ value: '', disabled: true }, [Validators.required]],
      customRadius: [{ value: 50, disabled: true }, [Validators.required, Validators.min(1)]]
    });

    this.employeeLocationForm.get('customLocationAllowed')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(allowed => {
      const controls = ['customLatitude', 'customLongitude', 'customRadius'];
      controls.forEach(ctrl => {
        if (allowed) {
          this.employeeLocationForm.get(ctrl)?.enable();
        } else {
          this.employeeLocationForm.get(ctrl)?.disable();
        }
      });
    });
  }

  getCurrentLocation(isEmployeeForm = false): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isEmployeeForm) {
            this.employeeLocationForm.patchValue({
              customLatitude: position.coords.latitude,
              customLongitude: position.coords.longitude
            });
            this.employeeLocationForm.markAsDirty();
          } else {
            this.locationForm.patchValue({
              officeLatitude: position.coords.latitude,
              officeLongitude: position.coords.longitude
            });
            this.locationForm.markAsDirty();
          }
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Location fetched successfully' });
        },
        (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to retrieve your location' });
        }
      );
    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Geolocation is not supported by your browser' });
    }
  }

  ngOnInit(): void {
    this.loadLocationSettings();
    this.loadEmployees();
  }

  get f() {
    return this.locationForm.controls;
  }

  loadLocationSettings(): void {
    this.loading.set(true);
    this.userService.getOfficeLocation()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.loading.set(false);
          if (response?.data) {
            this.companyName = response.data.company_name || '';
            this.locationForm.patchValue({
              address: response.data.address || '',
              officeLatitude: response.data.office_latitude || '',
              officeLongitude: response.data.office_longitude || '',
              allowedRadius: response.data.allowed_radius || 50
            });
          }
        },
        error: (err: any) => {
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Failed to load office location settings.'
          });
        }
      });
  }

  saveLocation(): void {
    if (this.locationForm.invalid) {
      this.locationForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill all required fields correctly.'
      });
      return;
    }

    this.loading.set(true);
    const payload = this.locationForm.value;

    this.userService.updateOfficeLocation(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.loading.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Office location updated successfully.'
          });
          this.loadLocationSettings();
        },
        error: (err: any) => {
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Failed to update office location.'
          });
        }
      });
  }

  loadEmployees(): void {
    this.employeeService.getEmployees()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (employees) => {
          this.employees = employees;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load employees.' });
        }
      });
  }

  openDrawer(employee: Employee): void {
    this.selectedEmployee = employee;
    this.employeeLocationForm.patchValue({
      customLocationAllowed: !!employee.custom_location_allowed,
      customLatitude: employee.custom_latitude || '',
      customLongitude: employee.custom_longitude || '',
      customRadius: employee.custom_radius || 50
    });
    this.isDrawerVisible = true;
  }

  closeDrawer(): void {
    this.isDrawerVisible = false;
    this.selectedEmployee = null;
    this.employeeLocationForm.reset({ customLocationAllowed: false, customRadius: 50 });
  }

  saveEmployeeLocation(): void {
    if (!this.selectedEmployee) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please select an employee first.' });
      return;
    }

    if (this.employeeLocationForm.get('customLocationAllowed')?.value && this.employeeLocationForm.invalid) {
      this.employeeLocationForm.markAllAsTouched();
      this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Please fill all required fields.' });
      return;
    }

    this.employeeLoading.set(true);
    const payload = this.employeeLocationForm.getRawValue();

    this.employeeService.updateCustomLocation(this.selectedEmployee.id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.employeeLoading.set(false);
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Employee custom location updated successfully.' });

          // Update the local list so the form populates correctly next time
          if (this.selectedEmployee) {
            this.selectedEmployee.custom_location_allowed = payload.customLocationAllowed ? 1 : 0;
            this.selectedEmployee.custom_latitude = payload.customLatitude;
            this.selectedEmployee.custom_longitude = payload.customLongitude;
            this.selectedEmployee.custom_radius = payload.customRadius;
          }
          this.closeDrawer();
        },
        error: (err) => {
          this.employeeLoading.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to update custom location.' });
        }
      });
  }
}
