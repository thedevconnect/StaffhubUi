import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-performance-management',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './performance-management.html',
  styleUrl: './performance-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerformanceManagement {}
