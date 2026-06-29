import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuItem, MessageService } from 'primeng/api';
import { TableTemplate, TableColumn } from '../../../shared/ui/table-template/table-template';
import { DrawerModule } from 'primeng/drawer';
import { AppBreadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-monthly-salary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableTemplate,
    DrawerModule,
    AppBreadcrumb,
    DialogModule,
    DatePickerModule,
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './monthly-salary.html',
  styleUrl: './monthly-salary.scss',
})
export class MonthlySalary {
  breadcrumbItems: any[] = [
    { label: 'Payroll Management', url: '#' },
    { label: 'Monthly Salary' },
  ];

  monthlySalary: any[] = [];
  columns: TableColumn[] = [
    { key: 'employeeName', header: 'Employee Name', isVisible: true },
    { key: 'salaryMonth', header: 'Month', isVisible: true },
    { key: 'netSalary', header: 'Net Salary', isVisible: true },
  ];
  pageSize = 10;
  totalCount = 0;
  loading = signal(false);
  pageNo = 1;
  searchText = '';

  runSalaryDialog = false;
  selectedMonth: Date = new Date();

  openRunSalaryDialog(): void {
    this.runSalaryDialog = true;
  }

  confirmRunSalary(): void {
    this.runSalaryDialog = false;
  }

  onPageChange(event: number): void {
    this.pageNo = event;
  }

  onPageSizeChange(event: number): void {
    this.pageSize = event;
  }

  onSortChange(event: any): void {
    console.log('Sort:', event);
  }

  onDelete(event: any): void {
    console.log('Delete:', event);
  }

  onEdit(event: any): void {
    console.log('Edit:', event);
  }

  onSearchChange(event: string): void {
    this.searchText = event;
  }

  loadDashboardData(): void {
    console.log('Load dashboard data');
  }
}
