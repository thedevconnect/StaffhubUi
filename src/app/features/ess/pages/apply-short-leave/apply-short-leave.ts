import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-apply-short-leave',
  standalone: true,
  imports: [CommonModule, CardModule, TableModule],
  templateUrl: './apply-short-leave.html',
  styleUrl: './apply-short-leave.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplyShortLeave {
  shortLeaves = [
    { date: '2026-05-10', type: 'Late Coming (Up to 2 Hours)', reason: 'Doctor appointment', status: 'Approved', duration: '2 Hours' },
    { date: '2026-05-22', type: 'Early Going (Up to 2 Hours)', reason: 'Personal work', status: 'Approved', duration: '1.5 Hours' }
  ];
}
