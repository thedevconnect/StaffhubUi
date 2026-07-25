import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  OnInit
} from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MenuItem, ConfirmationService, MessageService } from 'primeng/api';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/services/auth.service';
import { UserProfileService } from '../../../shared/services/user-profile.service';
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
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AvatarModule,
    TooltipModule,
    MenuModule,
    SelectModule,
    DialogModule,
    PasswordModule,
    ButtonModule,
    NotificationComponent
  ],
  standalone: true,
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeader implements OnInit {
  changePasswordVisible = false;
  changePasswordForm!: FormGroup;
  savingPassword = false;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly userProfileService: UserProfileService,
    private readonly confirmationService: ConfirmationService,
    private readonly messageService: MessageService,
    private readonly fb: FormBuilder
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
    this.changePasswordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });

    this.userMenuItems = [
      { label: 'Profile', icon: 'pi pi-user', command: () => this.handleProfile() },
      { label: 'Change Password', icon: 'pi pi-key', command: () => this.handleChangePassword() },
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
    this.router.navigate(['/ess/manage-profile']);
  }

  private handleChangePassword(): void {
    this.changePasswordForm.reset();
    this.changePasswordVisible = true;
  }

  submitChangePassword(): void {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    const { oldPassword, newPassword, confirmPassword } = this.changePasswordForm.value;

    if (newPassword !== confirmPassword) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'New password and confirm password do not match.'
      });
      return;
    }

    this.savingPassword = true;

    this.userProfileService.changePassword({ oldPassword, newPassword }).subscribe({
      next: (res) => {
        this.savingPassword = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Password Updated',
          detail: res?.message || 'Password changed successfully!'
        });
        this.changePasswordVisible = false;
        this.changePasswordForm.reset();
      },
      error: (err) => {
        this.savingPassword = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Password Change Failed',
          detail: err?.error?.message || 'Old password does not match or change failed.'
        });
      }
    });
  }
}
