import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../../core/auth/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ButtonModule, CardModule, InputTextModule, PasswordModule, ReactiveFormsModule, ToastModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  providers: [MessageService],
})
export class LoginPage {
  readonly loading = signal(false);
  readonly form;

  constructor(
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly messageService: MessageService,
  ) {
    this.form = this.fb.nonNullable.group({
      username: ['hradmin', [Validators.required]],
      password: ['HRAdmin@123', [Validators.required]],
    });
  }

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.authService
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: response.message,
          });
          this.router.navigate([this.authService.getDashboardRoute()]);
        },
        error: (error: unknown) => {
          const detail = error instanceof Error ? error.message : 'Invalid username/password';
          this.messageService.add({
            severity: 'error',
            summary: 'Login Failed',
            detail,
          });
        },
      });
  }
}
