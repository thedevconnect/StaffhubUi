import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly apiUrl = environment.apiBaseUrl;
  // Sidebar state management using Signals

  constructor(
    private http: HttpClient
  ) { }
  private readonly sidebarState = signal<boolean>(true);

  // Get sidebar state (readonly)
  getSidebarState() {
    return this.sidebarState.asReadonly();
  }

  // Toggle sidebar
  toggleSidebar(): void {
    this.sidebarState.update((state) => !state);
  }

  signup(data: any) {
    return this.http.post(`${this.apiUrl}/api/auth/signup`, data);
  }

  login(username: string, password: string) {
    return this.http.post(`${this.apiUrl}/api/auth/login`, {
      username,
      password
    });
  }

  createUser(data: any) {
    return this.http.post(`${this.apiUrl}/users`, data);
  }

  getAllUsers() {
    return this.http.get(`${this.apiUrl}/users`);
  }

  getAllAssets() {
    return this.http.get(`${this.apiUrl}/myassets`);
  }

  getUserById(id: string | number) {
    return this.http.get(`${this.apiUrl}/users/${id}`);
  }

  updateUser(id: string | number, data: any) {
    return this.http.put(`${this.apiUrl}/users/${id}`, data);
  }

  deleteUser(id: string | number) {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }

  // Set sidebar state
  setSidebarState(isOpen: boolean): void {
    this.sidebarState.set(isOpen);
  }

  // Computed value for sidebar width classes
  readonly sidebarWidth = computed(() => {
    return this.sidebarState() ? 'w-64' : 'w-16';
  });
}
