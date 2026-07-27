import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
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
import { NavigationService } from '../../services/navigation.service';
import { PermissionService } from '../../services/permission.service';

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
  private readonly authService = inject(AuthService);
  private readonly navigationService = inject(NavigationService);
  private readonly permissionService = inject(PermissionService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);

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

  // Dynamic menu items loaded from database
  readonly dynamicMenuItems = signal<SidebarMenuItem[]>([]);
  readonly searchQuery = signal<string>('');

  readonly filteredMenuItems = computed(() =>
    this.filterMenuItems(this.dynamicMenuItems(), this.searchQuery())
  );

  ngOnInit(): void {
    this.fetchUserSidebar();
  }

  fetchUserSidebar(): void {
    const roleId = this.selectedRoleId();
    if (!roleId) return;

    this.navigationService.fetchSidebar(roleId).subscribe({
      next: (res: any) => {
        const menuItems: SidebarMenuItem[] = [
          { label: 'Dashboard', icon: 'pi-home', route: this.getDashboardRoute(), isOpen: false }
        ];

        let navData: any[] = [];
        if (Array.isArray(res) && res.length > 0 && 'menus' in res[0]) {
          navData = res.flatMap((m: any) => m.menus);
        } else if (Array.isArray(res)) {
          navData = res;
        }

        // Store permissions map in PermissionService
        this.permissionService.setPermissions(navData, roleId.toLowerCase().includes('super'));

        navData.forEach((item: any) => {
          const childrenItems: SidebarMenuItem[] = [];
          if (Array.isArray(item.subMenus)) {
            item.subMenus.forEach((sub: any) => {
              childrenItems.push({
                label: sub.subMenuName,
                icon: sub.icon || 'pi-file',
                route: this.normalizeRoute(sub.routePath || item.routePath, roleId),
                isOpen: false
              });
            });
          }
          if (Array.isArray(item.children)) {
            item.children.forEach((act: any) => {
              childrenItems.push({
                label: act.activityName,
                icon: act.iconClass || 'pi-circle-fill',
                route: this.normalizeRoute(act.callingPage || item.routePath, roleId),
                isOpen: false
              });
            });
          }

          menuItems.push({
            label: item.menuName || item.label,
            icon: this.getIconForMenu(item.icon || item.menuName),
            route: item.routePath ? this.normalizeRoute(item.routePath, roleId) : undefined,
            isOpen: false,
            children: childrenItems.length > 0 ? childrenItems : undefined
          });
        });

        this.dynamicMenuItems.set(menuItems);
      },
      error: (err) => {
        console.error('Failed to load dynamic sidebar navigation:', err);
      }
    });
  }

  private normalizeRoute(routePath: string, roleId: string): string {
    if (!routePath) return '/';
    if (routePath.startsWith('/')) return routePath;
    const prefix = roleId.toLowerCase().includes('hr') ? 'hradmin' :
                   roleId.toLowerCase().includes('super') ? 'superadmin' :
                   roleId.toLowerCase().includes('dev') ? 'developer' :
                   roleId.toLowerCase().includes('payroll') ? 'payroll' : 'ess';
    return `/${prefix}/${routePath}`;
  }

  private getIconForMenu(iconOrName: string = ''): string {
    const val = iconOrName.toLowerCase();
    if (val.includes('admin') || val.includes('role') || val.includes('user')) return 'pi-shield';
    if (val.includes('attendance') || val.includes('clock')) return 'pi-calendar-times';
    if (val.includes('leave')) return 'pi-sign-out';
    if (val.includes('payroll') || val.includes('money')) return 'pi-calculator';
    if (val.includes('profile')) return 'pi-user';
    if (val.includes('asset')) return 'pi-briefcase';
    if (val.includes('ticket')) return 'pi-ticket';
    return 'pi-folder';
  }

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
    this.navigationService.switchRole(roleId).subscribe({
      next: () => {
        this.fetchUserSidebar();
        this.router.navigate([this.getDashboardRoute()]);
      },
      error: () => {
        this.fetchUserSidebar();
        this.router.navigate([this.getDashboardRoute()]);
      }
    });
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
        sessionStorage.clear();
        this.router.navigate(['/login']);
      },
    });
  }

  onHeaderLogout(): void {
    sessionStorage.clear();
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
          const matchedChildren = cloned.children.filter((child) =>
            child.label.toLowerCase().includes(lowerQuery)
          );
          if (matchedChildren.length > 0 || cloned.label.toLowerCase().includes(lowerQuery)) {
            cloned.children = matchedChildren.length > 0 ? matchedChildren : cloned.children;
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

    if (nextIsMobile === previousIsMobile) return;

    this.isMobileView.set(nextIsMobile);
    this.sidebarOpen.set(!nextIsMobile);
  }
}
