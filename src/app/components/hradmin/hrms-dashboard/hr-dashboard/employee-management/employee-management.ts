import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DrawerModule } from 'primeng/drawer';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableTemplate, TableColumn } from '../../../../../shared/ui/table-template/table-template';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { DatePickerModule } from 'primeng/datepicker';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  CreateEmployeeRequest,
  Employee,
  UpdateEmployeeRequest
} from '../../../../../shared/services/models/employee.model';
import { EmployeeManagementService } from '../../../../../shared/services/employee-management.service';
import { AuthService } from '../../../../../shared/services/services/auth.service';
import { EmployeeOnboardingService } from '../../../../../shared/services/employee-onboarding.service';

@Component({
  selector: 'app-employee-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    DatePickerModule,
    ToastModule,
    ConfirmDialogModule,
    DrawerModule,
    TooltipModule,
    SelectModule,
    ReactiveFormsModule,
    TableTemplate,
    BreadcrumbModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './employee-management.html',
  styleUrl: './employee-management.scss',
})
export class EmployeeManagement implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  breadcrumbItems: any[] = [
    { label: 'HR Administration', icon: 'pi pi-home', routerLink: '/hradmin' },
    { label: 'Employee Management', icon: 'pi pi-users', routerLink: '/hradmin/employee-management' },
  ];

  employees: Employee[] = [];
  loading = signal(false);
  columns: TableColumn[] = [
    { key: 'actions', header: 'Actions', isVisible: true },
    { key: 'emp_id', header: 'Employee ID', isVisible: true, isSortable: true },
    { key: 'full_name', header: 'Full Name', isVisible: true, isSortable: true },
    { key: 'username', header: 'Username', isVisible: true, isSortable: true },
    { key: 'email', header: 'Email', isVisible: true, isSortable: true },

    { key: 'mobile', header: 'Mobile', isVisible: true, isSortable: true },
    { key: 'designation', header: 'Designation', isVisible: true, isSortable: true },
    { key: 'department', header: 'Department', isVisible: true, isSortable: true },
    { key: 'reportingManagerName', header: 'Reporting Manager', isVisible: true, isSortable: true },
    { key: 'joiningDate', header: 'Joining Date', isVisible: true, isSortable: true, format: 'date' },
    { key: 'employmentType', header: 'Employment Type', isVisible: true, isSortable: true },
    { key: 'workLocation', header: 'Work Location', isVisible: true, isSortable: true },

    { key: 'role', header: 'Role', isVisible: true, isSortable: true },
    { key: 'status', header: 'Status', isVisible: true, isSortable: true, format: 'status' },
    { key: 'created_at', header: 'Created At', isVisible: true, isSortable: true, format: 'date' },
  ];

  rowActions = [
    { label: 'View', icon: 'pi pi-eye', id: 'view' },
    { label: 'Update', icon: 'pi pi-pencil', id: 'update' },
    { label: 'Delete', icon: 'pi pi-trash', id: 'delete' },
    { label: 'Onboarding', icon: 'pi pi-user-check', id: 'onboarding' }
  ];

  designationOptions = [
    { label: 'Software Engineer', value: 'Software-Engineer' },
    { label: 'Junior Software Engineer', value: 'Junior-Software-Engineer' },
    { label: 'Senior Software Engineer', value: 'Senior-Software-Engineer' },
    { label: 'Team Lead', value: 'Team-Lead' },
    { label: 'Solution Architect', value: 'Solution-Architect' },
    { label: 'QA Engineer', value: 'QA-Engineer' },
    { label: 'HR Executive', value: 'HR-Executive' },
    { label: 'Manager', value: 'Manager' },
    { label: 'Other', value: 'Other' },

  ];

  employmentTypeOptions = [
    { label: 'Full Time', value: 'FULL_TIME' },
    { label: 'Part Time', value: 'PART_TIME' },
    { label: 'Contract', value: 'CONTRACT' },
    { label: 'Intern', value: 'INTERN' },
    { label: 'Consultant', value: 'CONSULTANT' },
    { label: 'Other', value: 'Other' },



  ];

  workLocationOptions = [
    { label: 'Office', value: 'OFFICE' },
    { label: 'Remote', value: 'REMOTE' },
    { label: 'Hybrid', value: 'HYBRID' },
    { label: 'On Site', value: 'ON_SITE' },
    { label: 'Other', value: 'Other' },

  ];

  departmentOptions = [
    { label: 'IT-Development', value: 'IT-Development' },
    { label: 'HR', value: 'HR' },
    { label: 'Business Development', value: 'Business-Development' },
    { label: 'Finance', value: 'Finance' },
    { label: 'Sales', value: 'Sales' },
    { label: 'Marketing', value: 'Marketing' },
    { label: 'Operations', value: 'Operations' },
    { label: 'Other', value: 'Other' },

  ];

  showDrawer = false;
  isViewMode = false;
  isEditMode = false;
  selectedEmployee: Employee | null = null;
  employeeForm: FormGroup;

  // Onboarding Properties
  showOnboardingDialog = false;
  onboardingDetails: any = null;
  onboardingEmployee: Employee | null = null;
  onboardingService = inject(EmployeeOnboardingService);

  constructor(
    private readonly fb: FormBuilder,
    private readonly employeeService: EmployeeManagementService,
    private readonly messageService: MessageService,
    private readonly authService: AuthService,
    private readonly confirmationService: ConfirmationService
  ) {
    this.employeeForm = this.fb.group({
      fullName: ['', [Validators.required]],
      officialEmail: ['', [Validators.required, Validators.email]],
      mobileNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      designation: ['', [Validators.required]],
      department: ['', [Validators.required]],
      reportingManager: ['', [Validators.required]],
      joiningDate: [null, [Validators.required]],
      employmentType: ['', [Validators.required]],
      workLocation: ['OFFICE', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadAllData();
  }

  get f() {
    return this.employeeForm.controls;
  }

  openAddDrawer(): void {
    this.isViewMode = false;
    this.showDrawer = true;
    this.isEditMode = false;
    this.selectedEmployee = null;
    this.employeeForm.reset({ workLocation: 'OFFICE' });
    this.employeeForm.enable();
  }

  closeDrawer(): void {
    this.showDrawer = false;
    this.selectedEmployee = null;
  }

  onEmailInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    let value = inputElement.value;

    if (value.endsWith('@')) {
      value = value + 'gmail.com';
      const emailControl = this.employeeForm.get('officialEmail');
      if (emailControl) {
        emailControl.setValue(value);
      }
    }
  }

  saveEmployee(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill all required fields correctly.'
      });
      return;
    }

    const payload = this.getPayloadFromForm();
    this.loading.set(true);

    if (this.isEditMode && this.selectedEmployee?.id !== undefined && this.selectedEmployee?.id !== null) {
      const updatePayload: UpdateEmployeeRequest = {
        ...payload,
        role: this.selectedEmployee.role || 'ESS',
        status: this.selectedEmployee.status || 'ACTIVE'
      };

      this.employeeService
        .updateEmployee(this.selectedEmployee.id, updatePayload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Employee updated successfully.'
            });
            this.showDrawer = false;
            this.loadAllData();
          },
          error: (err) => {
            this.loading.set(false);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: this.getApiErrorMessage(err, 'Failed to update employee.')
            });
          }
        });
      return;
    }

    this.employeeService
      .createEmployee(payload as CreateEmployeeRequest)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (createdEmployee) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: createdEmployee?.employeeCode
              ? `Employee created successfully. Employee Code: ${createdEmployee.employeeCode}`
              : 'Employee created successfully.'
          });
          this.showDrawer = false;
          this.loadAllData();
        },
        error: (err) => {
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: this.getApiErrorMessage(err, 'Failed to create employee.')
          });
        }
      });
  }

  handleRowAction(event: { actionId: string; row: Employee }): void {
    if (event.actionId === 'view') {
      this.openViewDrawer(event.row);
      return;
    }

    if (event.actionId === 'edit' || event.actionId === 'update') {
      this.openEditDrawer(event.row);
      return;
    }

    if (event.actionId === 'delete') {
      this.confirmDeleteEmployee(event.row);
      return;
    }

    if (event.actionId === 'onboarding') {
      this.openOnboardingDialog(event.row);
    }
  }

  private confirmDeleteEmployee(employee: Employee): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${employee.fullName}"?`,
      header: 'Delete Employee',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true
      },
      acceptButtonProps: {
        label: 'Delete',
        severity: 'danger'
      },
      accept: () => this.deleteEmployee(employee)
    });
  }

  private deleteEmployee(employee: Employee): void {
    if (employee?.id === undefined || employee?.id === null || employee?.id === '') {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to delete employee. Invalid employee id.'
      });
      return;
    }

    this.loading.set(true);
    this.employeeService
      .deleteEmployee(employee.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Employee deleted successfully.'
          });
          this.loadAllData();
        },
        error: (err) => {
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: this.getApiErrorMessage(err, 'Failed to delete employee.')
          });
        }
      });
  }



  loadAllData(): void {
    this.loading.set(true);
    this.employeeService
      .getEmployees()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (employees) => {
          this.employees = employees ?? [];
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.employees = [];
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: this.getApiErrorMessage(err, 'Failed to load employees.')
          });
        }
      });
  }

  private openEditDrawer(employee: Employee): void {
    this.showDrawer = true;
    this.isViewMode = false;
    this.isEditMode = true;
    this.selectedEmployee = employee;
    this.patchForm(employee);
    this.employeeForm.enable();
  }

  private openViewDrawer(employee: Employee): void {
    this.showDrawer = true;
    this.isViewMode = true;
    this.isEditMode = false;
    this.selectedEmployee = employee;
    this.patchForm(employee);
    this.employeeForm.disable();
  }

  private patchForm(employee: Employee): void {
    this.employeeForm.patchValue({
      fullName: employee.fullName,
      officialEmail: employee.officialEmail,
      mobileNumber: employee.mobileNumber,
      designation: employee.designation,
      department: employee.department,
      reportingManager: employee.reportingManager,
      joiningDate: employee.joiningDate ? new Date(employee.joiningDate) : null,
      employmentType: employee.employmentType,
      workLocation: employee.workLocation,
    });
  }

  private getPayloadFromForm(): CreateEmployeeRequest {
    const formValue = this.employeeForm.getRawValue();
    const reportingManagerName = String(formValue.reportingManager || '').trim();
    const reportingManagerId = this.resolveReportingManagerId(reportingManagerName);

    return {
      fullName: String(formValue.fullName || '').trim(),
      officialEmail: String(formValue.officialEmail || '').trim(),
      mobileNumber: String(formValue.mobileNumber || '').trim(),
      designation: this.normalizeApiText(formValue.designation),
      department: String(formValue.department || '').trim(),
      reportingManager: reportingManagerName,
      reportingManagerName: reportingManagerName,
      reporting_manager_name: reportingManagerName,
      reportingManagerId: reportingManagerId,
      reporting_manager_id: reportingManagerId,
      joiningDate: this.toApiDate(formValue.joiningDate),
      employmentType: this.normalizeEmploymentType(formValue.employmentType),
      workLocation: String(formValue.workLocation || 'OFFICE').trim().toUpperCase(),
      companyId: this.getCompanyIdFromSession(),
      company_id: this.getCompanyIdFromSession(),
    };
  }

  private getCompanyIdFromSession(): number | undefined {
    const fromUser = (this.authService.user?.() as any)?.companyId;
    if (Number.isFinite(Number(fromUser)) && Number(fromUser) > 0) {
      return Number(fromUser);
    }

    const token = localStorage.getItem('userToken') || sessionStorage.getItem('userToken') || '';
    const decoded = this.authService.decodeToken(token);
    const fromToken = decoded?.companyId;

    if (Number.isFinite(Number(fromToken)) && Number(fromToken) > 0) {
      return Number(fromToken);
    }

    return undefined;
  }

  private normalizeApiText(value: unknown): string {
    return String(value || '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeEmploymentType(value: unknown): string {
    return String(value || 'FULL_TIME')
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '_');
  }

  private resolveReportingManagerId(reportingManagerName: string): number | null {
    const normalizedInput = reportingManagerName.trim().toLowerCase();
    if (!normalizedInput) {
      return null;
    }

    const matchedEmployee = this.employees.find((employee) =>
      String(employee.fullName || '').trim().toLowerCase() === normalizedInput
    );

    if (!matchedEmployee) {
      return null;
    }

    const numericId = Number(matchedEmployee.id);
    return Number.isFinite(numericId) && numericId > 0 ? numericId : null;
  }

  private getApiErrorMessage(err: any, fallback: string): string {
    const source = err?.error;
    const rawError = source?.error;

    if (typeof source === 'string') {
      return source;
    }

    if (Array.isArray(source?.errors) && source.errors.length > 0) {
      return source.errors.map((item: any) => item?.message || item).join(', ');
    }

    if (Array.isArray(source?.message)) {
      return source.message.join(', ');
    }

    return source?.message || fallback;
  }



  private toApiDate(value: unknown): string {
    if (!value) {
      return '';
    }

    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  openOnboardingDialog(employee: Employee): void {
    this.onboardingEmployee = employee;
    const empId = employee.employeeId || employee.id;

    this.loading.set(true);
    this.onboardingService.getOnboardingByEmployeeId(empId).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        if (res && res.data) {
          this.onboardingDetails = res.data;
          this.showOnboardingDialog = true;
        } else {
          this.messageService.add({
            severity: 'info',
            summary: 'Not Started',
            detail: 'Employee has not submitted onboarding details yet.'
          });
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'info',
          summary: 'Not Started',
          detail: 'Employee has not submitted onboarding details yet.'
        });
      }
    });
  }

  approveOnboarding(): void {
    if (!this.onboardingEmployee) return;
    const empId = this.onboardingEmployee.employeeId || this.onboardingEmployee.id;

    this.loading.set(true);
    this.onboardingService.updateOnboarding(empId, { profile_status: 'COMPLETED' }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Approved',
          detail: 'Onboarding approved successfully.'
        });
        this.showOnboardingDialog = false;
        this.loadAllData();
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to approve onboarding.'
        });
      }
    });
  }

  rejectOnboarding(): void {
    if (!this.onboardingEmployee) return;
    const empId = this.onboardingEmployee.employeeId || this.onboardingEmployee.id;

    this.loading.set(true);
    this.onboardingService.updateOnboarding(empId, { profile_status: 'REJECTED' }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Rejected',
          detail: 'Onboarding rejected.'
        });
        this.showOnboardingDialog = false;
        this.loadAllData();
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to reject onboarding.'
        });
      }
    });
  }


  onRefresh(): void {
    this.loadAllData();
  }
}
