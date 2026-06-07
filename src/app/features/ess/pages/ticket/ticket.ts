import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './ticket.html',
  styleUrl: './ticket.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Ticket {}
