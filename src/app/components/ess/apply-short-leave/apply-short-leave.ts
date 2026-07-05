import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { Breadcrumb } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-apply-short-leave',
  standalone: true,
  imports: [CommonModule, CardModule, TableModule, Breadcrumb, ButtonModule],
  templateUrl: './apply-short-leave.html',
  styleUrl: './apply-short-leave.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplyShortLeave {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Apply Short Leave', icon: 'pi pi-clock', routerLink: '/ess/apply-short-leave' }
  ];
  shortLeaves = [
    { date: '2026-05-10', type: 'Late Coming (Up to 2 Hours)', reason: 'Doctor appointment', status: 'Approved', duration: '2 Hours' },
    { date: '2026-05-22', type: 'Early Going (Up to 2 Hours)', reason: 'Personal work', status: 'Approved', duration: '1.5 Hours' }
  ];
}
