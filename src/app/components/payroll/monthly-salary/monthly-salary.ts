import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { PayrollService } from '../../../shared/services/payroll.service';

@Component({
  selector: 'app-monthly-salary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbModule,
    SelectModule,
    ButtonModule,
    ToastModule,
    TableModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './monthly-salary.html',
  styleUrl: './monthly-salary.scss',
})
export class MonthlySalary implements OnInit {
  breadcrumbItems: any[] = [
    { label: 'Payroll Management', icon: 'pi pi-home', routerLink: '/payroll' },
    { label: 'Monthly Salary', icon: 'pi pi-money-bill' },
  ];

  months = [
    { label: 'January', value: 1 },
    { label: 'February', value: 2 },
    { label: 'March', value: 3 },
    { label: 'April', value: 4 },
    { label: 'May', value: 5 },
    { label: 'June', value: 6 },
    { label: 'July', value: 7 },
    { label: 'August', value: 8 },
    { label: 'September', value: 9 },
    { label: 'October', value: 10 },
    { label: 'November', value: 11 },
    { label: 'December', value: 12 },
  ];

  years: any[] = [];
  selectedMonth: number;
  selectedYear: number;

  monthlySalary: any[] = [];
  loading: boolean = false;
  processing: boolean = false;

  constructor(
    private payrollService: PayrollService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    const today = new Date();
    this.selectedMonth = today.getMonth() + 1;
    this.selectedYear = today.getFullYear();
    
    // Generate last 5 years up to next year
    for (let i = this.selectedYear - 5; i <= this.selectedYear + 1; i++) {
      this.years.push({ label: i.toString(), value: i });
    }
  }

  ngOnInit(): void {
    this.loadSalaryData();
  }

  onMonthYearChange(): void {
    this.loadSalaryData();
  }

  loadSalaryData(): void {
    this.loading = true;
    this.payrollService.getEmployeesPayroll(this.selectedMonth, this.selectedYear).subscribe({
      next: (res) => {
        if (res.success) {
          this.monthlySalary = res.data || [];
        } else {
          this.monthlySalary = [];
        }
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load salary data' });
        this.loading = false;
        this.monthlySalary = [];
      }
    });
  }

  processAllPayroll(): void {
    const hasDrafts = this.monthlySalary.some(emp => emp.status === 'Draft');
    
    if (!hasDrafts) {
      this.messageService.add({ severity: 'info', summary: 'Info', detail: 'No draft salaries to process for this month.' });
      return;
    }

    this.processing = true;
    this.payrollService.processPayroll(this.selectedMonth, this.selectedYear).subscribe({
      next: (res) => {
        if (res.success) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: res.message || 'Payroll processed successfully!' });
          this.loadSalaryData();
        }
        this.processing = false;
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to process payroll' });
        this.processing = false;
      }
    });
  }
}
