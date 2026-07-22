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
import { SelectModule } from 'primeng/select';

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
    InputIconModule,
    SelectModule
  ],
  templateUrl: './register-company.component.html',
  styleUrls: ['./register-company.component.scss'],
  providers: [MessageService]
})
export class RegisterCompanyComponent implements OnInit {

  signupForm!: FormGroup;
  isProcess = false;

  industryOptions = [
    { label: 'IT & Software', value: 'IT & Software' },
    { label: 'Healthcare', value: 'Healthcare' },
    { label: 'Finance & Banking', value: 'Finance & Banking' },
    { label: 'Manufacturing', value: 'Manufacturing' },
    { label: 'Education', value: 'Education' },
    { label: 'Retail & E-Commerce', value: 'Retail & E-Commerce' },
    { label: 'Other', value: 'Other' }
  ];
  showOtherIndustryInput = false;

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
      companyPhone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      address: ['', Validators.required],
      industry: ['', Validators.required],
      otherIndustry: [''],
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
    if (payload.industry === 'Other') {
      payload.industry = payload.otherIndustry || 'Other';
    }
    delete payload.otherIndustry;

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

  onIndustryChange(event: any) {
    this.showOtherIndustryInput = (event.value === 'Other');
    const otherIndustryControl = this.signupForm.get('otherIndustry');
    if (this.showOtherIndustryInput) {
      otherIndustryControl?.setValidators([Validators.required]);
    } else {
      otherIndustryControl?.clearValidators();
    }
    otherIndustryControl?.updateValueAndValidity();
  }

  onEmailInput(event: Event, controlName: string): void {
    const inputElement = event.target as HTMLInputElement;
    let value = inputElement.value;

    if (value.endsWith('@')) {
      value = value + 'gmail.com';
      const emailControl = this.signupForm.get(controlName);
      if (emailControl) {
        emailControl.setValue(value);
      }
    }
  }

  onlyNumbers(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^0-9]/g, '');
    if (value.length > 10) {
      value = value.substring(0, 10);
    }
    input.value = value;
    this.signupForm.get(controlName)?.setValue(value, { emitEvent: false });
  }

  isLocating = false;

  getCurrentLocation() {
    if (navigator.geolocation) {
      this.isLocating = true;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
            .then(response => response.json())
            .then(data => {
              this.isLocating = false;
              if (data && data.display_name) {
                this.signupForm.patchValue({ address: data.display_name });
              } else {
                this.messageService.add({ severity: 'warn', summary: 'Location Warning', detail: 'Could not resolve address.' });
              }
            })
            .catch(err => {
              this.isLocating = false;
              this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch address.' });
            });
        },
        (error) => {
          this.isLocating = false;
          this.messageService.add({ severity: 'error', summary: 'Location Error', detail: 'Permission denied or unable to retrieve location.' });
        }
      );
    } else {
      this.messageService.add({ severity: 'error', summary: 'Not Supported', detail: 'Geolocation is not supported by this browser.' });
    }
  }

  redirectToLogin() {
    this.router.navigate(['/login']);
  }
}