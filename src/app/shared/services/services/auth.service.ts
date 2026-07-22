import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AuthUser, JwtPayload, LoginApiResponse, LoginRequest, RoleOption } from '../models/auth.model';
import { environment } from '../../../../environments/environment';

const SESSION_KEY = 'staffhub_auth_session';

interface StoredSession {
  user: AuthUser;
  selectedRoleId: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiBase = environment.apiBaseUrl;

  private readonly _user = signal<AuthUser | null>(null);
  private readonly _selectedRoleId = signal<string | null>(null);

  readonly user = computed(() => this._user());
  readonly roleOptions = computed(() => this._user()?.roles ?? []);
  readonly selectedRoleId = computed(() => this._selectedRoleId() ?? this.roleOptions()[0]?.roleId ?? '');
  readonly isAuthenticated = computed(() => !!this._user());

  constructor(private readonly http: HttpClient) {
    this.restoreSession();
  }

  login(payload: LoginRequest): Observable<{ message: string }> {
    return this.http.post<LoginApiResponse>(`${this.apiBase}/api/auth/login`, payload).pipe(
      tap((response: any) => {
        if (response?.status !== 'success' && response?.statusCode !== 200 && !response?.success) {
          throw new Error(response?.message || 'Login failed');
        }
      }),
      map((response) => {
        const token = response.data.token || '';
        if (token) {
           localStorage.setItem('userToken', token);
        }
        const decoded = this.decodeToken(token);
        const user = this.toAuthUser(response.data, decoded);
        this._user.set(user);
        this._selectedRoleId.set(user.roles[0]?.roleId ?? '');
        this.persistSession();
        return { message: response.message || 'Login successful' };
      }),
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiBase}/api/auth/forgot-password`, { email });
  }

  resetPassword(payload: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiBase}/api/auth/reset-password`, payload);
  }

  logout(): void {
    this._user.set(null);
    this._selectedRoleId.set(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('userToken');
    sessionStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('companyId');
    localStorage.removeItem('role');
  }

  setSelectedRole(roleId: string): void {
    this._selectedRoleId.set(roleId);
    this.persistSession();
  }

  getDashboardRoute(): string {
    const roleId = this.selectedRoleId().toLowerCase();
    if (roleId === 'hradmin' || roleId === 'hr_admin') {
      return '/hradmin/hradmin-dashboard';
    }
    if (roleId === 'superadmin' || roleId === 'super_admin') {
      return '/superadmin/superadmin-dashboard';
    }
    if (roleId === 'developer') {
      return '/developer/developer-dashboard';
    }
    if (roleId === 'payroll' || roleId === 'payroll_admin' || roleId.includes('payroll')) {
      return '/payroll/payroll-dashboard';
    }
    return '/ess/ess-dashboard';
  }

  private restoreSession(): void {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const session = JSON.parse(raw) as StoredSession;
      if (!session?.user) return;
      this._user.set(session.user);
      this._selectedRoleId.set(session.selectedRoleId || session.user.roles[0]?.roleId || '');
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  private persistSession(): void {
    const user = this._user();
    if (!user) return;
    const selectedRoleId = this.selectedRoleId();
    const payload: StoredSession = { user, selectedRoleId };
    localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  }

  decodeToken(token: string): JwtPayload | null {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      return JSON.parse(jsonPayload) as JwtPayload;
    } catch (e) {
      return null;
    }
  }

  private toAuthUser(data: LoginApiResponse['data'], decoded: JwtPayload | null): AuthUser {
    let normalizedRoles = this.normalizeRoles(data);
    const companyId = decoded?.companyId || (data as any)?.companyId || localStorage.getItem('companyId') || null;

    return {
      id: decoded?.userId || data.userId || data.id || 0,
      username: data.username || data.userName || '',
      employeeName: data.employeeName || data.userName || data.username || 'User',
      companyId: companyId ? Number(companyId) : undefined,
      roles: normalizedRoles.length ? normalizedRoles : [{ rolDes: 'HR Admin', roleId: 'hradmin' }],
    };
  }

  private normalizeRoles(data: LoginApiResponse['data']): RoleOption[] {
    let roles: RoleOption[] = [];
    if (Array.isArray(data.roles) && data.roles.length) {
      roles = data.roles.map((role) => ({
        rolDes: role.roleName || role.role || '',
        roleId: String(role.roleCode || role.roleId || role.role || '').toLowerCase(),
      }));
    } else if (Array.isArray(data.role)) {
      roles = data.role.map((role, index) => ({
        rolDes: role,
        roleId: String(Array.isArray(data.roleId) ? data.roleId[index] ?? role : role).toLowerCase(),
      }));
    } else if (typeof data.role === 'string') {
      if (data.role.includes(',')) {
        roles = data.role.split(',').map((r) => {
          const trimmed = r.trim();
          return {
            rolDes: trimmed,
            roleId: trimmed.toLowerCase(),
          };
        });
      } else {
        roles = [
          {
            rolDes: data.role,
            roleId: String(data.roleId ?? data.role).toLowerCase(),
          },
        ];
      }
    }

    const essIndex = roles.findIndex(r => r.roleId === 'ess');
    if (essIndex > -1) {
      const essRole = roles.splice(essIndex, 1)[0];
      roles.unshift(essRole);
    }
    return roles;
  }

  setSessionFromLogin(res: any, username: string): void {
    const token = res.token || localStorage.getItem('userToken') || '';
    const decoded = this.decodeToken(token);
    
    let normalizedRoles = this.normalizeRoles(res);

    const user: AuthUser = {
      id: decoded?.userId || res.userId || res.id || 0,
      username: username,
      employeeName: res.userName || username,
      companyId: decoded?.companyId,
      roles: normalizedRoles.length ? normalizedRoles : [{ rolDes: 'HR Admin', roleId: 'hradmin' }]
    };
    this._user.set(user);
    this._selectedRoleId.set(user.roles[0]?.roleId ?? '');
    this.persistSession();
  }
}
