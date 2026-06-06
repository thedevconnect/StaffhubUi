import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
} from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { MenuItem } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';

interface UserDetails {
  name: string;
  email: string;
  role: string;
}

interface RoleOption {
  rolDes: string;
  roleId: string;
}

@Component({
  selector: 'app-app-header',
  imports: [CommonModule, FormsModule, AvatarModule, TooltipModule, MenuModule, SelectModule],
  standalone: true,
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeader {
  constructor(private readonly router: Router, private readonly authService: AuthService) {
    effect(() => {
      const parentRoleId = this.selectedRoleId();
      if (parentRoleId) {
        this.internalSelectedRoleId = parentRoleId === 'hr' ? 'hrAdmin' : parentRoleId;
      }
    });
  }

  user = input.required<UserDetails>();
  onLogout = output<void>();
  onRoleChange = output<string>();
  sidebarOpen = input<boolean>(false);
  selectedRoleId = input<string>('hrAdmin');
  roleOptions = input<RoleOption[]>([]);
  onToggleSidebar = output<void>();

  internalSelectedRoleId = '';

  currentRole = computed(() => {
    const roleId = this.internalSelectedRoleId || this.selectedRoleId();
    const role = this.roleOptions().find((item) => item.roleId === roleId);
    return role?.rolDes || 'Select Role';
  });

  userMenuItems: MenuItem[] = [];

  ngOnInit(): void {
    this.userMenuItems = [
      { label: 'Profile', icon: 'pi pi-user', command: () => this.handleProfile() },
      { separator: true },
      { label: 'Logout', icon: 'pi pi-sign-out', command: () => this.logout() },
    ];

    if (!this.internalSelectedRoleId) {
      this.internalSelectedRoleId = this.selectedRoleId() || this.roleOptions()[0]?.roleId || '';
    }
  }

  getUserInitial(): string {
    return (this.user().name || 'U').charAt(0).toUpperCase();
  }

  getUserName(): string {
    return this.user().name || 'User';
  }

  onRoleDropdownChange(event: { value?: string }): void {
    if (!event?.value) return;
    this.internalSelectedRoleId = event.value;
    this.onRoleChange.emit(event.value);
  }

  toggleSidebar(): void {
    this.onToggleSidebar.emit();
  }

  private logout(): void {
    // Clear auth session and redirect to login page
    this.authService.logout();
    this.router.navigate(['/login']);
    // Emit event for any parent listeners (optional)
    this.onLogout.emit();
  }

  private handleProfile(): void {
    this.router.navigate(['/profile']);
  }

}
