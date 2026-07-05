import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Breadcrumb } from 'primeng/breadcrumb';

@Component({
  selector: 'app-payroll-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TableModule,
    Breadcrumb,
    RouterLink,
    RouterModule
  ],
  templateUrl: './payroll-dashboard.html',
  styleUrl: './payroll-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PayrollDashboard {
  breadcrumbItems: any[] = [
    { label: 'Payroll Management', icon: 'pi pi-home', routerLink: '/payroll' },
    { label: 'Dashboard', icon: 'pi pi-chart-bar', routerLink: '/payroll/payroll-dashboard' }
  ];

  stats = [
    { label: 'Total Salary Disbursed (June)', value: '₹42,85,600', icon: 'pi pi-wallet', color: 'bg-blue-50 text-blue-600' },
    { label: 'Employees Processed', value: '148', icon: 'pi pi-users', color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Pending Approvals', value: '0', icon: 'pi pi-check-circle', color: 'bg-amber-50 text-amber-600' },
    { label: 'Tax & PF Contributions', value: '₹8,42,100', icon: 'pi pi-shield', color: 'bg-indigo-50 text-indigo-600' }
  ];

  payrollHistory = [
    { month: 'June 2026', gross: '₹48,50,200', deductions: '₹5,64,600', net: '₹42,85,600', count: '148', status: 'Disbursed' },
    { month: 'May 2026', gross: '₹46,20,500', deductions: '₹5,10,200', net: '₹41,10,300', count: '142', status: 'Disbursed' },
    { month: 'April 2026', gross: '₹46,20,500', deductions: '₹5,10,200', net: '₹41,10,300', count: '142', status: 'Disbursed' }
  ];

  activeModules = [
    {
      title: 'Monthly Salary',
      desc: 'Calculate monthly wages, generate salary slips, and disburse bank transfers.',
      route: '/payroll/monthly-salary',
      icon: 'pi-file-excel',
      color: 'from-blue-500 to-indigo-600'
    }
  ];

  upcomingModules = [
    { title: 'Employee Salary Preparation', desc: 'Define pay structures, regular allowances, and individual variables.' },
    { title: 'Monthly Salary Preparation', desc: 'Consolidate attendance records, leaves, and calculate gross figures.' },
    { title: 'Monthly Salary Approval', desc: 'Review calculated payroll values and authorize final fund disbursements.' },
    { title: 'Monthly Salary Components', desc: 'Configure customized basic, HRA, allowance, and tax structures.' },
    { title: 'Yearly Salary Components', desc: 'Oversee yearly bonuses, gratuity, and LTA allocations.' },
    { title: 'Employee Expense Statement', desc: 'Process tour reimbursements, travel fares, and local conveyances.' }
  ];
}
