import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { Breadcrumb } from 'primeng/breadcrumb';

@Component({
  selector: 'app-probation',
  standalone: true,
  imports: [CommonModule, CardModule, Breadcrumb],
  templateUrl: './probation.html',
  styleUrl: './probation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Probation {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Probation Details', icon: 'pi pi-user-minus', routerLink: '/ess/probation' }
  ];
}
