import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PayrollService } from '../../shared/services/payroll.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { DrawerModule } from 'primeng/drawer';

@Component({
  selector: 'app-employee-salary-preparation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbModule,
    ButtonModule,
    SelectModule,
    TableModule,
    InputNumberModule,
    ToastModule,
    DrawerModule
  ],
  providers: [MessageService],
  templateUrl: './employee-salary-preparation.html',
  styleUrl: './employee-salary-preparation.scss'
})
export class EmployeeSalaryPreparation implements OnInit, OnDestroy {
  breadcrumbItems = [
    { label: 'Payroll', icon: 'pi pi-home', routerLink: '/payroll' },
    { label: 'Processes', icon: 'pi pi-sync' },
    { label: 'Employee Salary Preparation', icon: 'pi pi-user-edit' }
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
    { label: 'December', value: 12 }
  ];

  years: any[] = [];

  selectedMonth: number;
  selectedYear: number;

  employees: any[] = [];
  selectedEmployee: any = null;

  attendanceDetails: any[] = [];
  payrollSummary: any = null;

  baseSalary: number = 0;
  totalDays: number = 0;
  workingDays: number = 0;
  payableDays: number = 0;
  calculatedSalary: number = 0;

  loading: boolean = false;
  detailsLoading: boolean = false;
  saving: boolean = false;
  processing: boolean = false;

  ledgerHistory: any[] = [];
  ledgerStats: any = { totalDisbursed: 0, yearlyDisbursed: 0 };
  ledgerLoading: boolean = false;

  constructor(
    private payrollService: PayrollService,
    private messageService: MessageService
  ) {
    const today = new Date();
    this.selectedMonth = today.getMonth() + 1;
    this.selectedYear = today.getFullYear();

    for (let i = this.selectedYear - 2; i <= this.selectedYear + 1; i++) {
      this.years.push({ label: i.toString(), value: i });
    }
  }

  ngOnInit() {
    this.loadEmployees();
  }

  ngOnDestroy() { }

  onMonthYearChange() {
    this.selectedEmployee = null;
    this.loadEmployees();
  }

  loadEmployees() {
    this.loading = true;
    this.payrollService.getEmployeesPayroll(this.selectedMonth, this.selectedYear).subscribe({
      next: (res) => {
        if (res.success) {
          this.employees = res.data;
        } else {
          this.employees = [];
        }
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load employees' });
      }
    });
  }

  onEmployeeSelect() {
    if (!this.selectedEmployee) return;
    this.baseSalary = this.selectedEmployee.master_base_salary ? parseFloat(this.selectedEmployee.master_base_salary) : 0;
    const employeeId = this.selectedEmployee.id || this.selectedEmployee.employee_id;
    this.loadEmployeeDetails(employeeId);
    this.loadEmployeeLedger(employeeId);
  }

  loadEmployeeDetails(employeeId: number) {
    this.detailsLoading = true;
    this.payrollService.getEmployeePayrollDetails(employeeId, this.selectedMonth, this.selectedYear).subscribe({
      next: (res) => {
        if (res.success) {
          const data = res.data;
          this.attendanceDetails = data.attendance?.details || [];
          this.payrollSummary = data.attendance?.summary || {};

          this.totalDays = data.total_days || 0;
          this.payableDays = data.payable_days || 0;
          
          let sundays = 0;
          for (let i = 1; i <= this.totalDays; i++) {
            if (new Date(this.selectedYear, this.selectedMonth - 1, i).getDay() === 0) sundays++;
          }
          this.workingDays = this.totalDays - sundays;

          if (data.payroll && data.payroll.calculated_salary) {
            this.calculatedSalary = parseFloat(data.payroll.calculated_salary);
          } else {
            this.calculateSalary();
          }
        }
        this.detailsLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.detailsLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load details' });
      }
    });
  }

