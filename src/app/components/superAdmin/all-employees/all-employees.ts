import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { EmployeeManagementService } from '../../../shared/services/employee-management.service';
import { Employee } from '../../../shared/services/models/employee.model';
import { MessageService } from 'primeng/api';
import { DataTableComponent, ColumnDefinition } from '../../../shared/components/data-table/data-table.component';
import { DrawerModule } from 'primeng/drawer';
import { ExcelService } from '../../../shared/services/excel.service';

@Component({
  selector: 'app-superadmin-all-employees',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DataTableComponent,
    DrawerModule
  ],
  templateUrl: './all-employees.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AllEmployeesComponent implements OnInit {
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  isLoading: boolean = false;
  searchQuery: string = '';

  columns: ColumnDefinition[] = [
    { key: 'employeeCode', header: 'Emp Code', type: 'text' },
    { key: 'fullName', header: 'Employee Name', type: 'text' },
    { key: 'companyName', header: 'Company', type: 'text' },
    { key: 'officialEmail', header: 'Email', type: 'text' },
    { key: 'mobileNumber', header: 'Mobile', type: 'text' },
    { key: 'role', header: 'Role', type: 'text' },
    { key: 'status', header: 'status', type: 'status' },
    { key: 'actions', header: 'Actions', type: 'action' }
  ];

  isDrawerVisible: boolean = false;
  selectedEmployee: Employee | null = null;

  constructor(
    private readonly employeeService: EmployeeManagementService,
    private readonly cdr: ChangeDetectorRef,
    private readonly messageService: MessageService,
    private readonly excelService: ExcelService
  ) { }

  ngOnInit() {
    this.fetchEmployees();
  }

  fetchEmployees() {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.employeeService.getGlobalEmployees().subscribe({
      next: (res) => {
        this.employees = res.map(e => ({
          ...e,
          // Format status so DataTable can color it correctly if it expects 'Active' instead of 'ACTIVE'
          status: e.status ? e.status.charAt(0).toUpperCase() + e.status.slice(1).toLowerCase() : 'Unknown'
        }));
        this.filteredEmployees = [...this.employees];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch employees' });
        this.cdr.markForCheck();
      }
    });
  }

  handleSearch(query: string) {
    this.searchQuery = query;
    if (!query) {
      this.filteredEmployees = [...this.employees];
    } else {
      const q = query.toLowerCase();
      this.filteredEmployees = this.employees.filter(emp => 
        (emp.fullName && emp.fullName.toLowerCase().includes(q)) ||
        (emp.employeeCode && emp.employeeCode.toLowerCase().includes(q)) ||
        (emp.officialEmail && emp.officialEmail.toLowerCase().includes(q)) ||
        (emp.companyName && emp.companyName.toLowerCase().includes(q))
      );
    }
    this.cdr.markForCheck();
  }

  handleView(employee: Employee) {
    this.selectedEmployee = employee;
    this.isDrawerVisible = true;
    this.cdr.markForCheck();
  }

  exportExcel() {
    const exportData = this.filteredEmployees.map(emp => ({
      'Emp Code': emp.employeeCode || emp.emp_id || '',
      'Employee Name': emp.fullName || emp.full_name || '',
      'Company': emp.companyName || emp.company_name || '',
      'Email': emp.officialEmail || emp.email || '',
      'Mobile': emp.mobileNumber || emp.mobile || '',
      'Role': emp.role || '',
      'Status': emp.status || ''
    }));

    this.excelService.exportAsExcelFile(exportData, 'All_Employees_List');
  }

  onRefresh() {
    this.fetchEmployees();
  }
}
