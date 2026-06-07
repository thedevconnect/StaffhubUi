import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-expense-management',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './expense-management.html',
  styleUrl: './expense-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseManagement {}
