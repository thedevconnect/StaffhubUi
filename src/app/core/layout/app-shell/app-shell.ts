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

interface MenuItem {
  menu: string;
  icon: string;
  route: string;
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
  readonly menuItemsWithSubmenu = computed(() => this.getMenuItemsByRole(this.selectedRoleId()));

  constructor(
    private readonly authService: AuthService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly router: Router,
  ) { }

  toggleSidebar(): void {
    this.sidebarOpen.update((isOpen) => !isOpen);
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

  private getMenuItemsByRole(roleId: string): MenuItem[] {
    if (roleId.toLowerCase().includes('ess')) {
      return [
        { menu: 'Dashboard', icon: 'pi-home', route: '/dashboard/ess' },
        { menu: 'My Profile', icon: 'pi-user', route: '/profile' },
      ];
    }

    return [
      { menu: 'Dashboard', icon: 'pi-home', route: '/dashboard/hr' },
      { menu: 'Employees', icon: 'pi-users', route: '/employees' },
      { menu: 'Attendance', icon: 'pi-calendar', route: '/attendance' },
    ];
  }
}
