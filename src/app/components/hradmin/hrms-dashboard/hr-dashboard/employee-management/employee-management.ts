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
import { AppBreadcrumb } from '../../../../../shared/ui/breadcrumb/breadcrumb';
import { DatePickerModule } from 'primeng/datepicker';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  CreateEmployeeRequest,
  Employee,
  UpdateEmployeeRequest
} from '../../../../../shared/services/models/employee.model';
import { EmployeeManagementService } from '../../../../../shared/services/employee-management.service';
import { AuthService } from '../../../../../shared/services/services/auth.service';

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
    AppBreadcrumb
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './employee-management.html',
  styleUrl: './employee-management.scss',
})
export class EmployeeManagement implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  breadcrumbItems: any[] = [
    { label: 'HR Administration', url: '#' },
    { label: 'Employee Management' },
  ];

  allEmployees: Employee[] = [];
  employees: Employee[] = [];
  columns: TableColumn[] = [
    { key: 'employeeCode', header: 'Employee Code', isVisible: true, isSortable: true },
    { key: 'fullName', header: 'Full Name', isVisible: true, isSortable: true },
    { key: 'officialEmail', header: 'Email', isVisible: true, isSortable: true },
    { key: 'mobileNumber', header: 'Mobile', isVisible: true, isSortable: true },
    { key: 'designation', header: 'Designation', isVisible: true, isSortable: true },
    { key: 'department', header: 'Department', isVisible: true, isSortable: true },
    { key: 'reportingManager', header: 'Reporting Manager', isVisible: true, isSortable: true },
    { key: 'joiningDate', header: 'Joining Date', isVisible: true, isSortable: true, format: 'date' },
    { key: 'status', header: 'Status', isVisible: true, isSortable: true, format: 'status' },
  ];
  pageSize = 10;
  totalCount = 0;
  loading = signal(false);
  pageNo = 1;
  searchText = '';
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  rowActions = [
    { label: 'View', icon: 'pi pi-eye', id: 'view' },
    { label: 'Edit', icon: 'pi pi-pencil', id: 'edit' },
    { label: 'Delete', icon: 'pi pi-trash', id: 'delete' },
  ];

  designationOptions = [
    { label: 'Software Engineer', value: 'Software Engineer' },
    { label: 'Senior Software Engineer', value: 'Senior Software Engineer' },
    { label: 'Team Lead', value: 'Team Lead' },
    { label: 'HR Executive', value: 'HR Executive' },
    { label: 'HR Manager', value: 'HR Manager' },
    { label: 'Accounts Executive', value: 'Accounts Executive' },
    { label: 'Operations Executive', value: 'Operations Executive' }
  ];

  employmentTypeOptions = [
    { label: 'Full Time', value: 'FULL_TIME' },
    { label: 'Part Time', value: 'PART_TIME' },
    { label: 'Contract', value: 'CONTRACT' },
    { label: 'Intern', value: 'INTERN' },
    { label: 'Consultant', value: 'CONSULTANT' }
  ];

  workLocationOptions = [
    { label: 'Office', value: 'OFFICE' },
    { label: 'Remote', value: 'REMOTE' },
    { label: 'Hybrid', value: 'HYBRID' }
  ];

  

  showDrawer = false;
  isViewMode = false;
  isEditMode = false;
  selectedEmployee: Employee | null = null;
  employeeForm: FormGroup;

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
      this.employeeService
        .updateEmployee(this.selectedEmployee.id, payload as UpdateEmployeeRequest)
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

    if (event.actionId === 'edit') {
      this.openEditDrawer(event.row);
      return;
    }

    if (event.actionId === 'delete') {
      this.confirmDeleteEmployee(event.row);
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

  onPageChange(event: number): void {
    this.pageNo = event;
    this.applyClientFilters();
  }

  onPageSizeChange(event: number): void {
    this.pageSize = event;
    this.pageNo = 1;
    this.applyClientFilters();
  }

  onSortChange(event: { column: string; direction: 'asc' | 'desc' }): void {
    this.sortColumn = event.column;
    this.sortDirection = event.direction;
    this.applyClientFilters();
  }

  onSearchChange(event: string): void {
    this.searchText = event;
    this.pageNo = 1;
    this.applyClientFilters();
  }

  loadAllData(): void {
    this.loading.set(true);
    this.employeeService
      .getEmployees()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (employees) => {
          this.allEmployees = employees ?? [];
          this.applyClientFilters();
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.allEmployees = [];
          this.employees = [];
          this.totalCount = 0;
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
    const reportingManagerName = this.normalizeApiText(formValue.reportingManager);
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
      reportingManagerId,
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

    const matchedEmployee = this.allEmployees.find((employee) =>
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

    if (typeof rawError === 'string' && rawError.toLowerCase().includes("duplicate entry") && rawError.includes("users.emp_id")) {
      return 'Reporting manager already exists. Please enter existing reporting manager name exactly or select a different manager.';
    }

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

  private applyClientFilters(): void {
    const search = this.searchText.trim().toLowerCase();
    let filtered = [...this.allEmployees];

    if (search) {
      filtered = filtered.filter((employee) => {
        const text = [
          employee.employeeCode,
          employee.fullName,
          employee.officialEmail,
          employee.mobileNumber,
          employee.designation,
          employee.department,
          employee.reportingManager,
          employee.status
        ]
          .join(' ')
          .toLowerCase();

        return text.includes(search);
      });
    }

    if (this.sortColumn) {
      filtered.sort((a: any, b: any) => {
        const v1 = this.getSortableValue(a[this.sortColumn as string]);
        const v2 = this.getSortableValue(b[this.sortColumn as string]);

        if (v1 < v2) return this.sortDirection === 'asc' ? -1 : 1;
        if (v1 > v2) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.totalCount = filtered.length;
    const start = (this.pageNo - 1) * this.pageSize;
    this.employees = filtered.slice(start, start + this.pageSize);
  }

  private getSortableValue(value: unknown): string | number {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'number') {
      return value;
    }

    const normalized = String(value).trim();
    const dateValue = Date.parse(normalized);
    if (!Number.isNaN(dateValue)) {
      return dateValue;
    }

    return normalized.toLowerCase();
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
}
