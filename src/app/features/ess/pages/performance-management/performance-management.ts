import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { Breadcrumb } from 'primeng/breadcrumb';

@Component({
  selector: 'app-performance-management',
  standalone: true,
  imports: [CommonModule, CardModule, Breadcrumb],
  templateUrl: './performance-management.html',
  styleUrl: './performance-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerformanceManagement {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Goals & Reviews', icon: 'pi pi-chart-line', routerLink: '/ess/performance-management' }
  ];
}
