import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Breadcrumb } from 'primeng/breadcrumb';

@Component({
  selector: 'app-superadmin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TableModule,
    Breadcrumb,
    RouterLink,
    RouterModule
  ],
  templateUrl: './superadmin-dashboard.html',
  styleUrl: './superadmin-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminDashboard {
  breadcrumbItems: any[] = [
    { label: 'Super Administration', icon: 'pi pi-user-edit', routerLink: '/superadmin' },
    { label: 'Dashboard', icon: 'pi pi-chart-bar', routerLink: '/superadmin/superadmin-dashboard' }
  ];

  stats = [
    { label: 'Active Companies', value: '42', icon: 'pi pi-building', color: 'bg-blue-50 text-blue-600' },
    { label: 'Active Employees', value: '1,840', icon: 'pi pi-users', color: 'bg-emerald-50 text-emerald-600' },
    { label: 'System Memory Load', value: '38%', icon: 'pi pi-sliders-h', color: 'bg-amber-50 text-amber-600' },
    { label: 'Platform Status', value: 'Operational', icon: 'pi pi-check-circle', color: 'bg-indigo-50 text-indigo-600' }
  ];

  activeModules = [
    {
      title: 'Company Management',
      desc: 'Oversee corporate accounts, register new tenants, modify subscription details, and manage databases.',
      route: '/superadmin/company-management',
      icon: 'pi-building',
      color: 'from-blue-500 to-indigo-600'
    }
  ];

  companies = [
    { name: 'DevConnect Technologies Private Limited', code: 'DEVCON', admin: 'devconnect.admin@staffhub.com', status: 'Active', members: '148', joinedOn: new Date('2025-11-12') },
    { name: 'Vistara Global Logistics Services', code: 'VISTARA', admin: 'vistara.admin@staffhub.com', status: 'Active', members: '320', joinedOn: new Date('2026-02-28') },
    { name: 'Rishabh Capital & Finance Group', code: 'RISHABH', admin: 'rishabh.admin@staffhub.com', status: 'Pending', members: '12', joinedOn: new Date('2026-07-01') },
    { name: 'Acme International Corporation', code: 'ACME', admin: 'acme.admin@staffhub.com', status: 'Suspended', members: '0', joinedOn: new Date('2024-05-18') }
  ];
}
