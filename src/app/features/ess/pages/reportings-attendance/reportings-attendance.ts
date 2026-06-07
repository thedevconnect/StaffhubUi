import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reportings-attendance',
  standalone: true,
  imports: [CommonModule, CardModule, TableModule],
  templateUrl: './reportings-attendance.html',
  styleUrl: './reportings-attendance.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportingsAttendance {
  reportees = [
    { empId: 'EMP828', name: 'Rahul Sharma', role: 'Software Engineer', checkIn: '09:15 AM', checkOut: '06:30 PM', status: 'Present' },
    { empId: 'EMP829', name: 'Pooja Patel', role: 'UI Designer', checkIn: '09:05 AM', checkOut: '06:05 PM', status: 'Present' },
    { empId: 'EMP830', name: 'Amit Verma', role: 'QA Analyst', checkIn: '-', checkOut: '-', status: 'On Leave' }
  ];
}
