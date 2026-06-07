import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-final-attendance',
  standalone: true,
  imports: [CommonModule, CardModule, TableModule],
  templateUrl: './final-attendance.html',
  styleUrl: './final-attendance.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinalAttendance {
  records = [
    { month: 'May 2026', totalDays: 31, present: 21, leaves: 1, holidays: 1, weeklyOffs: 8, status: 'Submitted', submitDate: '2026-06-01' },
    { month: 'April 2026', totalDays: 30, present: 20, leaves: 2, holidays: 0, weeklyOffs: 8, status: 'Approved', submitDate: '2026-05-01' }
  ];
}
