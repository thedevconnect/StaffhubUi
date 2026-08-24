import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
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
import { PayrollService } from '../../../shared/services/payroll.service';
import { NotificationComponent } from '../notification/notification';
import { ThemeService, ThemeMode, AccentColor } from '../../../shared/services/theme.service';

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
  public themeService = inject(ThemeService);
  private readonly cdr = inject(ChangeDetectorRef);

  changePasswordVisible = false;
  changePasswordForm!: FormGroup;
  savingPassword = false;

  isThemeMenuOpen = false;
  isColorMenuOpen = false;

  // Daily Earned Salary Signals
  readonly earnedSalaryAmount = signal<number>(0);
  readonly paidDaysWorked = signal<number>(0);
  readonly perDayRate = signal<number>(0);
  readonly baseSalary = signal<number>(0);

  toggleThemeMenu(): void {
    this.isThemeMenuOpen = !this.isThemeMenuOpen;
    if (this.isThemeMenuOpen) this.isColorMenuOpen = false;
    this.cdr.markForCheck();
  }

  toggleColorMenu(): void {
    this.isColorMenuOpen = !this.isColorMenuOpen;
    if (this.isColorMenuOpen) this.isThemeMenuOpen = false;
    this.cdr.markForCheck();
  }

  selectThemeMode(mode: ThemeMode): void {
    this.themeService.setThemeMode(mode);
    this.isThemeMenuOpen = false;
    this.cdr.markForCheck();
  }

  selectAccentColor(color: AccentColor): void {
    this.accentColorSelect(color);
  }

  accentColorSelect(color: AccentColor): void {
    this.themeService.setAccentColor(color);
    this.isColorMenuOpen = false;
    this.cdr.markForCheck();
  }

  onCustomColorPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input && input.value) {
      this.themeService.setCustomAccentColor(input.value);
      this.cdr.markForCheck();
    }
  }

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    public readonly userProfileService: UserProfileService,
    private readonly payrollService: PayrollService,
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

    this.userProfileService.getUserProfile().subscribe({
      error: () => { }
    });

    this.loadHeaderSalary();
  }

  loadHeaderSalary(): void {
    const user = this.authService.user();
    const userId = user?.id;

    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const daysInMonth = new Date(year, month, 0).getDate();

    if (userId) {
      this.payrollService.getEmployeesPayroll(month, year).subscribe({
        next: (res) => {
          if (res?.success && Array.isArray(res.data)) {
            const myEmp = res.data.find((e: any) => e.id === userId || e.employee_id === userId || e.user_id === userId);
            if (myEmp) {
              const base = Number(myEmp.base_salary || myEmp.master_base_salary || 50000);
              const paidDays = Number(myEmp.payable_days !== undefined && myEmp.payable_days !== null ? myEmp.payable_days : today.getDate());
              const perDay = daysInMonth > 0 ? Math.round((base / daysInMonth) * 100) / 100 : 0;
              const earned = Math.round((perDay * paidDays) * 100) / 100;

              this.baseSalary.set(base);
              this.paidDaysWorked.set(paidDays);
              this.perDayRate.set(perDay);
              this.earnedSalaryAmount.set(earned);
              this.cdr.markForCheck();
              return;
            }
          }
          this.fetchIndividualSalary(userId, month, year, today.getDate(), daysInMonth);
        },
        error: () => {
          this.fetchIndividualSalary(userId, month, year, today.getDate(), daysInMonth);
        }
      });
    } else {
      this.setFallbackSalary(today.getDate(), daysInMonth);
    }
  }

  fetchIndividualSalary(userId: number, month: number, year: number, todayDate: number, daysInMonth: number): void {
    this.payrollService.getEmployeePayrollDetails(userId, month, year).subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          const base = res.data.payroll?.base_salary ? Number(res.data.payroll.base_salary) : 50000;
          const paidDays = res.data.payable_days !== undefined && res.data.payable_days !== null ? Number(res.data.payable_days) : todayDate;
          const perDay = daysInMonth > 0 ? Math.round((base / daysInMonth) * 100) / 100 : 0;
          const earned = Math.round((perDay * paidDays) * 100) / 100;

          this.baseSalary.set(base);
          this.paidDaysWorked.set(paidDays);
          this.perDayRate.set(perDay);
          this.earnedSalaryAmount.set(earned);
          this.cdr.markForCheck();
        } else {
          this.setFallbackSalary(todayDate, daysInMonth);
        }
      },
      error: () => {
        this.setFallbackSalary(todayDate, daysInMonth);
      }
    });
  }

  setFallbackSalary(paidDays: number, totalDays: number): void {
    const base = 50000;
    const perDay = totalDays > 0 ? Math.round((base / totalDays) * 100) / 100 : 0;
    const earned = Math.round((perDay * paidDays) * 100) / 100;

    this.baseSalary.set(base);
    this.paidDaysWorked.set(paidDays);
    this.perDayRate.set(perDay);
    this.earnedSalaryAmount.set(earned);
    this.cdr.markForCheck();
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
        this.router.navigate(['/login']);
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
