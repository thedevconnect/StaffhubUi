import { ChangeDetectionStrategy, Component, HostListener, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AppHeader } from '../header/header';
import { AuthService } from '../../../shared/services/services/auth.service';
import { UserService } from '../../../shared/services/user-service';
import { SidebarMenuItem, UserDetails } from './app-shell.models';
import { essRoutes } from '../../../routes/ess.routes';
import { hradminRoutes } from '../../../routes/hradmin.routes';
import { developerRoutes } from '../../../routes/developer.routes';
import { superadminRoutes } from '../../../routes/superadmin.routes';
import { payrollRoutes } from '../../../routes/payroll.routes';

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

  readonly dynamicMenuItems = signal<SidebarMenuItem[]>([]);
  readonly menuItemsWithSubmenu = computed<SidebarMenuItem[]>(() => this.dynamicMenuItems());

  // Search query state
  readonly searchQuery = signal<string>('');

  // Filtered menu items using computed signal
  readonly filteredMenuItems = computed(() =>
    this.filterMenuItems(this.menuItemsWithSubmenu(), this.searchQuery()),
  );

  constructor(
    private readonly authService: AuthService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly router: Router,
    private readonly userService: UserService,
  ) {}

  ngOnInit(): void {
    this.fetchUserSidebar();
  }

  fetchUserSidebar(): void {
    const roleId = this.selectedRoleId();
    if (!roleId) return;

    const rawRoleId = roleId.toLowerCase();

    // Determine prefix and select corresponding routes
    let rolePrefix = rawRoleId;
    let routesToMap: any[] = [];

    if (rawRoleId === 'hr_admin' || rawRoleId === 'hradmin') {
      rolePrefix = 'hradmin';
      routesToMap = hradminRoutes;
    } else if (rawRoleId === 'ess') {
      rolePrefix = 'ess';
      routesToMap = essRoutes;
    } else if (rawRoleId === 'developer') {
      rolePrefix = 'developer';
      routesToMap = developerRoutes;
    } else if (rawRoleId === 'super_admin' || rawRoleId === 'superadmin') {
      rolePrefix = 'superadmin';
      routesToMap = superadminRoutes;
    } else if (rawRoleId === 'payroll' || rawRoleId === 'payroll_admin' || rawRoleId.includes('payroll')) {
      rolePrefix = 'payroll';
      routesToMap = payrollRoutes;
    } else {
      // Default to ESS routes if role is unrecognized
      rolePrefix = 'ess';
      routesToMap = essRoutes;
    }

    const menus: SidebarMenuItem[] = [
      { label: 'Dashboard', icon: 'pi-home', route: this.getDashboardRoute(), isOpen: false },
    ];

    if (rawRoleId === 'ess') {
      const essSubmenus: SidebarMenuItem[] = [];
      const exitSubmenus: SidebarMenuItem[] = [];
      const standaloneMenus: SidebarMenuItem[] = [];

      routesToMap.forEach((route) => {
        if (!route.path || route.redirectTo !== undefined) return;
        if (route.path === 'ess-dashboard') return;

        const label = (route.title as string) || this.formatPathToLabel(route.path);
        const icon = this.getIconForPath(route.path);
        const item: SidebarMenuItem = {
          label: label,
          icon: icon,
          route: `/${rolePrefix}/${route.path}`,
          isOpen: false,
        };

        const pathLower = route.path.toLowerCase();

        if (pathLower.includes('resignation') || pathLower.includes('exit-interview') || pathLower.includes('exit')) {
          exitSubmenus.push(item);
        } else if (
          pathLower.includes('expense') ||
          pathLower.includes('performance') ||
          pathLower.includes('probation') ||
          pathLower.includes('ticket')
        ) {
          standaloneMenus.push(item);
        } else {
          essSubmenus.push(item);
        }
      });

      if (essSubmenus.length > 0) {
        menus.push({
          label: 'ESS',
          icon: 'pi-user',
          isOpen: false,
          children: essSubmenus,
        });
      }

      if (exitSubmenus.length > 0) {
        menus.push({
          label: 'Exit',
          icon: 'pi-times-circle',
          isOpen: false,
          children: exitSubmenus,
        });
      }

      menus.push(...standaloneMenus);
    } else {
      if (routesToMap && routesToMap.length > 0) {
        routesToMap.forEach((route) => {
          if (!route.path || route.redirectTo !== undefined) return;
          if (
            route.path === 'payroll-dashboard' ||
            route.path === 'developer-dashboard' ||
            route.path === 'superadmin-dashboard' ||
            route.path === 'hradmin-dashboard'
          ) return;

          const label = (route.title as string) || this.formatPathToLabel(route.path);
          const icon = this.getIconForPath(route.path);

          menus.push({
            label: label,
            icon: icon,
            route: `/${rolePrefix}/${route.path}`,
            isOpen: false,
          });
        });
      }
    }

    this.dynamicMenuItems.set(menus);
  }

  private formatPathToLabel(path: string): string {
    return path
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private getIconForPath(path: string): string {
    const p = path.toLowerCase();
    if (p.includes('dashboard')) return 'pi-home';
    if (p.includes('asset')) return 'pi-briefcase';
    if (p.includes('attendance') && p.includes('calendar')) return 'pi-calendar-times';
    if (p.includes('attendance')) return 'pi-calendar';
    if (p.includes('leave')) return 'pi-sign-out';
    if (p.includes('resignation') || p.includes('exit')) return 'pi-times-circle';
    if (p.includes('profile')) return 'pi-user';
    if (p.includes('ticket')) return 'pi-ticket';
    if (p.includes('expense')) return 'pi-dollar';
    if (p.includes('performance')) return 'pi-chart-line';
    if (p.includes('probation')) return 'pi-clock';
    if (p.includes('company')) return 'pi-building';
    if (p.includes('activity')) return 'pi-cog';
    if (p.includes('menu')) return 'pi-list';
    if (p.includes('role')) return 'pi-users';
    return 'pi-file';
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncLayoutForViewport();
  }

  toggleSidebar(): void {
    if (!this.isMobileView()) {
      this.sidebarOpen.set(true);
      return;
    }
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
    this.fetchUserSidebar();
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
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('selectedRoleId');
        sessionStorage.removeItem('roleOptions');
        sessionStorage.removeItem('token');
        this.router.navigate(['/login']);
      },
    });
  }

  onHeaderLogout(): void {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('selectedRoleId');
    sessionStorage.removeItem('roleOptions');
    sessionStorage.removeItem('token');
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
      .map((item) => {
        const cloned = { ...item };
        if (cloned.children && cloned.children.length > 0) {
          const matchedChildren = cloned.children
            .map((sub: SidebarMenuItem) => {
              const clonedSub = { ...sub };
              if (clonedSub.children && clonedSub.children.length > 0) {
                const matchedGrand = clonedSub.children.filter((child) =>
                  child.label.toLowerCase().includes(lowerQuery),
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
            })
            .filter((sub) => sub !== null) as SidebarMenuItem[];

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
      .filter((item) => item !== null) as SidebarMenuItem[];
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
