import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Breadcrumb } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-monthly-salary-components',
  standalone: true,
  imports: [CommonModule, RouterLink, Breadcrumb, ButtonModule],
  templateUrl: './monthly-salary-components.html',
  styleUrl: './monthly-salary-components.scss'
})
export class MonthlySalaryComponents {
  breadcrumbItems = [
    { label: 'Payroll', icon: 'pi pi-home', routerLink: '/payroll' },
    { label: 'Configurations', icon: 'pi pi-cog' },
    { label: 'Monthly Salary Components', icon: 'pi pi-percentage' }
  ];
}
