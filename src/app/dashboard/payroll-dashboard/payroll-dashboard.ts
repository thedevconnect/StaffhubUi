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
  payrollHistory: any[] = [];

  activeModules = [
    {
      title: 'Employee Salary Preparation',
      desc: 'Define pay structures, regular allowances, and individual variables.',
      route: '/payroll/employee-salary-preparation',
      icon: 'pi-user-edit',
      color: 'from-emerald-500 to-teal-600'
    },
    {
      title: 'Monthly Salary',
      desc: 'Calculate monthly wages, generate salary slips, and disburse bank transfers.',
      route: '/payroll/monthly-salary',
      icon: 'pi-file-excel',
      color: 'from-blue-500 to-indigo-600'
    }
  ];

  upcomingModules = [
    { title: 'Monthly Salary Preparation', desc: 'Consolidate attendance records, leaves, and calculate gross figures.' },
    { title: 'Monthly Salary Approval', desc: 'Review calculated payroll values and authorize final fund disbursements.' },
    { title: 'Monthly Salary Components', desc: 'Configure customized basic, HRA, allowance, and tax structures.' },
    { title: 'Yearly Salary Components', desc: 'Oversee yearly bonuses, gratuity, and LTA allocations.' },
    { title: 'Employee Expense Statement', desc: 'Process tour reimbursements, travel fares, and local conveyances.' }
  ];

  ngOnInit(): void {
    this.loadDashboardSummary();
  }

  loadDashboardSummary(): void {
    this.payrollService.getDashboardSummary().subscribe({
      next: (res) => {
        if (res && res.data) {
          const d = res.data;
          const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

          this.stats = [
            {
              label: 'Total Salary Disbursed',
              value: d.totalDisbursed ? currencyFormatter.format(d.totalDisbursed) : '₹0',
              icon: 'pi pi-wallet',
              color: 'bg-blue-50 text-blue-600'
            },
            {
              label: 'Employees Processed',
              value: String(d.processedCount || d.totalEmployees || 0),
              icon: 'pi pi-users',
              color: 'bg-emerald-50 text-emerald-600'
            },
            {
              label: 'Pending Approvals',
              value: String(d.pendingApprovals || 0),
              icon: 'pi pi-check-circle',
              color: 'bg-amber-50 text-amber-600'
            },
            {
              label: 'Tax & PF Contributions',
              value: d.taxPfContributions ? currencyFormatter.format(d.taxPfContributions) : '₹0',
              icon: 'pi pi-shield',
              color: 'bg-indigo-50 text-indigo-600'
            }
          ];

          if (d.payrollHistory && d.payrollHistory.length > 0) {
            this.payrollHistory = d.payrollHistory.map((h: any) => ({
              month: h.month,
              gross: currencyFormatter.format(h.gross || 0),
              deductions: currencyFormatter.format(h.deductions || 0),
              net: currencyFormatter.format(h.net || 0),
              count: String(h.count || 0),
              status: h.status || 'Disbursed'
            }));
          } else {
            this.payrollHistory = [];
          }

          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.error('Error fetching payroll dashboard summary:', err);
      }
    });
  }
}
