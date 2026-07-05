import { Component, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl
} from '@angular/forms';
import { Captcha } from '../captcha/captcha';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Router } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RippleModule } from 'primeng/ripple';
import { BreadcrumbModule } from 'primeng/breadcrumb';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToastModule,
    Captcha,
    ProgressSpinnerModule,
    RippleModule,
    BreadcrumbModule
  ],
  templateUrl: './change-password.html'
})
export class ChangePassword {

  @ViewChild(Captcha) captchaComponent!: Captcha;

  changePasswordForm: FormGroup;
  isProcess = signal(false);

  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  breadcrumbItems = [
    { label: 'Home', routerLink: '/home' },
    { label: 'Profile', routerLink: '/user-profile' },
    { label: 'Change Password' }
  ];

  constructor(
    private fb: FormBuilder,
    private message: MessageService,
    private router: Router
  ) {
    this.changePasswordForm = this.buildForm();
  }

  private buildForm(): FormGroup {
    return this.fb.group(
      {
        oldPassword: ['', Validators.required],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.pattern(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/
            )
          ]
        ],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  private passwordMatchValidator(control: AbstractControl) {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ mismatch: true });
    } else {
      return null;
    }

    return null;
  }

  onReset() {
    this.changePasswordForm.reset();
    this.captchaComponent.generateCaptcha();
    this.captchaComponent.userInput.set('');
  }
  

  onSubmit() {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    if (!this.validateCaptcha()) return;

    this.processPasswordChange();
  }

  private validateCaptcha(): boolean {
    if (!this.captchaComponent.userInput()) {
      this.showToast('warn', 'Missing CAPTCHA', 'Please enter the captcha');
      return false;
    }

    if (!this.captchaComponent.isValid()) {
      this.showToast(
        'error',
        'Invalid CAPTCHA',
        'The CAPTCHA you entered is incorrect. Please try again.'
      );
      this.captchaComponent.generateCaptcha();
      this.captchaComponent.userInput.set('');
      return false;
    }

    return true;
  }

  private processPasswordChange() {
    this.isProcess.set(true);

    // Simulated API Call
    setTimeout(() => {
      this.isProcess.set(false);
      this.showToast('success', 'Success', 'Password changed successfully');
      this.router.navigate(['/login']);
    }, 1500);
  }

  private showToast(severity: string, summary: string, detail: string) {
    this.message.add({ severity, summary, detail });
  }

  togglePassword(type: 'old' | 'new' | 'confirm') {
    if (type === 'old') this.showOldPassword = !this.showOldPassword;
    if (type === 'new') this.showNewPassword = !this.showNewPassword;
    if (type === 'confirm') this.showConfirmPassword = !this.showConfirmPassword;
  }
}