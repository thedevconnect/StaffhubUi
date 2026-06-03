import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface UserListItem {
  id: number;
  username: string;
  employeeName: string;
  personalemail: string;
  phone: string;
  currentRole: string;
  orgMasterId: number;
  isActive: number;
}

interface UsersApiResponse {
  success: boolean;
  data: UserListItem[];
}

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly apiBase = environment.apiBaseUrl;

  readonly users = signal<UserListItem[]>([]);
  readonly loading = signal(false);

  constructor(private readonly http: HttpClient) {}

  loadUsers(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.http.get<UsersApiResponse>(`${this.apiBase}/users`).subscribe({
      next: (response) => {
        if (response?.success && Array.isArray(response.data)) {
          this.users.set(response.data);
        } else {
          this.users.set([]);
        }
        this.loading.set(false);
      },
      error: () => {
        this.users.set([]);
        this.loading.set(false);
      },
    });
  }
}

