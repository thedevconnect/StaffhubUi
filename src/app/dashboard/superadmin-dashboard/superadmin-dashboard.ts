import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Breadcrumb } from 'primeng/breadcrumb';
import { UserService } from '../../shared/services/user-service';

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
export class SuperadminDashboard implements OnInit {
  breadcrumbItems: any[] = [
    { label: 'Super Administration', icon: 'pi pi-user-edit', routerLink: '/superadmin' },
    { label: 'Dashboard', icon: 'pi pi-chart-bar', routerLink: '/superadmin/superadmin-dashboard' }
  ];

  isLoading = true;

  stats = [
    { label: 'Active Companies', value: '0', icon: 'pi pi-building', color: 'bg-blue-50 text-blue-600' },
    { label: 'Active Employees', value: '0', icon: 'pi pi-users', color: 'bg-emerald-50 text-emerald-600' },
    { label: 'System Memory Load', value: '0%', icon: 'pi pi-sliders-h', color: 'bg-amber-50 text-amber-600' },
    { label: 'Platform Status', value: 'Checking', icon: 'pi pi-check-circle', color: 'bg-indigo-50 text-indigo-600' }
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

  companies: any[] = [];

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchDashboardData();
  }

  fetchDashboardData() {
    this.isLoading = true;
    this.userService.getSuperadminDashboardStats().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const s = res.data.stats;
          this.stats = [
            { label: 'Active Companies', value: s.activeCompanies.toString(), icon: 'pi pi-building', color: 'bg-blue-50 text-blue-600' },
            { label: 'Active Employees', value: s.activeEmployees.toString(), icon: 'pi pi-users', color: 'bg-emerald-50 text-emerald-600' },
            { label: 'System Memory Load', value: s.systemLoad, icon: 'pi pi-sliders-h', color: 'bg-amber-50 text-amber-600' },
            { label: 'Platform Status', value: s.platformStatus, icon: 'pi pi-check-circle', color: 'bg-indigo-50 text-indigo-600' }
          ];
          
          this.companies = res.data.recentCompanies || [];
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch dashboard stats', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
