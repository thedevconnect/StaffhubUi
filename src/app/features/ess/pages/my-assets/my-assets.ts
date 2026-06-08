import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { Breadcrumb } from 'primeng/breadcrumb';

@Component({
  selector: 'app-my-assets',
  standalone: true,
  imports: [CommonModule, CardModule, TableModule, Breadcrumb],
  templateUrl: './my-assets.html',
  styleUrl: './my-assets.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyAssets {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'My Assets', icon: 'pi pi-briefcase', routerLink: '/ess/my-assets' }
  ];
  assets = [
    { name: 'MacBook Pro 16"', serial: 'C02F1234QWYD', category: 'Laptop', status: 'Assigned', date: '2026-01-15' },
    { name: 'Dell 27" 4K Monitor', serial: 'CN-0X1234-5678', category: 'Monitor', status: 'Assigned', date: '2026-01-15' },
    { name: 'Apple Magic Keyboard', serial: 'KY-987654', category: 'Peripherals', status: 'Assigned', date: '2026-02-10' }
  ];
}
