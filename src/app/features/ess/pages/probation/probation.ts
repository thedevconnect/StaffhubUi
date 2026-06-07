import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-probation',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './probation.html',
  styleUrl: './probation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Probation {}
