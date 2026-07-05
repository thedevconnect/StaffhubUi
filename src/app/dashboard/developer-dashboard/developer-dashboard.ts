import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Breadcrumb } from 'primeng/breadcrumb';

@Component({
  selector: 'app-developer-dashboard',
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
  templateUrl: './developer-dashboard.html',
  styleUrl: './developer-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeveloperDashboard {
  breadcrumbItems: any[] = [
    { label: 'Developer Console', icon: 'pi pi-cog', routerLink: '/developer' },
    { label: 'System Dashboard', icon: 'pi pi-chart-bar', routerLink: '/developer/developer-dashboard' }
  ];

  stats = [
    { label: 'Active Services', value: '18 / 20', icon: 'pi pi-server', color: 'bg-indigo-50 text-indigo-600' },
    { label: 'System Status', value: 'Healthy', icon: 'pi pi-heart-fill', color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Database Load', value: '2.4%', icon: 'pi pi-database', color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Registered Users', value: '2,840', icon: 'pi pi-users', color: 'bg-purple-50 text-purple-600' }
  ];

  activeModules = [
    {
      title: 'Activity Master',
      desc: 'Monitor user interactions, track errors, and review request/response logs.',
      route: '/developer/activity-master',
      icon: 'pi-history',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Menu Master',
      desc: 'Build and modify responsive navigation structures and hierarchical link grids.',
      route: '/developer/menu-master',
      icon: 'pi-list',
      color: 'from-violet-500 to-purple-600'
    },
    {
      title: 'Role Master',
      desc: 'Configure global privileges, manage system permissions, and set user access rules.',
      route: '/developer/role-master',
      icon: 'pi-users',
      color: 'from-amber-500 to-orange-600'
    },
    {
      title: 'Company Approval',
      desc: 'Authorize new company tenants, enable platform features, and provision environments.',
      route: '/developer/company-approval',
      icon: 'pi-building',
      color: 'from-emerald-500 to-teal-600'
    }
  ];

  recentLogs = [
    { timestamp: new Date(), service: 'AuthService', level: 'INFO', message: 'User verification token refreshed successfully' },
    { timestamp: new Date(Date.now() - 5 * 60000), service: 'PayrollService', level: 'SUCCESS', message: 'Calculated monthly salary variables for company 8' },
    { timestamp: new Date(Date.now() - 15 * 60000), service: 'AttendanceService', level: 'WARNING', message: 'Delayed webhook response from swipe validation server' },
    { timestamp: new Date(Date.now() - 40 * 60000), service: 'DatabaseConnection', level: 'INFO', message: 'Released 14 idle connections back to the global pool' }
  ];
}
