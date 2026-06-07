import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employee-resignation',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './employee-resignation.html',
  styleUrl: './employee-resignation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeResignation {}
