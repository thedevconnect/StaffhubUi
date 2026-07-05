import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Breadcrumb } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-employee-expense-statement',
  standalone: true,
  imports: [CommonModule, RouterLink, Breadcrumb, ButtonModule],
  templateUrl: './employee-expense-statement.html',
  styleUrl: './employee-expense-statement.scss'
})
export class EmployeeExpenseStatement {
  breadcrumbItems = [
    { label: 'Payroll', icon: 'pi pi-home', routerLink: '/payroll' },
    { label: 'Reports', icon: 'pi pi-file' },
    { label: 'Expense Statement', icon: 'pi pi-dollar' }
  ];
}
