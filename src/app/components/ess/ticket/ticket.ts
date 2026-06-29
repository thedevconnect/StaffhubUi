import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { AppBreadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';
import { ButtonModule } from 'primeng/button';

interface TicketCategory {
  name: string;
  colorClass: string;
}

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule, CardModule, AppBreadcrumb, ButtonModule],
  templateUrl: './ticket.html',
  styleUrl: './ticket.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Ticket {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Raise Ticket', icon: 'pi pi-ticket', routerLink: '/ess/ticket' }
  ];

  ticketCategories: TicketCategory[] = [
    { name: 'ADMINISTRATION', colorClass: 'bg-red-50 text-red-500 border-red-100' },
    { name: 'HUMAN RESOURCE - CRG', colorClass: 'bg-emerald-50 text-emerald-500 border-emerald-100' },
    { name: 'IT HELPDESK', colorClass: 'bg-sky-50 text-sky-500 border-sky-100' },
    { name: 'BUSINESS APPLICATIONS', colorClass: 'bg-amber-50 text-amber-500 border-amber-100' },
    { name: 'TECHNICAL SERVICES - EXT', colorClass: 'bg-violet-50 text-violet-500 border-violet-100' },
    { name: 'PROCUREMENT - EXT', colorClass: 'bg-fuchsia-50 text-fuchsia-500 border-fuchsia-100' },
    { name: 'OFFICE EXPENSE REQUEST', colorClass: 'bg-rose-50 text-rose-500 border-rose-100' },
    { name: 'CONVEYANCE REQUEST', colorClass: 'bg-green-50 text-green-500 border-green-100' },
    { name: 'TRAVEL REQUEST', colorClass: 'bg-cyan-50 text-cyan-500 border-cyan-100' },
    { name: 'CORPORATE AFFAIRS', colorClass: 'bg-indigo-50 text-indigo-500 border-indigo-100' },
    { name: 'LEGAL DEPARTMENT', colorClass: 'bg-red-50 text-red-500 border-red-100' },
    { name: 'TECHNICAL SERVICES - GOBBLER', colorClass: 'bg-orange-50 text-orange-500 border-orange-100' },
    { name: 'COMPENSATION AND BENEFITS', colorClass: 'bg-slate-100 text-slate-600 border-slate-200' }
  ];

  selectedCategoryName: string | null = null;

  selectCategory(categoryName: string): void {
    this.selectedCategoryName = categoryName;
  }

  backToTickets(): void {
    this.selectedCategoryName = null;
  }
}
