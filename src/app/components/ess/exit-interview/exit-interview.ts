import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { AppBreadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';

@Component({
  selector: 'app-exit-interview',
  standalone: true,
  imports: [CommonModule, CardModule, AppBreadcrumb],
  templateUrl: './exit-interview.html',
  styleUrl: './exit-interview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExitInterview {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Exit Interview Form', icon: 'pi pi-file-edit', routerLink: '/ess/exit-interview' }
  ];
}
