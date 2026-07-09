import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MessageService } from 'primeng/api';
import { UserService } from '../../../shared/services/user-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-office-location-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    BreadcrumbModule

  ],
  providers: [MessageService],
  templateUrl: './office-location-settings.html',
  styleUrl: './office-location-settings.scss'
})
export class OfficeLocationSettings implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  breadcrumbItems: any[] = [
    { label: 'HR Administration', icon: 'pi pi-home', routerLink: '/hradmin' },
    { label: 'Office Location Settings', icon: 'pi pi-map-marker' },
  ];

  companyName: string = '';
  locationForm: FormGroup;
  loading = signal(false);

  constructor(
    private readonly fb: FormBuilder,
    private readonly userService: UserService,
    private readonly messageService: MessageService
  ) {
    this.locationForm = this.fb.group({
      address: ['', [Validators.required]],
      officeLatitude: ['', [Validators.required]],
      officeLongitude: ['', [Validators.required]],
      allowedRadius: [50, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadLocationSettings();
  }

  get f() {
    return this.locationForm.controls;
  }

  loadLocationSettings(): void {
    this.loading.set(true);
    this.userService.getOfficeLocation()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.loading.set(false);
          if (response?.data) {
            this.companyName = response.data.company_name || '';
            this.locationForm.patchValue({
              address: response.data.address || '',
              officeLatitude: response.data.office_latitude || '',
              officeLongitude: response.data.office_longitude || '',
              allowedRadius: response.data.allowed_radius || 50
            });
          }
        },
        error: (err: any) => {
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Failed to load office location settings.'
          });
        }
      });
  }

  saveLocation(): void {
    if (this.locationForm.invalid) {
      this.locationForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill all required fields correctly.'
      });
      return;
    }

    this.loading.set(true);
    const payload = this.locationForm.value;

    this.userService.updateOfficeLocation(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.loading.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Office location updated successfully.'
          });
          this.loadLocationSettings();
        },
        error: (err: any) => {
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Failed to update office location.'
          });
        }
      });
  }
}
