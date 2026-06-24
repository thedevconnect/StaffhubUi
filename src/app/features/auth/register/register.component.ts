import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../../shared/services/user-service';
import { AuthService } from '../../../shared/services/services/auth.service';
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
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
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
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  providers: [MessageService]
})
export class RegisterComponent implements OnInit {

  signupForm!: FormGroup;
  isProcess = false;
  captchaCode = '';
  showOTP = false;
  emailVerified = false;
  mobileVerified = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      companyName: ['', Validators.required],
      shortName: ['', Validators.required],
      companyEmail: ['', [Validators.required, Validators.email]],
      companyPhone: ['', Validators.required],
      address: ['', Validators.required],
      industry: ['', Validators.required],
      adminName: ['', Validators.required],
      adminEmail: ['', [Validators.required, Validators.email]],
      mobileNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      password: ['', Validators.required],
      captcha: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue]
    });

    this.generateCaptcha();
  }

  get f2() { return this.signupForm.controls; }
  get isProccess() { return this.isProcess; }

  gotoTermsCondition() { }

  GenerateCaptcha(type: number) {
    this.generateCaptcha();
  }

  submitSignUpForm() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    if (this.signupForm.value.captcha !== this.captchaCode) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Captcha is not valid' });
      this.refreshCaptcha();
      return;
    }

    this.isProcess = true;

    const payload = { ...this.signupForm.value };

    delete payload.acceptTerms;
    delete payload.captcha;

    this.userService.signup(payload).subscribe({
      next: (res: any) => {
        // Automatically log in using the newly created credentials
        this.authService.login({ username: payload.adminEmail, password: payload.password }).subscribe({
          next: (loginApiRes: any) => {
            this.isProcess = false;
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Registration successful. Welcome!' });
            this.router.navigate([this.authService.getDashboardRoute()]);
          },
          error: (loginErr: any) => {
            this.isProcess = false;
            // If auto-login fails, redirect to login page with success message
            this.messageService.add({ severity: 'success', summary: 'Registration Success', detail: `Registration successful. Please log in with your credentials.` });
            this.router.navigate(['/login']);
          }
        });
      },
      error: (err: any) => {
        this.isProcess = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Registration failed' });
        this.refreshCaptcha();
      }
    });
  }

  generateCaptcha() {
    const chars = '1234567890';
    this.captchaCode = '';

    for (let i = 0; i < 6; i++) {
      this.captchaCode += chars[Math.floor(Math.random() * chars.length)];
    }

    this.drawCaptcha('signupTextCanvas', this.captchaCode);
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
    this.signupForm.patchValue({ captcha: '' });
    this.generateCaptcha();
  }

  redirectToLogin() {
    this.router.navigate(['/login']);
  }
}
