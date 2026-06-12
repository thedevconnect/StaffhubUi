import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface UserListItem {
  id: number;
  company_id: number;
  emp_id: string;
  full_name: string;
  username: string;
  email: string;
  mobile: string;
  role: string;
  status: string;
  email_verified_at: string | null;
  mobile_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UsersApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  status: string;
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
    this.http.get<UsersApiResponse>(`${this.apiBase}/api/users`).subscribe({
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

