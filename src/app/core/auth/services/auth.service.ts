import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AuthUser, LoginApiResponse, LoginRequest, RoleOption } from '../models/auth.model';
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
      tap((response) => {
        if (!response?.success) {
          throw new Error(response?.message || 'Login failed');
        }
      }),
      map((response) => {
        const user = this.toAuthUser(response.data);
        this._user.set(user);
        this._selectedRoleId.set(user.roles[0]?.roleId ?? '');
        this.persistSession();
        return { message: response.message || 'Login successful' };
      }),
    );
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
    return this.selectedRoleId().toLowerCase().includes('ess') ? '/ess/ess-dashboard' : '/ess/ess-dashboard';
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

  private toAuthUser(data: LoginApiResponse['data']): AuthUser {
    const normalizedRoles = this.normalizeRoles(data);
    return {
      id: data.userId || data.id || 0,
      username: data.username || data.userName || '',
      employeeName: data.employeeName || data.userName || data.username || 'User',
      roles: normalizedRoles.length ? normalizedRoles : [{ rolDes: 'HR Admin', roleId: 'hradmin' }],
    };
  }

  private normalizeRoles(data: LoginApiResponse['data']): RoleOption[] {
    if (Array.isArray(data.roles) && data.roles.length) {
      return data.roles.map((role) => ({
        rolDes: role.roleName || role.role || '',
        roleId: String(role.roleCode || role.roleId || role.role || '').toLowerCase(),
      }));
    }

    if (Array.isArray(data.role)) {
      return data.role.map((role, index) => ({
        rolDes: role,
        roleId: String(Array.isArray(data.roleId) ? data.roleId[index] ?? role : role).toLowerCase(),
      }));
    }

    if (typeof data.role === 'string') {
      if (data.role.includes(',')) {
        return data.role.split(',').map((r) => {
          const trimmed = r.trim();
          return {
            rolDes: trimmed,
            roleId: trimmed.toLowerCase(),
          };
        });
      }
      return [
        {
          rolDes: data.role,
          roleId: String(data.roleId ?? data.role).toLowerCase(),
        },
      ];
    }

    return [];
  }

  setSessionFromLogin(res: any, username: string): void {
    const normalizedRoles = this.normalizeRoles(res);
    const user: AuthUser = {
      id: res.userId || res.id || 0,
      username: username,
      employeeName: res.userName || username,
      roles: normalizedRoles.length ? normalizedRoles : [{ rolDes: 'HR Admin', roleId: 'hradmin' }]
    };
    this._user.set(user);
    this._selectedRoleId.set(user.roles[0]?.roleId ?? '');
    this.persistSession();
  }
}
