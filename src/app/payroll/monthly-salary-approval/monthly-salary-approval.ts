import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Breadcrumb } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-monthly-salary-approval',
  standalone: true,
  imports: [CommonModule, RouterLink, Breadcrumb, ButtonModule],
  templateUrl: './monthly-salary-approval.html',
  styleUrl: './monthly-salary-approval.scss'
})
export class MonthlySalaryApproval {
  breadcrumbItems = [
    { label: 'Payroll', icon: 'pi pi-home', routerLink: '/payroll' },
    { label: 'Approvals', icon: 'pi pi-check-square' },
    { label: 'Monthly Salary Approval', icon: 'pi pi-verified' }
  ];
}
