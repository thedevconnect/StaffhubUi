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
  readonly filteredMenuItems = computed(() => this.filterMenuItems(this.menuItemsWithSubmenu(), this.searchQuery()));

  constructor(
    private readonly authService: AuthService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly router: Router,
    private readonly userService: UserService
  ) { }

  ngOnInit(): void {
    this.fetchUserSidebar();
  }

  fetchUserSidebar(): void {
    const roleId = this.selectedRoleId();
    if (!roleId) return;

    const rawRoleId = roleId.toLowerCase();
    const rolePrefix = (rawRoleId === 'hr_admin' || rawRoleId === 'hradmin') ? 'hradmin' : rawRoleId;

    const formatIcon = (iconStr: string | null | undefined, defaultIcon: string): string => {
      if (!iconStr) return defaultIcon;
      return iconStr.startsWith('pi-') ? iconStr : 'pi-' + iconStr;
    };

    this.userService.getUserSidebar(roleId).subscribe({
      next: (res: any) => {
        const sidebarData = Array.isArray(res) ? res : (res.data || []);

        if (sidebarData && sidebarData.length > 0) {
          const mappedMenus = sidebarData.map((menu: any) => {
            const menuRouteClean = (menu.routePath || '').replace(/^\//, '');
            const parentRoute = menuRouteClean
              ? (menuRouteClean.startsWith(`${rolePrefix}/`) ? `/${menuRouteClean}` : `/${rolePrefix}/${menuRouteClean}`)
              : undefined;

            return {
              label: menu.menuName,
              icon: formatIcon(menu.icon, 'pi-folder'),
              route: parentRoute,
              isOpen: false,
              children: menu.children && menu.children.length > 0 ? menu.children.map((child: any) => {
                const childRouteClean = (child.formValue || '').replace(/^\//, '');
                const childRoute = childRouteClean
                  ? (childRouteClean.startsWith(`${rolePrefix}/`) ? `/${childRouteClean}` : `/${rolePrefix}/${childRouteClean}`)
                  : undefined;

                return {
                  label: child.activityName,
                  route: childRoute,
                  icon: formatIcon(child.iconClass, 'pi-file')
                };
              }) : undefined
            };
          });

          const menus = [
            { label: 'Dashboard', icon: 'pi-home', route: this.getDashboardRoute() },
            ...mappedMenus
          ];
          this.dynamicMenuItems.set(menus);
        } else {
          this.dynamicMenuItems.set([{ label: 'Dashboard', icon: 'pi-home', route: this.getDashboardRoute() }]);
        }
      },
      error: (err) => {
        console.error('Failed to fetch sidebar', err);
        this.dynamicMenuItems.set([{ label: 'Dashboard', icon: 'pi-home', route: this.getDashboardRoute() }]);
      }
    });
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
