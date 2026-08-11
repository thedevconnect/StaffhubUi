import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { Breadcrumb } from 'primeng/breadcrumb';
import { PayrollService } from '../../shared/services/payroll.service';

@Component({
  selector: 'app-payroll-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    Breadcrumb,
    RouterLink
  ],
  templateUrl: './payroll-dashboard.html',
  styleUrl: './payroll-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PayrollDashboard implements OnInit {
  private payrollService = inject(PayrollService);
  private cdr = inject(ChangeDetectorRef);

  breadcrumbItems: any[] = [
    { label: 'Payroll Management', icon: 'pi pi-home', routerLink: '/payroll' },
    { label: 'Dashboard', icon: 'pi pi-chart-bar', routerLink: '/payroll/payroll-dashboard' }
  ];

  stats: any[] = [];
  employeeWiseSummary: any[] = [];

  activeModules = [
    {
      title: 'Employee Salary Preparation',
      desc: 'Calculate monthly wages, manage payable days, generate salary slips, and disburse salaries.',
      route: '/payroll/employee-salary-preparation',
      icon: 'pi-user-edit',
      color: 'from-emerald-500 to-teal-600'
    },
    {
      title: 'Yearly Salary Components',
      desc: 'Oversee yearly bonuses, gratuity, Statutory Funds, and annual allowances.',
      route: '/payroll/yearly-salary-components',
      icon: 'pi-calendar',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Employee Expense Statement',
      desc: 'Process tour reimbursements, travel fares, and local conveyances.',
      route: '/payroll/employee-expense-statement',
      icon: 'pi-file-excel',
      color: 'from-purple-500 to-indigo-600'
    }
  ];

  ngOnInit(): void {
    this.loadDashboardSummary();
  }

  loadDashboardSummary(): void {
    this.payrollService.getDashboardSummary().subscribe({
      next: (res) => {
        if (res && res.data) {
          const d = res.data;
          const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

          this.stats = [
            {
              label: 'Total Employees',
              value: String(d.totalEmployees || 0),
              icon: 'pi pi-users',
              color: 'bg-indigo-50 text-indigo-600'
            },
            {
              label: 'Current Month Payroll',
              value: fmt.format(d.currentMonthPayroll || 0),
              icon: 'pi pi-calendar',
              color: 'bg-blue-50 text-blue-600'
            },
            {
              label: 'Total Salary Payable',
              value: fmt.format(d.totalSalary || 0),
              icon: 'pi pi-wallet',
              color: 'bg-emerald-50 text-emerald-600'
            },
            {
              label: 'Total Paid Amount',
              value: fmt.format(d.totalPaid || 0),
              icon: 'pi pi-check-circle',
              color: 'bg-teal-50 text-teal-600'
            },
            {
              label: 'Total Pending Amount',
              value: fmt.format(d.totalPending || 0),
              icon: 'pi pi-exclamation-circle',
              color: 'bg-rose-50 text-rose-600'
            }
          ];

          this.employeeWiseSummary = d.employeeWise || [];
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.error('Error fetching payroll dashboard summary:', err);
      }
    });
  }
}
