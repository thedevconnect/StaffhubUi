import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user-service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [MessageService]
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  showPassword = false;
  isProcess = false;
  captchaCode = '';

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

  get f() {
    return this.loginForm.controls;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
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