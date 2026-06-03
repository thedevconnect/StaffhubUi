import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user-service';
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
      confirmPassword: ['', Validators.required],
      captcha: ['', Validators.required]
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
    this.generateCaptcha();
  }

  gotoTermsCondition() { }

  GenerateCaptcha(type: number) {
    this.generateCaptcha();
  }

  captchavoice(type: number) { }

  submitLoginForm() {
    this.submitLogin();
  }

  submitForgatePasswordForm() { }
  submitSignUpForm() { }
  submitCreatePassForm() { }

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

    if (this.formType === 'login') {
      this.drawCaptcha('loginTextCanvas', this.captchaCode);
    } else if (this.formType === 'forgotpassword') {
      this.drawCaptcha('fpTextCanvas', this.captchaCode);
    } else if (this.formType === 'signup') {
      this.drawCaptcha('signupTextCanvas', this.captchaCode);
    } else if (this.formType === 'createPassword') {
      this.drawCaptcha('cpTextCanvas', this.captchaCode);
    }
  }

  drawCaptcha(canvasId: string, code: string) {
    setTimeout(() => {
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background styling
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#f1f5f9');
      gradient.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add noise lines
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
      }

      // Draw text
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Apply slight rotation & distortion to characters
      const chars = code.split('');
      const charWidth = canvas.width / (chars.length + 1);
      for (let i = 0; i < chars.length; i++) {
        const x = charWidth * (i + 1) + (Math.random() * 4 - 2);
        const y = canvas.height / 2 + (Math.random() * 6 - 3);
        const angle = (Math.random() * 20 - 10) * Math.PI / 180;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillText(chars[i], 0, 0);
        ctx.restore();
      }
    }, 50);
  }

  refreshCaptcha() {
    if (this.formType === 'login') {
      this.loginForm.patchValue({ captcha: '' });
    } else if (this.formType === 'forgotpassword') {
      this.forgateForm.patchValue({ captcha: '' });
    } else if (this.formType === 'signup') {
      this.signupForm.patchValue({ captcha: '' });
    } else if (this.formType === 'createPassword') {
      this.createPassForm.patchValue({ captcha: '' });
    }
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