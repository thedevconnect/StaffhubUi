import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/services/auth.service';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ToastModule,
    FloatLabelModule
  ],
  providers: [MessageService],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
  forgotForm!: FormGroup;
  isProcess = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.forgotForm = this.fb.group({
      email: ['', Validators.required],
      oldPassword: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  get f() {
    return this.forgotForm.controls;
  }

  onEmailInput(event: Event, controlName: string): void {
    const inputElement = event.target as HTMLInputElement;
    let value = inputElement.value;

    if (value.endsWith('@')) {
      value = value + 'gmail.com';
      const control = this.forgotForm.get(controlName);
      if (control) {
        control.setValue(value);
      }
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  submitForgotPasswordForm(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    const { email, oldPassword, password, confirmPassword } = this.forgotForm.value;

    if (password !== confirmPassword) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'New password and Confirm password do not match.',
        life: 4000
      });
      return;
    }

    this.isProcess = true;

    this.authService.resetPassword({ email, oldPassword, password }).subscribe({
      next: (res: any) => {
        this.isProcess = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Password Updated',
          detail: res?.message || 'Password has been set successfully. Please log in.',
          life: 5000
        });

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err: any) => {
        this.isProcess = false;
        const errorMsg = err?.error?.message || err?.message || 'Failed to update password. Please check your credentials.';
        this.messageService.add({
          severity: 'error',
          summary: 'Password Update Failed',
          detail: errorMsg,
          life: 5000
        });
      }
    });
  }
}
