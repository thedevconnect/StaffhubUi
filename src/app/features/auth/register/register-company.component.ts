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
  selector: 'app-register-company',
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
  templateUrl: './register-company.component.html',
  styleUrls: ['./register-company.component.scss'],
  providers: [MessageService]
})
export class RegisterCompanyComponent implements OnInit {

  signupForm!: FormGroup;
  isProcess = false;

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
      empId: [''],
      fullName: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      password: ['', Validators.required]
    });
  }

  get f2() { return this.signupForm.controls; }

  showConfirm = false;

  onRegisterClick() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }
    this.showConfirm = true;
  }

  confirmRegistration(confirm: boolean) {
    this.showConfirm = false;
    if (confirm) {
      this.submitSignUpForm();
    }
  }

  submitSignUpForm() {
    this.isProcess = true;

    const payload = { ...this.signupForm.value };

    this.userService.registerCompany(payload).subscribe({
      next: (res: any) => {
        this.isProcess = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Registration Submitted',
          detail: 'Company registration request submitted successfully. Awaiting Super Admin approval.'
        });
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err: any) => {
        this.isProcess = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Registration failed'
        });
      }
    });
  }

  redirectToLogin() {
    this.router.navigate(['/login']);
  }
}