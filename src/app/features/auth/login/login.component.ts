import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../shared/services/user-service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { MessageService } from 'primeng/api';
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
    FloatLabelModule,
    IconFieldModule,
    InputIconModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [MessageService]
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
    private messageService: MessageService
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

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  togglePasswordVisibility(field: string) {
    if (field === 'password') this.showPassword = !this.showPassword;
    if (field === 'confirmPassword') this.showConfirmPassword = !this.showConfirmPassword;
  }

  redirectForm(type: string, val: number) {
    if (type === 'signup') {
      this.router.navigate(['/register']);
      return;
    }
    this.formType = type;
  }

  gotoTermsCondition() { }

  submitLoginForm() {
    this.submitLogin();
  }

  submitForgatePasswordForm() { }
  submitCreatePassForm() { }

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

    this.userService.login(username, password).subscribe({
      next: (apiRes: any) => {
        this.isProcess = false;

        const res = apiRes.data || apiRes;

        localStorage.setItem('userToken', res.token);
        localStorage.setItem('userId', res.userId);
        localStorage.setItem('companyId', res.companyId);
        localStorage.setItem('role', res.role);

        // Update AuthService session
        this.authService.setSessionFromLogin(res, username);

        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Login successfully' });
        this.router.navigate([this.authService.getDashboardRoute()]);
      },
      error: (err: any) => {
        this.isProcess = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Invalid username or password' });
      }
    });
  }
}