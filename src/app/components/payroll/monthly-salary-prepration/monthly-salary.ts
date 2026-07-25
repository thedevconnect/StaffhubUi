import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
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
    TableModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './monthly-salary.html',
  styleUrl: './monthly-salary.scss',
})
export class MonthlySalary implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  breadcrumbItems: any[] = [
    { label: 'Payroll Management', icon: 'pi pi-home', routerLink: '/payroll' },
    { label: 'Monthly Salary Preparation', icon: 'pi pi-money-bill' },
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

  get daysInSelectedMonth(): number {
    if (!this.selectedMonth || !this.selectedYear) return 30;
    return new Date(this.selectedYear, this.selectedMonth, 0).getDate();
  }

  get totalGrossSalary(): number {
    return this.monthlySalary.reduce((acc, emp) => acc + Number(emp.master_base_salary || emp.base_salary || 0), 0);
  }

  get totalNetSalary(): number {
    return this.monthlySalary.reduce((acc, emp) => acc + Number(emp.calculated_salary || 0), 0);
  }

  calculateRowSalary(emp: any): void {
    const base = Number(emp.master_base_salary || emp.base_salary || 0);
    const totalDays = Number(emp.total_days || this.daysInSelectedMonth);
    const payableDays = Number(emp.payable_days || 0);

    if (totalDays > 0 && base >= 0) {
      emp.per_day_rate = Math.round((base / totalDays) * 100) / 100;
      emp.calculated_salary = Math.round((emp.per_day_rate * payableDays) * 100) / 100;
    } else {
      emp.per_day_rate = 0;
      emp.calculated_salary = 0;
    }
  }

  loadSalaryData(): void {
    this.loading = true;
    this.payrollService.getEmployeesPayroll(this.selectedMonth, this.selectedYear).subscribe({
      next: (res) => {
        if (res.success) {
          this.monthlySalary = (res.data || []).map((emp: any) => {
            const baseSalary = Number(emp.master_base_salary || emp.base_salary || 0);
            emp.master_base_salary = baseSalary;
            emp.total_days = emp.total_days || this.daysInSelectedMonth;
            this.calculateRowSalary(emp);
            return emp;
          });
        } else {
          this.monthlySalary = [];
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load salary data' });
        this.loading = false;
        this.monthlySalary = [];
        this.cdr.markForCheck();
      }
    });
  }

  saveEmployeeSalary(emp: any): void {
    const base = Number(emp.master_base_salary || emp.base_salary || 0);
    const empId = emp.employee_id || emp.id;
    const payableDays = Number(emp.payable_days || 0);

    emp.saving = true;
    this.payrollService.savePayroll(empId, this.selectedMonth, this.selectedYear, base, payableDays).subscribe({
      next: (res) => {
        emp.saving = false;
        if (res && res.success) {
          emp.status = 'Draft';
          this.calculateRowSalary(emp);
          this.messageService.add({
            severity: 'success',
            summary: 'Salary Saved',
            detail: `Monthly salary saved for ${emp.first_name || emp.full_name || 'Employee'}`
          });
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        emp.saving = false;
        console.error('Error saving salary:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save employee salary' });
        this.cdr.markForCheck();
      }
    });
  }

  processAllPayroll(): void {
    const hasDrafts = this.monthlySalary.some(emp => emp.status === 'Draft' || !emp.status);
    
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
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to process payroll' });
        this.processing = false;
        this.cdr.markForCheck();
      }
    });
  }
}
