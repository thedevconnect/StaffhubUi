import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { AppBreadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';

@Component({
  selector: 'app-employee-resignation',
  standalone: true,
  imports: [CommonModule, CardModule, AppBreadcrumb],
  templateUrl: './employee-resignation.html',
  styleUrl: './employee-resignation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeResignation {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Employee Resignation', icon: 'pi pi-sign-out', routerLink: '/ess/employee-resignation' }
  ];
}
