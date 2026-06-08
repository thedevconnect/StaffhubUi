import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { Breadcrumb } from 'primeng/breadcrumb';

@Component({
  selector: 'app-expense-management',
  standalone: true,
  imports: [CommonModule, CardModule, Breadcrumb],
  templateUrl: './expense-management.html',
  styleUrl: './expense-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseManagement {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Expense Requests', icon: 'pi pi-wallet', routerLink: '/ess/expense-management' }
  ];
}
