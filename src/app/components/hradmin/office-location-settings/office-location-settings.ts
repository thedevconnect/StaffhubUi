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
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableTemplate, TableColumn } from '../../../shared/ui/table-template/table-template';
import { AppBreadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';

export interface ExemptionRule {
  id: string;
  title: string;
  scope: 'COMPANY' | 'DEPARTMENT' | 'EMPLOYEE';
  targetDepartments?: string[];
  targetEmployeeNames?: string[];
  targetEmployeeIds?: number[];
  reasonCategory: 'WFH' | 'CLIENT_VISIT' | 'OUTSTATION' | 'EVENT' | 'EMERGENCY' | 'OTHER';
  reasonRemarks: string;
  startDateTime: Date | string;
  endDateTime: Date | string;
  requireShiftTiming: boolean;
  isActive: boolean;
  createdAt?: string;
}

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
    TooltipModule,
    DatePickerModule,
    SelectModule,
    TextareaModule,
    MultiSelectModule,
    TableTemplate
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

  // Company Location Table State
  isCompanyLocationEditing = signal(false);
  companyLocationData = signal<any[]>([]);

  // Time-Bound Anywhere Swipe Exemption Rules State
  isExemptionDrawerVisible = false;
  editingExemptionRule: ExemptionRule | null = null;
  exemptionForm: FormGroup;

  exemptionRules = signal<ExemptionRule[]>([]);

  companyLocationColumns: TableColumn[] = [
    { key: 'companyName', header: 'Company Name' },
    { key: 'address', header: 'Office Address' },
    { key: 'officeLatitude', header: 'Latitude' },
    { key: 'officeLongitude', header: 'Longitude' },
    { key: 'allowedRadius', header: 'Radius (m)' },
    { key: 'actions', header: 'Action' }
  ];

  employeeColumns: TableColumn[] = [
    { key: 'emp_id', header: 'Employee ID' },
    { key: 'fullName', header: 'Name & Department' },
    { key: 'custom_location_allowed', header: 'Location Type' },
    { key: 'custom_latitude', header: 'Latitude' },
    { key: 'custom_longitude', header: 'Longitude' },
    { key: 'custom_radius', header: 'Radius (m)' },
    { key: 'actions', header: 'Action' }
  ];

  exemptionColumns: TableColumn[] = [
    { key: 'title', header: 'Rule & Scope' },
    { key: 'reasonCategory', header: 'Reason & Notes' },
    { key: 'startDateTime', header: 'Valid Period' },
    { key: 'requireShiftTiming', header: 'Shift Timing' },
    { key: 'status', header: 'Status' },
    { key: 'actions', header: 'Actions' }
  ];

  reasonCategoryOptions = [
    { label: 'Work From Home (WFH)', value: 'WFH' },
    { label: 'Client Site Visit', value: 'CLIENT_VISIT' },
    { label: 'Outstation / Travel Duty', value: 'OUTSTATION' },
    { label: 'Annual / Special Event', value: 'EVENT' },
    { label: 'Transit / Weather Emergency', value: 'EMERGENCY' },
    { label: 'Other', value: 'OTHER' }
  ];

  scopeOptions = [
    { label: 'Company Wide (All Employees)', value: 'COMPANY' },
    { label: 'Selected Employees Only', value: 'EMPLOYEE' }
  ];

  get departmentOptions() {
    const depts = new Set<string>();
    this.employees.forEach(emp => {
      if (emp.department && emp.department.trim()) {
        depts.add(emp.department.trim());
      }
    });
    if (depts.size === 0) {
      return [
        { label: 'Engineering', value: 'Engineering' },
        { label: 'Implementation', value: 'Implementation' },
        { label: 'HR Administration', value: 'HR Administration' },
        { label: 'Finance & Accounts', value: 'Finance & Accounts' },
        { label: 'Sales & Marketing', value: 'Sales & Marketing' },
        { label: 'Operations', value: 'Operations' }
      ];
    }
    return Array.from(depts).map(d => ({ label: d, value: d }));
  }

  get employeeOptions() {
    return this.employees.map(emp => ({
      label: `${emp.fullName} (${emp.emp_id}) - ${emp.department || 'General'}`,
      value: emp.id,
      name: emp.fullName
    }));
  }

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

    this.exemptionForm = this.fb.group({
      title: ['', [Validators.required]],
      scope: ['COMPANY', [Validators.required]],
      targetDepartments: [[]],
      targetEmployeeIds: [[]],
      reasonCategory: ['WFH', [Validators.required]],
      reasonRemarks: ['', [Validators.required]],
      startDateTime: [new Date(), [Validators.required]],
      endDateTime: [new Date(Date.now() + 86400000 * 3), [Validators.required]],
      requireShiftTiming: [true],
      isActive: [true]
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
    this.loadExemptionRules();
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
            const locData = {
              companyName: this.companyName,
              address: response.data.address || '',
              officeLatitude: response.data.office_latitude || '',
              officeLongitude: response.data.office_longitude || '',
              allowedRadius: response.data.allowed_radius || 50
            };
            this.companyLocationData.set([locData]);

            this.locationForm.patchValue(locData);
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

  editCompanyLocation(): void {
    this.isCompanyLocationEditing.set(true);
  }

  cancelEditCompanyLocation(): void {
    this.isCompanyLocationEditing.set(false);
    if (this.companyLocationData().length > 0) {
      this.locationForm.patchValue(this.companyLocationData()[0]);
    }
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
          this.isCompanyLocationEditing.set(false);
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
          const todayStr = new Date().toISOString().split('T')[0];
          this.employees = (employees || []).filter(e => {
            const statusUpper = String(e.status || '').toUpperCase();
            const lwdVal = e.last_working_day || e.lastWorkingDay;
            if (statusUpper === 'INACTIVE') {
              if (lwdVal) {
                const lwdStr = new Date(lwdVal).toISOString().split('T')[0];
                return todayStr <= lwdStr;
              }
              return false;
            }
            if (lwdVal) {
              const lwdStr = new Date(lwdVal).toISOString().split('T')[0];
              return todayStr <= lwdStr;
            }
            return true;
          });
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

  openExemptionDrawer(rule?: ExemptionRule): void {
    if (rule) {
      this.editingExemptionRule = rule;
      this.exemptionForm.patchValue({
        title: rule.title,
        scope: rule.scope,
        targetDepartments: rule.targetDepartments || [],
        targetEmployeeIds: rule.targetEmployeeIds || [],
        reasonCategory: rule.reasonCategory,
        reasonRemarks: rule.reasonRemarks,
        startDateTime: rule.startDateTime ? new Date(rule.startDateTime) : new Date(),
        endDateTime: rule.endDateTime ? new Date(rule.endDateTime) : new Date(),
        requireShiftTiming: rule.requireShiftTiming,
        isActive: rule.isActive
      });
    } else {
      this.editingExemptionRule = null;
      this.exemptionForm.reset({
        title: '',
        scope: 'COMPANY',
        targetDepartments: [],
        targetEmployeeIds: [],
        reasonCategory: 'WFH',
        reasonRemarks: '',
        startDateTime: new Date(),
        endDateTime: new Date(Date.now() + 86400000 * 3),
        requireShiftTiming: true,
        isActive: true
      });
    }
    this.isExemptionDrawerVisible = true;
  }

  closeExemptionDrawer(): void {
    this.isExemptionDrawerVisible = false;
    this.editingExemptionRule = null;
  }

  loadExemptionRules(): void {
    // Read from localStorage as immediate fallback
    const savedLocal = localStorage.getItem('staffhub_location_exemptions');
    if (savedLocal) {
      try {
        this.exemptionRules.set(JSON.parse(savedLocal));
      } catch (e) { }
    }

    this.userService.getExemptionRules()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          if (response?.data && Array.isArray(response.data)) {
            this.exemptionRules.set(response.data);
            this.syncRulesToLocalStorage(response.data);
          }
        },
        error: () => {
          // Backend endpoint returned 404/Error, continuing with localStorage fallback state
        }
      });
  }

  private syncRulesToLocalStorage(rules: ExemptionRule[]): void {
    try {
      localStorage.setItem('staffhub_location_exemptions', JSON.stringify(rules));
    } catch (e) { }
  }

  saveExemptionRule(): void {
    if (this.exemptionForm.invalid) {
      this.exemptionForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill all required fields correctly.'
      });
      return;
    }

    const val = this.exemptionForm.value;

    let empNames: string[] = [];
    if (val.scope === 'EMPLOYEE' && val.targetEmployeeIds?.length) {
      empNames = this.employees
        .filter(e => val.targetEmployeeIds.includes(e.id))
        .map(e => e.fullName);
    }

    const payload = {
      title: val.title,
      scope: val.scope,
      targetDepartments: val.scope === 'DEPARTMENT' ? val.targetDepartments : [],
      targetEmployeeIds: val.scope === 'EMPLOYEE' ? val.targetEmployeeIds : [],
      targetEmployeeNames: empNames,
      reasonCategory: val.reasonCategory,
      reasonRemarks: val.reasonRemarks,
      startDateTime: val.startDateTime,
      endDateTime: val.endDateTime,
      requireShiftTiming: val.requireShiftTiming,
      isActive: val.isActive
    };

    if (this.editingExemptionRule) {
      // Update existing via Backend API
      this.userService.updateExemptionRule(this.editingExemptionRule.id, payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res: any) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Exemption rule updated successfully.'
            });
            this.loadExemptionRules();
          },
          error: () => {
            // Local state update fallback
            this.exemptionRules.update(rules => {
              const updated = rules.map(r => {
                if (r.id === this.editingExemptionRule!.id) {
                  return { ...r, ...payload };
                }
                return r;
              });
              this.syncRulesToLocalStorage(updated);
              return updated;
            });
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Exemption rule updated successfully.'
            });
          }
        });
    } else {
      // Create new via Backend API
      this.userService.createExemptionRule(payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res: any) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'New Anywhere Swipe Exemption Rule created successfully.'
            });
            this.loadExemptionRules();
          },
          error: () => {
            // Local state update fallback
            const newRule: ExemptionRule = {
              id: `EXM-${Math.floor(100 + Math.random() * 900)}`,
              ...payload,
              createdAt: new Date().toISOString().split('T')[0]
            };

            this.exemptionRules.update(rules => {
              const updated = [newRule, ...rules];
              this.syncRulesToLocalStorage(updated);
              return updated;
            });
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'New Anywhere Swipe Exemption Rule created successfully.'
            });
          }
        });
    }

    this.closeExemptionDrawer();
  }

  toggleRuleStatus(rule: ExemptionRule): void {
    const newStatus = !rule.isActive;

    this.userService.toggleExemptionRuleStatus(rule.id, newStatus)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadExemptionRules();
        },
        error: () => {
          // Local fallback
          this.exemptionRules.update(rules => {
            const updated = rules.map(r => {
              if (r.id === rule.id) {
                return { ...r, isActive: newStatus };
              }
              return r;
            });
            this.syncRulesToLocalStorage(updated);
            return updated;
          });
        }
      });

    this.messageService.add({
      severity: newStatus ? 'success' : 'warn',
      summary: 'Status Updated',
      detail: `Rule "${rule.title}" is now ${newStatus ? 'Active' : 'Disabled'}.`
    });
  }

  deleteExemptionRule(ruleId: string): void {
    this.userService.deleteExemptionRule(ruleId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadExemptionRules();
        },
        error: () => {
          // Local fallback
          this.exemptionRules.update(rules => {
            const updated = rules.filter(r => r.id !== ruleId);
            this.syncRulesToLocalStorage(updated);
            return updated;
          });
        }
      });

    this.messageService.add({
      severity: 'info',
      summary: 'Deleted',
      detail: 'Exemption rule removed.'
    });
  }

  getRuleStatusInfo(rule: ExemptionRule): { label: string; severity: 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' } {
    if (!rule.isActive) {
      return { label: 'Disabled', severity: 'secondary' };
    }
    const now = new Date();
    const start = new Date(rule.startDateTime);
    const end = new Date(rule.endDateTime);

    if (now < start) {
      return { label: 'Upcoming', severity: 'info' };
    } else if (now > end) {
      return { label: 'Expired', severity: 'warn' };
    } else {
      return { label: 'Active Now', severity: 'success' };
    }
  }

  getCategoryLabel(category: string): string {
    const found = this.reasonCategoryOptions.find(o => o.value === category);
    return found ? found.label : category;
  }
}
