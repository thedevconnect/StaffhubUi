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

  integratedFeatures = [
    {
      title: 'Seamless Workforce Sync',
      desc: 'Seamlessly sync employee details—like name, designation, date of joining, department, and custom fields—directly from StaffHub HRMS into the payroll engine.',
      icon: 'pi pi-sync',
      badge: 'Real-time Sync',
      color: 'text-blue-600 bg-blue-50 border-blue-100'
    },
    {
      title: 'Faster Payroll & LOP Calculation',
      desc: 'Enjoy quick, error-free payroll processing by auto-fetching exact days worked, Loss of Pay (LOP), and overtime details directly from StaffHub Attendance.',
      icon: 'pi pi-bolt',
      badge: 'Auto LOP & Overtime',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100'
    },
    {
      title: 'Statutory Law & Tax Compliance',
      desc: 'Keep your payroll aligned with evolving labor laws for Provident Fund (PF), ESI, Professional Tax (PT), and TDS income tax wage calculations.',
      icon: 'pi pi-shield',
      badge: '100% Compliant',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100'
    },
    {
      title: 'Centralized Employee Portal (ESS)',
      desc: 'Provide your employees with a self-service portal to download monthly payslips, submit reimbursement claims, and track investment declarations.',
      icon: 'pi pi-user-edit',
      badge: 'Self-Service Portal',
      color: 'text-purple-600 bg-purple-50 border-purple-100'
    }
  ];

  payrollHistory = [
    { month: 'June 2026', gross: '₹48,50,200', deductions: '₹5,64,600', net: '₹42,85,600', count: '148', status: 'Disbursed' },
    { month: 'May 2026', gross: '₹46,20,500', deductions: '₹5,10,200', net: '₹41,10,300', count: '142', status: 'Disbursed' },
    { month: 'April 2026', gross: '₹46,20,500', deductions: '₹5,10,200', net: '₹41,10,300', count: '142', status: 'Disbursed' }
  ];

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
}
