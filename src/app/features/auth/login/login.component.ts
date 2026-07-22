import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../shared/services/user-service';
import { AuthService } from '../../../shared/services/services/auth.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { FloatLabelModule } from 'primeng/floatlabel';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    ButtonModule,
    TextareaModule,
    ToastModule,
    ConfirmDialogModule,
    FloatLabelModule,
    IconFieldModule,
    InputIconModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  forgateForm!: FormGroup;
  createPassForm!: FormGroup;

  showPassword = false;
  showConfirmPassword = false;
  isProcess = false;

  formType: string = 'login';
  show = false;
  parameterType: string = '';
  display: string = 'none';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      rememberMe: [false]
    });

    this.forgateForm = this.fb.group({
      email: ['', Validators.required]
    });

    this.createPassForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', Validators.required],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    });

    const username = localStorage.getItem('loginUser');
    const password = localStorage.getItem('loginPass');

    if (username && password) {
      this.loginForm.patchValue({
        username,
        password,
        rememberMe: true
      });
    }
  }

  get f() { return this.loginForm.controls; }
  get f1() { return this.forgateForm.controls; }
  get f3() { return this.createPassForm.controls; }

  get isProccess() { return this.isProcess; }

  showPass() {
    this.show = !this.show;
  }

  onEmailInput(event: Event, controlName: string): void {
    const inputElement = event.target as HTMLInputElement;
    let value = inputElement.value;

    if (value.endsWith('@')) {
      value = value + 'gmail.com';
      const control = this.loginForm.get(controlName) || this.forgateForm.get(controlName) || this.createPassForm.get(controlName);
      if (control) {
        control.setValue(value);
      }
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  togglePasswordVisibility(field: string) {
    if (field === 'password') this.showPassword = !this.showPassword;
    if (field === 'confirmPassword') this.showConfirmPassword = !this.showConfirmPassword;
  }

  redirectForm(type: string, val: number) {
    if (type === 'signup') {
      this.router.navigate(['/register-company']);
      return;
    }
    this.formType = type;
  }

  gotoTermsCondition() { }

  submitLoginForm() {
    this.submitLogin();
  }

  submitForgatePasswordForm() {
    if (this.forgateForm.invalid) {
      this.forgateForm.markAllAsTouched();
      return;
    }

    const email = this.forgateForm.value.email;
    this.isProcess = true;

    this.authService.forgotPassword(email).subscribe({
      next: (res: any) => {
        this.isProcess = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Account Verified',
          detail: res?.message || 'Account verified! Please set your new password.',
          life: 4000
        });

        this.createPassForm.patchValue({
          name: res?.data?.fullName || 'User',
          email: res?.data?.email || email,
          password: '',
          confirmPassword: ''
        });

        this.formType = 'createPassword';
        this.forgateForm.reset();
      },
      error: (err: any) => {
        this.isProcess = false;
        const errorMsg = err?.error?.message || err?.message || 'No account found with this Email ID or Username';
        this.messageService.add({
          severity: 'error',
          summary: 'Reset Request Failed',
          detail: errorMsg,
          life: 4000
        });
      }
    });
  }

  submitCreatePassForm() {
    if (this.createPassForm.invalid) {
      this.createPassForm.markAllAsTouched();
      return;
    }

    const { email, password, confirmPassword } = this.createPassForm.value;

    if (password !== confirmPassword) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Passwords do not match. Please enter matching passwords.',
        life: 4000
      });
      return;
    }

    this.isProcess = true;

    this.authService.resetPassword({ email, password }).subscribe({
      next: (res: any) => {
        this.isProcess = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Password Reset Successful',
          detail: res?.message || 'Password has been reset successfully. Please log in.',
          life: 5000
        });
        this.formType = 'login';
        this.createPassForm.reset();
      },
      error: (err: any) => {
        this.isProcess = false;
        const errorMsg = err?.error?.message || err?.message || 'Failed to reset password';
        this.messageService.add({
          severity: 'error',
          summary: 'Reset Failed',
          detail: errorMsg,
          life: 4000
        });
      }
    });
  }

  onCloseHandled() {
    this.display = 'none';
  }

  OnSubmitModal() {
    this.display = 'none';
  }

  submitLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { username, password, rememberMe } = this.loginForm.value;

    if (rememberMe) {
      localStorage.setItem('loginUser', username);
      localStorage.setItem('loginPass', password);
    } else {
      localStorage.removeItem('loginUser');
      localStorage.removeItem('loginPass');
    }

    this.isProcess = true;

    this.authService.login({ username, password }).subscribe({
      next: (res: any) => {
        this.isProcess = false;
        const name = this.authService.user()?.employeeName || 'User';
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Welcome Back, ${name}!`,
          life: 4000
        });
        this.router.navigate([this.authService.getDashboardRoute()]);
      },
      error: (err: any) => {
        this.isProcess = false;
        const errorMessage = err?.error?.message || 'Invalid username/email or password. Please try again';
        this.messageService.add({
          severity: 'error',
          summary: 'Invalid Credentials',
          detail: errorMessage === 'Invalid username or password' ? 'Invalid username/email or password. Please try again' : errorMessage,
          life: 4000
        });
      }
    });
  }
}