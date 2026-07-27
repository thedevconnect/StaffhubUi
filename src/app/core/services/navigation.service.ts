import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SidebarSubMenu {
  subMenuId: number;
  subMenuName: string;
  routePath?: string;
  forms?: any[];
}

export interface SidebarItem {
  menuId: number;
  menuName: string;
  routePath?: string;
  icon?: string;
  parentId?: number | null;
  isOpen?: boolean;
  subMenus?: SidebarSubMenu[];
  children?: any[];
}

export interface ModuleNavigation {
  moduleId: number;
  moduleName: string;
  moduleCode: string;
  menus: SidebarItem[];
}

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly apiBase = environment.apiBaseUrl;

  readonly sidebarModules = signal<ModuleNavigation[]>([]);
  readonly sidebarItems = signal<SidebarItem[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly flatSidebarItems = computed<SidebarItem[]>(() => {
    const mods = this.sidebarModules();
    if (mods.length > 0) {
      return mods.flatMap((m) => m.menus);
    }
    return this.sidebarItems();
  });

  constructor(private readonly http: HttpClient) {}

  fetchSidebar(roleId?: string | number): Observable<SidebarItem[] | ModuleNavigation[]> {
    this.isLoading.set(true);
    this.error.set(null);

    const token = localStorage.getItem('userToken') || sessionStorage.getItem('token') || '';
    const query = roleId ? `?roleId=${roleId}` : '';
    const url = `${this.apiBase}/api/v2/rbac/navigation/sidebar${query}`;

    return this.http.get<any>(url).pipe(
      tap((res) => {
        this.isLoading.set(false);
        if (Array.isArray(res)) {
          if (res.length > 0 && 'menus' in res[0]) {
            this.sidebarModules.set(res as ModuleNavigation[]);
            const flat = (res as ModuleNavigation[]).flatMap((m) => m.menus);
            this.sidebarItems.set(flat);
          } else {
            this.sidebarItems.set(res as SidebarItem[]);
          }
        }
      }),
      catchError((err) => {
        this.isLoading.set(false);
        this.error.set(err?.error?.message || 'Failed to load sidebar navigation');
        return of([]);
      })
    );
  }

  switchRole(targetRoleId: number | string): Observable<any> {
    const url = `${this.apiBase}/api/v2/rbac/switch-role`;
    return this.http.post<any>(url, { targetRoleId }).pipe(
      tap((res) => {
        if (res?.data?.token) {
          localStorage.setItem('userToken', res.data.token);
          sessionStorage.setItem('token', res.data.token);
        }
        this.fetchSidebar(targetRoleId).subscribe();
      })
    );
  }

  getBreadcrumbs(routePath: string): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/api/v2/rbac/navigation/breadcrumbs?route=${encodeURIComponent(routePath)}`);
  }

  getDashboardWidgets(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/api/v2/rbac/navigation/dashboard`);
  }

  getFeatureFlags(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/api/v2/rbac/navigation/feature-flags`);
  }
}
