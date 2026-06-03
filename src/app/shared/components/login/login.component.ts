import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user-service';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [MessageService]
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  signupForm!: FormGroup;
  forgateForm!: FormGroup;
  createPassForm!: FormGroup;

  showPassword = false;
  showConfirmPassword = false;
  isProcess = false;
  captchaCode = '';
  
  formType: string = 'login';
  show = false;
  parameterType: string = '';
  display: string = 'none';
  showOTP = false;
  emailVerified = false;
  mobileVerified = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      captcha: ['', Validators.required],
      rememberMe: [false]
    });

    this.signupForm = this.fb.group({
      companyName: ['', Validators.required],
      shortName: ['', Validators.required],
      address: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', Validators.required],
      mobile: ['', Validators.required],
      captcha: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue]
    });

    this.forgateForm = this.fb.group({
      email: ['', Validators.required],
      captcha: ['', Validators.required]
    });

    this.createPassForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', Validators.required],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    });

    this.generateCaptcha();

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
  get f2() { return this.signupForm.controls; }
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
    this.formType = type;
  }

  gotoTermsCondition() {}

  GenerateCaptcha(type: number) {
    this.generateCaptcha();
  }

  captchavoice(type: number) {}

  submitLoginForm() {
    this.submitLogin();
  }

  submitForgatePasswordForm() {}
  submitSignUpForm() {}
  submitCreatePassForm() {}

  onCloseHandled() {
    this.display = 'none';
  }

  OnSubmitModal() {
    this.display = 'none';
  }

  generateCaptcha() {
    const chars = '1234567890';
    this.captchaCode = '';

    for (let i = 0; i < 6; i++) {
      this.captchaCode += chars[Math.floor(Math.random() * chars.length)];
    }
  }

  refreshCaptcha() {
    this.loginForm.patchValue({ captcha: '' });
    this.generateCaptcha();
  }

  submitLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    if (this.loginForm.value.captcha !== this.captchaCode) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Captcha is not valid' });
      this.refreshCaptcha();
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
      next: (res: any) => {
        this.isProcess = false;

        sessionStorage.setItem('userToken', res.token);
        sessionStorage.setItem('userId', res.userId);
        sessionStorage.setItem('userName', res.userName);

        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Login successfully' });
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isProcess = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Invalid username or password' });
        this.refreshCaptcha();
      }
    });
  }
}