  loadEmployeeLedger(employeeId: number) {
    this.ledgerLoading = true;
    this.payrollService.getEmployeePayrollLedger(employeeId).subscribe({
      next: (res) => {
        if (res.success) {
          this.ledgerHistory = res.data.history || [];
          this.ledgerStats.totalDisbursed = res.data.totalDisbursed || 0;
          this.ledgerStats.yearlyDisbursed = res.data.yearlyDisbursed || 0;
        }
        this.ledgerLoading = false;
      },
      error: (err) => {
        console.error('Ledger error:', err);
        this.ledgerLoading = false;
      }
    });
  }

  calculateSalary() {
    if (this.totalDays > 0) {
      this.calculatedSalary = Math.round(((this.baseSalary / this.totalDays) * this.payableDays) * 100) / 100;
    } else {
      this.calculatedSalary = 0;
    }
  }

  onBaseSalaryChange() {
    this.calculateSalary();
  }

  submitCustomPayroll() {
    if (!this.selectedEmployee) return;

    if (this.baseSalary <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please enter a valid base salary' });
      return;
    }

    this.saving = true;
    const employeeId = this.selectedEmployee.id || this.selectedEmployee.employee_id;

    this.payrollService.savePayroll(employeeId, this.selectedMonth, this.selectedYear, this.baseSalary, this.payableDays).subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Salary processed and saved successfully!' });
          this.loadEmployees();
          this.loadEmployeeDetails(employeeId);
          this.loadEmployeeLedger(employeeId);
          this.selectedEmployee.status = 'Draft';
        }
      },
      error: (err) => {
        this.saving = false;
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to process salary' });
      }
    });
  }



  processAllPayroll() {
    this.processing = true;
    this.payrollService.processPayroll(this.selectedMonth, this.selectedYear).subscribe({
      next: (res) => {
        this.processing = false;
        if (res.success) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: res.message });
          this.loadEmployees();
          if (this.selectedEmployee) {
            this.selectedEmployee.status = 'Processed';
            this.loadEmployeeLedger(this.selectedEmployee.id || this.selectedEmployee.employee_id);
          }
        }
      },
      error: (err) => {
        this.processing = false;
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to process payroll' });
      }
    });
  }

  downloadSlip(historyRow?: any) {
    if (!this.selectedEmployee) return;

    const doc = new jsPDF();
    const targetMonth = historyRow ? historyRow.month : this.selectedMonth;
    const targetYear = historyRow ? historyRow.year : this.selectedYear;
    const targetCalc = historyRow ? historyRow.calculated_salary : this.calculatedSalary;
    const targetBase = historyRow ? historyRow.base_salary : this.baseSalary;
    const targetDays = historyRow ? historyRow.total_days : this.totalDays;
    const targetPayable = historyRow ? historyRow.payable_days : this.payableDays;

    const monthName = this.months.find(m => m.value === Number(targetMonth))?.label || '';

    // Header
    doc.setFontSize(20);
    doc.text('Salary Slip', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`For the month of ${monthName} ${targetYear}`, 105, 30, { align: 'center' });

    doc.line(14, 35, 196, 35);

    // Employee Details
    doc.setFontSize(10);
    doc.text(`Employee Name: ${this.selectedEmployee.first_name} ${this.selectedEmployee.last_name}`, 14, 45);
    doc.text(`Employee Code: ${this.selectedEmployee.emp_code || 'N/A'}`, 14, 52);

    doc.text(`Total Days: ${targetDays}`, 140, 45);
    doc.text(`Payable Days: ${targetPayable}`, 140, 52);

    // Salary Details Table
    const tableData = [
      ['Base Salary', `Rs. ${Number(targetBase).toFixed(2)}`],
      ['Calculated Salary', `Rs. ${Number(targetCalc).toFixed(2)}`]
    ];

    autoTable(doc, {
      startY: 65,
      head: [['Description', 'Amount']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.setFontSize(10);
    doc.text(`Net Payable: Rs. ${Number(targetCalc).toFixed(2)}`, 14, finalY + 15);

    doc.save(`Salary_Slip_${this.selectedEmployee.first_name}_${monthName}_${targetYear}.pdf`);
  }
}
