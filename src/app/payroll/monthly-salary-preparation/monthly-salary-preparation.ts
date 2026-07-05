import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Breadcrumb } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-monthly-salary-preparation',
  standalone: true,
  imports: [CommonModule, RouterLink, Breadcrumb, ButtonModule],
  templateUrl: './monthly-salary-preparation.html',
  styleUrl: './monthly-salary-preparation.scss'
})
export class MonthlySalaryPreparation {
  breadcrumbItems = [
    { label: 'Payroll', icon: 'pi pi-home', routerLink: '/payroll' },
    { label: 'Processes', icon: 'pi pi-sync' },
    { label: 'Monthly Salary Preparation', icon: 'pi pi-sliders-h' }
  ];
}
