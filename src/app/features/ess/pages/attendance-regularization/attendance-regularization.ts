import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-attendance-regularization',
  standalone: true,
  imports: [CommonModule, CardModule, TableModule],
  templateUrl: './attendance-regularization.html',
  styleUrl: './attendance-regularization.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceRegularization {
  requests = [
    { date: '2026-05-18', reason: 'Forgot to check-in (Card lost)', requestedIn: '09:00 AM', requestedOut: '06:00 PM', status: 'Approved', approver: 'Dwarka Prasad' },
    { date: '2026-05-24', reason: 'Client location visit', requestedIn: '09:30 AM', requestedOut: '06:30 PM', status: 'Pending', approver: 'Dwarka Prasad' }
  ];
}
