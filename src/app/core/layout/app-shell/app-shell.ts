import { ChangeDetectionStrategy, Component, HostListener, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AppHeader } from '../header/header';
import { AuthService } from '../../../shared/services/services/auth.service';
import { SidebarMenuItem, UserDetails } from './app-shell.models';
import { essRoutes } from '../../../routes/ess.routes';
import { hradminRoutes } from '../../../routes/hradmin.routes';
import { developerRoutes } from '../../../routes/developer.routes';
import { superadminRoutes } from '../../../routes/superadmin.routes';
import { payrollRoutes } from '../../../routes/payroll.routes';

import { UserProfileService } from '../../../shared/services/user-profile.service';

@Component({
  selector: 'app-shell',
  standalone: true,
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
export class AppShell implements OnInit {
  readonly isMobileView = signal(this.checkIsMobileView());
  readonly sidebarOpen = signal(!this.isMobileView());
  readonly selectedRoleId = computed(() => this.authService.selectedRoleId());
  readonly roleOptions = computed(() => this.authService.roleOptions());
  readonly companyLogoUrl = computed(() => this.userProfileService.companyLogo());

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
  readonly searchQuery = signal<string>('');
  readonly filteredMenuItems = computed(() =>
    this.filterMenuItems(this.dynamicMenuItems(), this.searchQuery()),
  );

  constructor(
    private readonly authService: AuthService,
    private readonly userProfileService: UserProfileService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly router: Router,
  ) { }

  ngOnInit(): void {
    this.fetchUserSidebar();
    if (this.authService.isAuthenticated()) {
      this.userProfileService.getUserProfile().subscribe({ error: () => {} });
    }
  }

  onLogoError(event: any): void {
    event.target.src = 'assets/stubhub-com-banner-2.jpg';
  }

  fetchUserSidebar(): void {
    const rawRoleId = this.selectedRoleId()?.toLowerCase();
    if (!rawRoleId) return;

    let rolePrefix = 'ess';
    let routesToMap: any[] = essRoutes;

    if (rawRoleId === 'hr_admin' || rawRoleId === 'hradmin') {
      rolePrefix = 'hradmin';
      routesToMap = hradminRoutes;
    } else if (rawRoleId === 'developer') {
      rolePrefix = 'developer';
      routesToMap = developerRoutes;
    } else if (rawRoleId === 'super_admin' || rawRoleId === 'superadmin') {
      rolePrefix = 'superadmin';
      routesToMap = superadminRoutes;
    } else if (rawRoleId.includes('payroll')) {
      rolePrefix = 'payroll';
      routesToMap = payrollRoutes;
    }

    const menus: SidebarMenuItem[] = [
      { label: 'Dashboard', icon: 'pi-home', route: this.getDashboardRoute(), isOpen: false },
    ];

    if (rawRoleId === 'ess') {
      const essSubmenus: SidebarMenuItem[] = [];
      const exitSubmenus: SidebarMenuItem[] = [];
      const standaloneMenus: SidebarMenuItem[] = [];

      routesToMap.forEach((route) => {
        if (!route.path || route.redirectTo !== undefined || route.path === 'ess-dashboard') return;

        const item: SidebarMenuItem = {
          label: (route.title as string) || this.formatPathToLabel(route.path),
          icon: this.getIconForPath(route.path),
          route: `/${rolePrefix}/${route.path}`,
          isOpen: false,
        };

        const pathLower = route.path.toLowerCase();
        if (pathLower.includes('resignation') || pathLower.includes('exit')) {
          exitSubmenus.push(item);
        } else if (
          pathLower.includes('expense') ||
          pathLower.includes('performance') ||
          pathLower.includes('probation') ||
          pathLower.includes('ticket') ||
          pathLower.includes('work-management') ||
          pathLower.includes('task')
        ) {
          standaloneMenus.push(item);
        } else {
          essSubmenus.push(item);
        }
      });

      if (essSubmenus.length > 0) menus.push({ label: 'ESS', icon: 'pi-user', isOpen: false, children: essSubmenus });
      if (exitSubmenus.length > 0) menus.push({ label: 'Exit', icon: 'pi-times-circle', isOpen: false, children: exitSubmenus });
      menus.push(...standaloneMenus);
    } else if (rawRoleId === 'hr_admin' || rawRoleId === 'hradmin') {
      const empMgmtSubmenus: SidebarMenuItem[] = [];
      const attendanceSubmenus: SidebarMenuItem[] = [];
      const assetSubmenus: SidebarMenuItem[] = [];
      const approvalSubmenus: SidebarMenuItem[] = [];
      const standaloneBottomMenus: SidebarMenuItem[] = [];

      routesToMap.forEach((route) => {
        if (!route.path || route.redirectTo !== undefined || route.path === 'hradmin-dashboard') return;

        const item: SidebarMenuItem = {
          label: (route.title as string) || this.formatPathToLabel(route.path),
          icon: this.getIconForPath(route.path),
          route: `/${rolePrefix}/${route.path}`,
          isOpen: false,
        };

        const pathLower = route.path.toLowerCase();
        if (pathLower.includes('approval') || pathLower.includes('exit')) {
          approvalSubmenus.push(item);
        } else if (
          pathLower.includes('employee-management') ||
          pathLower.includes('offboarding') ||
          pathLower.includes('office-location') ||
          pathLower.includes('device-management') ||
          pathLower.includes('probation')
        ) {
          empMgmtSubmenus.push(item);
        } else if (pathLower.includes('attendance') || pathLower.includes('leave') || pathLower.includes('calendar')) {
          attendanceSubmenus.push(item);
        } else if (pathLower.includes('asset')) {
          assetSubmenus.push(item);
        } else if (pathLower === 'reports') {
          standaloneBottomMenus.push(item);
        } else {
          menus.push(item);
        }
      });

      if (empMgmtSubmenus.length > 0) menus.push({ label: 'Employee Management', icon: 'pi-users', isOpen: false, children: empMgmtSubmenus });
      if (attendanceSubmenus.length > 0) menus.push({ label: 'Attendance & Leave', icon: 'pi-calendar-times', isOpen: false, children: attendanceSubmenus });
      if (assetSubmenus.length > 0) menus.push({ label: 'Asset Management', icon: 'pi-briefcase', isOpen: false, children: assetSubmenus });
      if (approvalSubmenus.length > 0) menus.push({ label: 'Approvals', icon: 'pi-check-square', isOpen: false, children: approvalSubmenus });
      menus.push(...standaloneBottomMenus);
    } else if (rawRoleId.includes('payroll')) {
      menus.length = 0;
      menus.push(
        { label: 'Dashboard', icon: 'pi-chart-bar', route: '/payroll/payroll-dashboard', isOpen: false },
        { label: 'Master Salary Preparation', icon: 'pi-money-bill', route: '/payroll/employee-salary-preparation', isOpen: false },
        { label: 'Monthly Salary Components', icon: 'pi-sliders-v', route: '/payroll/monthly-salary-components', isOpen: false },
        { label: 'Yearly Salary Components', icon: 'pi-sliders-h', route: '/payroll/yearly-salary-components', isOpen: false },
        { label: 'Employee Expense Statement', icon: 'pi-file-excel', route: '/payroll/employee-expense-statement', isOpen: false }
      );
    } else {
      (routesToMap || []).forEach((route) => {
        if (!route.path || route.redirectTo !== undefined || route.path.includes('dashboard')) return;
        menus.push({
          label: (route.title as string) || this.formatPathToLabel(route.path),
          icon: this.getIconForPath(route.path),
          route: `/${rolePrefix}/${route.path}`,
          isOpen: false,
        });
      });
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
    if (p.includes('salary') || p.includes('payroll')) return 'pi-money-bill';
    if (p.includes('component')) return 'pi-sliders-h';
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
    if (p.includes('work') || p.includes('task')) return 'pi-check-square';
    if (p.includes('role')) return 'pi-users';
    return 'pi-file';
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncLayoutForViewport();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((isOpen) => !isOpen);
  }

  closeSidebarOnMobile(): void {
    if (this.isMobileView()) {
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
        this.clearSession();
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

  onHeaderLogout(): void {
    this.clearSession();
  }

  private clearSession(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('selectedRoleId');
      sessionStorage.removeItem('roleOptions');
      sessionStorage.removeItem('token');
    }
  }

  onSearchQueryChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target?.value || '');
  }

  private filterMenuItems(items: SidebarMenuItem[], query: string): SidebarMenuItem[] {
    if (!query.trim()) return items;
    const lowerQuery = query.toLowerCase();

    return items
      .map((item) => {
        const cloned = { ...item };
        if (cloned.children && cloned.children.length > 0) {
          const matchedChildren = cloned.children
            .map((sub) => {
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
            .filter((sub): sub is SidebarMenuItem => sub !== null);

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
      .filter((item): item is SidebarMenuItem => item !== null);
  }

  private checkIsMobileView(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  }

  private syncLayoutForViewport(): void {
    const nextIsMobile = this.checkIsMobileView();
    if (nextIsMobile === this.isMobileView()) return;
    this.isMobileView.set(nextIsMobile);
    this.sidebarOpen.set(!nextIsMobile);
  }
}
