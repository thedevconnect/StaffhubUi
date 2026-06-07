import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-leave-application',
  standalone: true,
  imports: [CommonModule, CardModule, TableModule],
  templateUrl: './leave-application.html',
  styleUrl: './leave-application.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaveApplication {
  leaves = [
    { type: 'Casual Leave', fromDate: '2026-04-10', toDate: '2026-04-11', duration: '2 Days', reason: 'Personal work', status: 'Approved' },
    { type: 'Sick Leave', fromDate: '2026-05-12', toDate: '2026-05-12', duration: '1 Day', reason: 'Fever', status: 'Approved' }
  ];
}
