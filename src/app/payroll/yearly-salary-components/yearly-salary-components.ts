import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Breadcrumb } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-yearly-salary',
  standalone: true,
  imports: [CommonModule, RouterLink, Breadcrumb, ButtonModule],
  templateUrl: './yearly-salary-components.html',
  styleUrl: './yearly-salary-components.scss'
})
export class YearlySalary {
  breadcrumbItems = [
    { label: 'Payroll', icon: 'pi pi-home', routerLink: '/payroll' },
    { label: 'Configurations', icon: 'pi pi-cog' },
    { label: 'Yearly Salary Components', icon: 'pi pi-calendar' }
  ];
}
