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
import { MenuItem, ConfirmationService, MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/services/auth.service';
import { NotificationComponent } from '../notification/notification';

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
  imports: [CommonModule, FormsModule, AvatarModule,
    TooltipModule, MenuModule, SelectModule,
    NotificationComponent],
  standalone: true,
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeader {
  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly confirmationService: ConfirmationService,
    private readonly messageService: MessageService
  ) {
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
    this.confirmationService.confirm({
      message: 'Are you sure you want to logout?',
      header: 'Confirm Logout',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Logout' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancel', outlined: true },
      accept: () => {
        this.authService.logout();
        this.messageService.add({
          severity: 'success',
          summary: 'Logged Out',
          detail: 'You have been successfully logged out.',
          life: 4000
        });
        this.router.navigate(['/landing']);
        this.onLogout.emit();
      }
    });
  }

  private handleProfile(): void {
    this.router.navigate(['/ess/profile']);
  }

}
