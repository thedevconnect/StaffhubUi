import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AppHeader } from '../../../shared/ui/navigation/header/header';
import { AuthService } from '../../auth/services/auth.service';

interface UserDetails {
  name: string;
  email: string;
  role: string;
}

interface SidebarMenuItem {
  label: string;
  icon?: string;
  route?: string;
  isOpen?: boolean;
  children?: SidebarMenuItem[];
}

@Component({
  selector: 'app-shell',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ToastModule,
    ConfirmDialogModule,
    AppHeader,
  ],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService, ConfirmationService],
})
export class AppShell {
  readonly sidebarOpen = signal(true);
  readonly selectedRoleId = computed(() => this.authService.selectedRoleId());
  readonly roleOptions = computed(() => this.authService.roleOptions());
  readonly userDetails = computed<UserDetails>(() => {
    const user = this.authService.user();
    const selectedRole = this.roleOptions().find((role) => role.roleId === this.selectedRoleId());
    return {
      name: user?.employeeName ?? 'User',
      email: user?.username ?? '',
      role: selectedRole?.rolDes ?? user?.roles[0]?.rolDes ?? '',
    };
  });
  readonly menuItemsWithSubmenu = computed<SidebarMenuItem[]>(() => this.getMenuItemsByRole(this.selectedRoleId()));

  constructor(
    private readonly authService: AuthService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly router: Router,
  ) { }

  toggleSidebar(): void {
    this.sidebarOpen.update((isOpen) => !isOpen);
  }

  toggleMenuOpen(item: SidebarMenuItem): void {
    item.isOpen = !item.isOpen;
  }

  getDashboardRoute(): string {
    return this.authService.getDashboardRoute();
  }

  onRoleChange(roleId: string): void {
    this.authService.setSelectedRole(roleId);
    this.router.navigate([this.getDashboardRoute()]);
  }

  logout(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to logout?',
      header: 'Logout',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.authService.logout();
        this.messageService.add({
          severity: 'success',
          summary: 'Logged out',
          detail: 'You have been logged out successfully.',
        });
        this.router.navigate(['/login']);
      },
    });
  }

  private getMenuItemsByRole(roleId: string): SidebarMenuItem[] {
    if (roleId.toLowerCase().includes('ess')) {
      return [
        { label: 'Dashboard', icon: 'pi-home', route: '/dashboard/ess' },
        { label: 'My Profile', icon: 'pi-user', route: '/profile' },
        {
          label: 'EPSS',
          icon: 'pi-shield',
          isOpen: true,
          children: [
            {
              label: 'ESS',
              icon: 'pi-folder',
              isOpen: true,
              children: [
                { label: 'My Assets', route: '/ess/my-assets' },
                { label: 'Service File', route: '/ess/service-file' },
                { label: 'Reportings Attendance', route: '/ess/reportings-attendance' },
                { label: 'Get Employee Info', route: '/ess/get-employee-info' },
                { label: 'Employee Attendance', route: '/ess/employee-attendance' },
                { label: 'Attendance Regularization', route: '/ess/attendance-regularization' },
                { label: 'Monthly Attendance Calendar', route: '/ess/monthly-attendance-calendar' },
                { label: 'Leave Application', route: '/ess/leave-application' },
                { label: 'Apply Short Leave', route: '/ess/apply-short-leave' },
                { label: 'Final Attendance', route: '/ess/final-attendance' }
              ]
            }
          ]
        },
        {
          label: 'Exit',
          icon: 'pi-sign-out',
          isOpen: false,
          children: [
            { label: 'Employee Resignation', route: '/ess/employee-resignation' },
            { label: 'Exit Interview Form', route: '/ess/exit-interview' }
          ]
        },
        {
          label: 'Expense Management',
          icon: 'pi-wallet',
          isOpen: false,
          children: [
            { label: 'Expense Requests', route: '/ess/expense-management' }
          ]
        },
        {
          label: 'Performance Management',
          icon: 'pi-chart-line',
          isOpen: false,
          children: [
            { label: 'Goals & Reviews', route: '/ess/performance-management' }
          ]
        },
        {
          label: 'Probation',
          icon: 'pi-user-minus',
          isOpen: false,
          children: [
            { label: 'Probation Details', route: '/ess/probation' }
          ]
        },
        {
          label: 'Ticket',
          icon: 'pi-ticket',
          isOpen: false,
          children: [
            { label: 'Raise Ticket', route: '/ess/ticket' }
          ]
        }
      ];
    }

    return [
      { label: 'Dashboard', icon: 'pi-home', route: '/dashboard/hr' },
      { label: 'Employees', icon: 'pi-users', route: '/employees' },
      { label: 'Attendance', icon: 'pi-calendar', route: '/attendance' },
    ];
  }
}
