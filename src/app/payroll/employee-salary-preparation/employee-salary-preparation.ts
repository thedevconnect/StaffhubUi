import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Breadcrumb } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-employee-salary-preparation',
  standalone: true,
  imports: [CommonModule, RouterLink, Breadcrumb, ButtonModule],
  templateUrl: './employee-salary-preparation.html',
  styleUrl: './employee-salary-preparation.scss'
})
export class EmployeeSalaryPreparation {
  breadcrumbItems = [
    { label: 'Payroll', icon: 'pi pi-home', routerLink: '/payroll' },
    { label: 'Processes', icon: 'pi pi-sync' },
    { label: 'Employee Salary Preparation', icon: 'pi pi-user-edit' }
  ];
}
