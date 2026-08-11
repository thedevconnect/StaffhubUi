import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule, Table } from 'primeng/table';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { PayrollService } from '../../shared/services/payroll.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DrawerModule } from 'primeng/drawer';

import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

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
    InputTextModule,
    TooltipModule,
    ToastModule,
    DrawerModule,
    DialogModule
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

  @ViewChild('dt') dt: Table | undefined;

  selectedMonth: number;
  selectedYear: number;

  employees: any[] = [];
  selectedEmployee: any = null;
  displayDrawer: boolean = false;
  savingRowId: number | null = null;

  // Fix Salary Modal State
  displayFixSalaryModal: boolean = false;
  fixSalaryEmployee: any = null;
  fixSalaryAmount: number = 0;
  fixSalaryEffectiveDate: string = new Date().toISOString().split('T')[0];
  savingSalaryFix: boolean = false;

  // Payment Tracking Modal State
  displayPaymentModal: boolean = false;
  paymentEmployee: any = null;
  paymentAmount: number = 0;
  paymentMode: string = 'BANK_TRANSFER';
  paymentRef: string = '';
  paymentDate: string = new Date().toISOString().split('T')[0];
  paymentNotes: string = '';
  recordingPayment: boolean = false;

  paymentModeOptions = [
    { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
    { label: 'Cash', value: 'CASH' },
    { label: 'Cheque', value: 'CHEQUE' },
    { label: 'UPI / Online', value: 'UPI' }
  ];

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
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
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

  get totalEmployees(): number {
    return this.employees ? this.employees.length : 0;
  }

  get totalCurrentMonthPayable(): number {
    if (!this.employees) return 0;
    return this.employees.reduce((acc, curr) => acc + (Number(curr.calculated_salary) || 0), 0);
  }

  get totalCurrentMonthPaid(): number {
    if (!this.employees) return 0;
    return this.employees.reduce((acc, curr) => acc + (Number(curr.paid_amount) || 0), 0);
  }

  get totalCurrentMonthPending(): number {
    if (!this.employees) return 0;
    return this.employees.reduce((acc, curr) => acc + (Number(curr.pending_amount) || 0), 0);
  }

  filterGlobal(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    if (this.dt) {
      this.dt.filterGlobal(val, 'contains');
    }
  }

  onMonthYearChange() {
    this.selectedEmployee = null;
    this.displayDrawer = false;
    this.loadEmployees();
  }

  loadEmployees() {
    this.loading = true;
    this.cdr.markForCheck();
    this.payrollService.getEmployeesPayroll(this.selectedMonth, this.selectedYear).subscribe({
      next: (res) => {
        if (res.success) {
          const daysInMonth = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
          this.employees = res.data.map((emp: any) => {
            const base = (emp.base_salary !== null && emp.base_salary !== undefined) ? Number(emp.base_salary) : (emp.master_base_salary ? Number(emp.master_base_salary) : 0);
            const totalDays = emp.total_days || daysInMonth;
            const paidFromAttendance = (emp.paid_days !== null && emp.paid_days !== undefined) ? Number(emp.paid_days) : 0;
            const payable = (emp.status === 'Processed' && emp.payable_days !== null && emp.payable_days !== undefined)
              ? Number(emp.payable_days)
              : paidFromAttendance;

            const perDay = (base > 0 && totalDays > 0) ? Math.round((base / totalDays) * 100) / 100 : 0;
            const calc = Math.round((perDay * payable) * 100) / 100;
            const paid = Number(emp.paid_amount || 0);
            const pending = Math.max(0, Math.round((calc - paid) * 100) / 100);

            return {
              ...emp,
              base_salary: base,
              total_days: totalDays,
              payable_days: payable,
              per_day_salary: perDay,
              calculated_salary: calc,
              paid_amount: paid,
              pending_amount: pending
            };
          });
        } else {
          this.employees = [];
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load employees' });
        this.cdr.markForCheck();
      }
    });
  }

  calculateRowSalary(employee: any) {
    const totalDays = employee.total_days || new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    const base = Number(employee.base_salary) || 0;
    const payable = Number(employee.payable_days) || 0;

    if (totalDays > 0 && base >= 0) {
      employee.per_day_salary = Math.round((base / totalDays) * 100) / 100;
      employee.calculated_salary = Math.round((employee.per_day_salary * payable) * 100) / 100;
    } else {
      employee.per_day_salary = 0;
      employee.calculated_salary = 0;
    }

    const paid = Number(employee.paid_amount || 0);
    employee.pending_amount = Math.max(0, Math.round((employee.calculated_salary - paid) * 100) / 100);
    this.cdr.markForCheck();
  }

  saveRowPayroll(employee: any) {
    const empId = employee.id || employee.employee_id;
    if (!employee.base_salary || employee.base_salary <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: `Please enter a valid base salary for ${employee.first_name}` });
      return;
    }

    this.savingRowId = empId;
    this.cdr.markForCheck();
    this.payrollService.savePayroll(empId, this.selectedMonth, this.selectedYear, employee.base_salary, employee.payable_days).subscribe({
      next: (res) => {
        this.savingRowId = null;
        if (res.success) {
          if (!employee.status || employee.status === 'Pending') {
            employee.status = 'Draft';
          }
          this.messageService.add({ severity: 'success', summary: 'Success', detail: `Salary prepared for ${employee.first_name}` });
          if (this.selectedEmployee && (this.selectedEmployee.id === empId || this.selectedEmployee.employee_id === empId)) {
            this.loadEmployeeDetails(empId);
            this.loadEmployeeLedger(empId);
          }
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.savingRowId = null;
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save salary' });
        this.cdr.markForCheck();
      }
    });
  }

  // Fix Base Salary Modal Handlers
  openFixSalaryModal(employee: any) {
    this.fixSalaryEmployee = employee;
    this.fixSalaryAmount = Number(employee.base_salary || employee.master_base_salary || 0);
    this.fixSalaryEffectiveDate = employee.salary_effective_date
      ? new Date(employee.salary_effective_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    this.displayFixSalaryModal = true;
    this.cdr.markForCheck();
  }

  submitFixSalary() {
    if (!this.fixSalaryEmployee || !this.fixSalaryAmount || this.fixSalaryAmount <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please enter a valid monthly salary amount.' });
      return;
    }
    if (!this.fixSalaryEffectiveDate) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Effective From Date is mandatory.' });
      return;
    }

    const empId = this.fixSalaryEmployee.id || this.fixSalaryEmployee.employee_id;
    this.savingSalaryFix = true;
    this.cdr.markForCheck();

    this.payrollService.setBaseSalary(empId, this.fixSalaryAmount, this.fixSalaryEffectiveDate).subscribe({
      next: (res) => {
        this.savingSalaryFix = false;
        if (res.success) {
          this.messageService.add({ severity: 'success', summary: 'Salary Fixed', detail: `Fixed monthly salary updated with effective date ${this.fixSalaryEffectiveDate}` });
          this.displayFixSalaryModal = false;
          this.loadEmployees();
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.savingSalaryFix = false;
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fix monthly salary' });
        this.cdr.markForCheck();
      }
    });
  }

  // Record Payment Modal Handlers
  openPaymentModal(employee: any) {
    this.paymentEmployee = employee;
    this.paymentAmount = Number(employee.pending_amount || employee.calculated_salary || 0);
    this.paymentMode = 'BANK_TRANSFER';
    this.paymentRef = '';
    this.paymentDate = new Date().toISOString().split('T')[0];
    this.paymentNotes = '';
    this.displayPaymentModal = true;
    this.cdr.markForCheck();
  }

  submitRecordPayment() {
    if (!this.paymentEmployee || !this.paymentAmount || this.paymentAmount <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please enter a valid payment amount.' });
      return;
    }

    const payrollId = this.paymentEmployee.payroll_id;
    const empId = this.paymentEmployee.id || this.paymentEmployee.employee_id;

    this.recordingPayment = true;
    this.cdr.markForCheck();

    this.payrollService.recordPayment({
      payroll_id: payrollId,
      employee_id: empId,
      amount: this.paymentAmount,
      payment_mode: this.paymentMode,
      reference_number: this.paymentRef,
      payment_date: this.paymentDate,
      notes: this.paymentNotes
    }).subscribe({
      next: (res) => {
        this.recordingPayment = false;
        if (res.success) {
          this.messageService.add({ severity: 'success', summary: 'Payment Recorded', detail: 'Salary payment recorded successfully.' });
          this.displayPaymentModal = false;
          this.loadEmployees();
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.recordingPayment = false;
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to record payment' });
        this.cdr.markForCheck();
      }
    });
  }

  openEmployeeDetail(employee: any) {
    this.selectedEmployee = employee;
    this.baseSalary = employee.base_salary ? Number(employee.base_salary) : 0;
    const employeeId = employee.id || employee.employee_id;
    this.displayDrawer = true;
    this.cdr.markForCheck();
    this.loadEmployeeDetails(employeeId);
    this.loadEmployeeLedger(employeeId);
  }

  loadEmployeeDetails(employeeId: number) {
    this.detailsLoading = true;
    this.cdr.markForCheck();
    this.payrollService.getEmployeePayrollDetails(employeeId, this.selectedMonth, this.selectedYear).subscribe({
      next: (res) => {
        if (res.success) {
          const data = res.data;
          this.attendanceDetails = data.attendance?.details || [];
          this.payrollSummary = data.attendance?.summary || {};

          this.totalDays = data.total_days || new Date(this.selectedYear, this.selectedMonth, 0).getDate();
          this.workingDays = this.totalDays;

          const paidDaysFromAttendance = this.payrollSummary['Paid Days'] !== undefined
            ? Number(this.payrollSummary['Paid Days'])
            : (data.payable_days || 0);

          if (data.payroll && data.payroll.status === 'Processed' && data.payroll.payable_days !== null && data.payroll.payable_days !== undefined) {
            this.payableDays = Number(data.payroll.payable_days);
          } else {
            this.payableDays = Number(paidDaysFromAttendance);
          }

          if (data.payroll && data.payroll.calculated_salary) {
            this.calculatedSalary = parseFloat(data.payroll.calculated_salary);
          } else {
            this.calculateSalary();
          }
        }
        this.detailsLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.detailsLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load details' });
        this.cdr.markForCheck();
      }
    });
  }

  loadEmployeeLedger(employeeId: number) {
    this.ledgerLoading = true;
    this.cdr.markForCheck();
    this.payrollService.getEmployeePayrollLedger(employeeId).subscribe({
      next: (res) => {
        if (res.success) {
          this.ledgerHistory = res.data.history || [];
          this.ledgerStats.totalDisbursed = res.data.totalDisbursed || 0;
          this.ledgerStats.yearlyDisbursed = res.data.yearlyDisbursed || 0;
        }
        this.ledgerLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Ledger error:', err);
        this.ledgerLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  calculateSalary() {
    if (this.totalDays > 0) {
      const perDay = Math.round((this.baseSalary / this.totalDays) * 100) / 100;
      this.calculatedSalary = Math.round((perDay * this.payableDays) * 100) / 100;
    } else {
      this.calculatedSalary = 0;
    }
    this.cdr.markForCheck();
  }

  onBaseSalaryChange() {
    this.calculateSalary();
    if (this.selectedEmployee) {
      this.selectedEmployee.base_salary = this.baseSalary;
      this.calculateRowSalary(this.selectedEmployee);
    }
  }

  submitCustomPayroll() {
    if (!this.selectedEmployee) return;

    if (this.baseSalary <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please enter a valid base salary' });
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();
    const employeeId = this.selectedEmployee.id || this.selectedEmployee.employee_id;

    this.payrollService.savePayroll(employeeId, this.selectedMonth, this.selectedYear, this.baseSalary, this.payableDays).subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Salary processed and saved successfully!' });
          this.selectedEmployee.status = 'Draft';
          this.selectedEmployee.base_salary = this.baseSalary;
          this.selectedEmployee.payable_days = this.payableDays;
          this.calculateRowSalary(this.selectedEmployee);
          this.loadEmployeeDetails(employeeId);
          this.loadEmployeeLedger(employeeId);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.saving = false;
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to process salary' });
        this.cdr.markForCheck();
      }
    });
  }

  processAllPayroll() {
    this.processing = true;
    this.cdr.markForCheck();
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
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.processing = false;
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to process payroll' });
        this.cdr.markForCheck();
      }
    });
  }

  downloadSlip(historyRow?: any) {
    if (!this.selectedEmployee) return;
    this.downloadSlipForEmployee(this.selectedEmployee, historyRow);
  }

  downloadSlipForEmployee(emp: any, historyRow?: any) {
    if (!emp) return;

    const doc = new jsPDF();
    const targetMonth = historyRow ? historyRow.month : this.selectedMonth;
    const targetYear = historyRow ? historyRow.year : this.selectedYear;

    const monthName = this.months.find(m => m.value === Number(targetMonth))?.label || '';
    const totalDays = historyRow ? historyRow.total_days : (emp.total_days || new Date(targetYear, targetMonth, 0).getDate());
    const targetBase = historyRow ? Number(historyRow.base_salary) : Number(emp.base_salary || 0);
    const targetPayableDays = historyRow ? Number(historyRow.payable_days) : Number(emp.payable_days || 0);

    const perDayRate = totalDays > 0 ? Math.round((targetBase / totalDays) * 100) / 100 : 0;
    const targetCalc = historyRow ? Number(historyRow.calculated_salary) : Number(emp.calculated_salary || 0);
    const paidAmt = historyRow ? Number(historyRow.paid_amount || 0) : Number(emp.paid_amount || 0);
    const pendingAmt = historyRow ? Number(historyRow.pending_amount || 0) : Number(emp.pending_amount || 0);

    // Header
    doc.setFontSize(20);
    doc.text('Salary Slip', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`For the month of ${monthName} ${targetYear}`, 105, 30, { align: 'center' });

    doc.line(14, 35, 196, 35);

    // Employee Details
    doc.setFontSize(10);
    doc.text(`Employee Name: ${emp.first_name} ${emp.last_name || ''}`, 14, 45);
    doc.text(`Employee Code: ${emp.emp_code || 'N/A'}`, 14, 52);

    doc.text(`Total Month Days: ${totalDays}`, 140, 45);
    doc.text(`Final Attendance Paid Days: ${targetPayableDays}`, 140, 52);

    // Salary Details Table
    const tableData = [
      ['Fixed Monthly Base Salary', `Rs. ${targetBase.toFixed(2)}`],
      ['Total Calendar Days in Month', `${totalDays} Days`],
      ['Per Day Salary Rate', `Rs. ${perDayRate.toFixed(2)} / day`],
      ['Paid Days (Final Attendance)', `${targetPayableDays} Days`],
      ['Total Payable Salary', `Rs. ${targetCalc.toFixed(2)}`],
      ['Total Paid Amount', `Rs. ${paidAmt.toFixed(2)}`],
      ['Remaining Pending Amount', `Rs. ${pendingAmt.toFixed(2)}`]
    ];

    autoTable(doc, {
      startY: 65,
      head: [['Salary Calculation Parameter', 'Value']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 120;
    doc.setFontSize(11);
    doc.text(`Net Payable Salary: Rs. ${targetCalc.toFixed(2)}`, 14, finalY + 15);
    doc.text(`Status: ${historyRow ? historyRow.status : (emp.status || 'Draft')}`, 140, finalY + 15);

    doc.save(`Salary_Slip_${emp.first_name}_${monthName}_${targetYear}.pdf`);
  }

  exportFullSalaryReportPDF() {
    if (!this.employees || this.employees.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Export Warning', detail: 'No salary records to export.' });
      return;
    }

    const doc = new jsPDF('l', 'mm', 'a4');
    const monthName = this.months.find(m => m.value === Number(this.selectedMonth))?.label || '';

    doc.setFontSize(16);
    doc.text('Monthly Employee Salary & Payment Ledger Summary', 14, 15);
    doc.setFontSize(10);
    doc.text(`Period: ${monthName} ${this.selectedYear}  |  Total Employees: ${this.employees.length}`, 14, 22);

    const tableHead = [['#', 'Emp Code', 'Employee Name', 'Month', 'Base Salary (Rs)', 'Total Days', 'Paid Days', 'Per Day Rate (Rs)', 'Payable (Rs)', 'Paid (Rs)', 'Pending (Rs)', 'Status']];

    const tableBody = this.employees.map((emp, index) => [
      index + 1,
      emp.emp_code || 'N/A',
      `${emp.first_name} ${emp.last_name || ''}`,
      `${String(this.selectedMonth).padStart(2, '0')}/${this.selectedYear}`,
      Number(emp.base_salary || 0).toFixed(2),
      emp.total_days || 30,
      emp.payable_days || 0,
      Number(emp.per_day_salary || 0).toFixed(2),
      Number(emp.calculated_salary || 0).toFixed(2),
      Number(emp.paid_amount || 0).toFixed(2),
      Number(emp.pending_amount || 0).toFixed(2),
      emp.status || 'Draft'
    ]);

    autoTable(doc, {
      startY: 28,
      head: tableHead,
      body: tableBody,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.setFontSize(9);
    doc.text(`Total Monthly Payable: Rs. ${this.totalCurrentMonthPayable.toFixed(2)}  |  Total Paid: Rs. ${this.totalCurrentMonthPaid.toFixed(2)}  |  Total Pending: Rs. ${this.totalCurrentMonthPending.toFixed(2)}`, 14, finalY + 10);

    doc.save(`Monthly_Salary_Report_${monthName}_${this.selectedYear}.pdf`);
  }
}
