import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { EmployeeManagementService } from '../../../shared/services/employee-management.service';
import { TableTemplate, TableColumn } from '../../../shared/ui/table-template/table-template';

@Component({
  selector: 'app-offboarding',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    BreadcrumbModule,
    CardModule,
    ButtonModule,
    SelectModule,
    DatePickerModule,
    ToastModule,
    DrawerModule,
    InputTextModule,
    TableTemplate
  ],
  providers: [MessageService],
  templateUrl: './offboarding.html',
  styleUrls: ['./offboarding.scss']
})
export class OffboardingComponent implements OnInit {
  breadcrumbItems = [
    { label: 'Home', icon: 'pi pi-home', routerLink: '/' },
    { label: 'EPSS', routerLink: '/epss' },
    { label: 'Offboarding', routerLink: '/hradmin/offboarding' }
  ];

  offboardingForm!: FormGroup;
  employees: any[] = [];
  statusOptions = [
    { label: 'Resigned', value: 'Resigned' },
    { label: 'Terminated', value: 'Terminated' },
    { label: 'Retired', value: 'Retired' },
    { label: 'Absconded', value: 'Absconded' },

  ];

  isLoading = false;
  showDrawer = false;

  // Table Data
  offboardings: any[] = [];
  columns: TableColumn[] = [
    { key: 'employeeName', header: 'Employee Name' },
    { key: 'employeeCode', header: 'Employee Code' },
    { key: 'employmentStatus', header: 'Status' },
    { key: 'resignationDate', header: 'Resignation Date' },
    { key: 'lastWorkingDate', header: 'Last Working Date' },
    { key: 'reason', header: 'Reason' }
  ];

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private employeeManagementService: EmployeeManagementService,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadTableData();
  }

  private initForm(): void {
    this.offboardingForm = this.fb.group({
      employeeId: [null, Validators.required],
      employmentStatus: [null, Validators.required],
      resignationDate: [null, Validators.required],
      lastWorkingDate: [null, Validators.required],
      reason: [null, Validators.required]
    });
  }

  private loadEmployees(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.employeeManagementService.getEmployees().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.employees = data.map(emp => ({
            label: `${emp.fullName} - ${emp.employeeCode || emp.id}`,
            value: emp.id
          }));
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch employee list.'
        });
        this.cdr.markForCheck();
      }
    });
  }

  loadTableData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    
    // Simulate API delay
    setTimeout(() => {
      // Mock data for table until API is ready
      this.offboardings = [
        { id: 1, employeeName: 'John Doe', employeeCode: 'EMP001', employmentStatus: 'Resigned', resignationDate: '2026-07-01', lastWorkingDate: '2026-07-15', reason: 'Better opportunity' },
        { id: 2, employeeName: 'Jane Smith', employeeCode: 'EMP002', employmentStatus: 'Terminated', resignationDate: '2026-06-20', lastWorkingDate: '2026-06-20', reason: 'Performance issues' }
      ];
      this.isLoading = false;
      this.cdr.markForCheck();
    }, 500);
  }

  refreshTable(): void {
    this.loadTableData();
  }

  onSubmit(): void {
    if (this.offboardingForm.invalid) {
      this.offboardingForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please fill in all required fields.'
      });
      return;
    }

    const formData = this.offboardingForm.value;
    console.log('Submitting Offboarding Details:', formData);

    // Find employee name for mock update
    const selectedEmp = this.employees.find(e => e.value === formData.employeeId);

    // Simulating API call
    this.offboardings = [{
      id: Date.now(),
      employeeName: selectedEmp ? selectedEmp.label.split(' - ')[0] : 'Unknown',
      employeeCode: selectedEmp ? selectedEmp.label.split(' - ')[1] : '-',
      ...formData
    }, ...this.offboardings];

    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Offboarding details submitted successfully.'
    });

    this.closeDrawer();
  }

  openDrawer(): void {
    this.offboardingForm.reset();
    this.showDrawer = true;
    this.cdr.markForCheck();
  }

  closeDrawer(): void {
    this.showDrawer = false;
    this.offboardingForm.reset();
    this.cdr.markForCheck();
  }
}
