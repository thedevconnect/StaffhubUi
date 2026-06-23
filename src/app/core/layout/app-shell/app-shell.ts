import { ChangeDetectionStrategy, Component, HostListener, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AppHeader } from '../header/header';
import { AuthService } from '../../auth/services/auth.service';
import { SidebarMenuItem, UserDetails } from './app-shell.models';

@Component({
  selector: 'app-shell',
  imports: [
    CommonModule,
    FormsModule,
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
  readonly isMobileView = signal(this.checkIsMobileView());
  readonly sidebarOpen = signal(!this.isMobileView());
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

  // Search query state
  readonly searchQuery = signal<string>('');

  // Filtered menu items using computed signal
  readonly filteredMenuItems = computed(() => this.filterMenuItems(this.menuItemsWithSubmenu(), this.searchQuery()));

  constructor(
    private readonly authService: AuthService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly router: Router,
  ) { }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncLayoutForViewport();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((isOpen) => !isOpen);
  }

  closeSidebarOnMobile(): void {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.sidebarOpen.set(false);
    }
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

  onSearchQueryChange(event: any): void {
    this.searchQuery.set(event.target.value);
  }

  private filterMenuItems(items: SidebarMenuItem[], query: string): SidebarMenuItem[] {
    if (!query.trim()) {
      return items;
    }
    const lowerQuery = query.toLowerCase();
    return items
      .map(item => {
        const cloned = { ...item };
        if (cloned.children && cloned.children.length > 0) {
          const matchedChildren = cloned.children.map((sub: SidebarMenuItem) => {
            const clonedSub = { ...sub };
            if (clonedSub.children && clonedSub.children.length > 0) {
              const matchedGrand = clonedSub.children.filter(child =>
                child.label.toLowerCase().includes(lowerQuery)
              );
              if (matchedGrand.length > 0) {
                clonedSub.children = matchedGrand;
                clonedSub.isOpen = true;
                return clonedSub;
              }
            } else if (clonedSub.label.toLowerCase().includes(lowerQuery)) {
              return clonedSub;
            }
            return null;
          }).filter(sub => sub !== null) as SidebarMenuItem[];

          if (matchedChildren.length > 0) {
            cloned.children = matchedChildren;
            cloned.isOpen = true;
            return cloned;
          }
        } else if (cloned.label.toLowerCase().includes(lowerQuery)) {
          return cloned;
        }
        return null;
      })
      .filter(item => item !== null) as SidebarMenuItem[];
  }

  private getMenuItemsByRole(roleId: string): SidebarMenuItem[] {
    if (roleId.toLowerCase().includes('ess')) {
      return [
        { label: 'Dashboard', icon: 'pi-home', route: '/ess/ess-dashboard' },
        { label: 'My Profile', icon: 'pi-user', route: '/profile' },
        {
          label: 'ESS',
          icon: 'pi-folder',
          isOpen: true,
          children: [
            { label: 'Employee Attendance', route: '/ess/employee-attendance' },
            { label: 'My Assets', route: '/ess/my-assets' },
            { label: 'Service File', route: '/ess/service-file' },
            { label: 'Reportings Attendance', route: '/ess/reportings-attendance' },
            { label: 'Get Employee Info', route: '/ess/get-employee-info' },
            { label: 'Attendance Regularization', route: '/ess/attendance-regularization' },
            { label: 'Monthly Attendance Calendar', route: '/ess/monthly-attendance-calendar' },
            { label: 'Leave Application', route: '/ess/leave-application' },
            { label: 'Apply Short Leave', route: '/ess/apply-short-leave' },
            { label: 'Final Attendance', route: '/ess/final-attendance' },
            { label: 'Holiday List', route: '/ess/holiday-list' }

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
      { label: 'Dashboard', icon: 'pi-home', route: '/ess/ess-dashboard' },
      { label: 'Employees', icon: 'pi-users', route: '/employees' },
      { label: 'Attendance', icon: 'pi-calendar', route: '/attendance' },
    ];
  }

  private checkIsMobileView(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  }

  private syncLayoutForViewport(): void {
    const nextIsMobile = this.checkIsMobileView();
    const previousIsMobile = this.isMobileView();

    if (nextIsMobile === previousIsMobile) {
      return;
    }

    this.isMobileView.set(nextIsMobile);
    this.sidebarOpen.set(!nextIsMobile);
  }
}
