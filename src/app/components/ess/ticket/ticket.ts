import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { AppBreadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule, CardModule, AppBreadcrumb],
  templateUrl: './ticket.html',
  styleUrl: './ticket.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Ticket {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Raise Ticket', icon: 'pi pi-ticket', routerLink: '/ess/ticket' }
  ];
}
