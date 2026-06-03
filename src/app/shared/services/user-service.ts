import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class UserService {
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
  login(username: string, password: string) {
    return this.http.post('http://localhost:5000/api/auth/login', {
      username,
      password
    });
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

