import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { UserProfileService, UserProfileData } from '../../../../shared/services/user-profile.service';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-manage-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ToastModule,
    AvatarModule,
    TagModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './manage-profile.html',
  styleUrls: ['./manage-profile.scss']
})
export class ManageProfileComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  loading = false;
  savingProfile = false;
  savingPassword = false;
  activeTabIndex = 0;

  profileData: UserProfileData | null = null;
  profilePreviewUrl: string | null = null;
  oldPicturesHistory: string[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userProfileService: UserProfileService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.loadProfile();

    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'password') {
        this.activeTabIndex = 1;
      }
    });
  }

  private initForms(): void {
    this.profileForm = this.fb.group({
      empId: [{ value: '', disabled: true }],
      username: [{ value: '', disabled: true }],
      fullName: [{ value: '', disabled: true }],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      role: [{ value: '', disabled: true }]
    });

    this.passwordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  loadProfile(): void {
    this.loading = true;
    this.userProfileService.getUserProfile().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.profileData = res.data;
          this.profilePreviewUrl = res.data.profilePicture || null;
          this.oldPicturesHistory = res.data.oldProfilePictures || [];

          this.profileForm.patchValue({
            empId: res.data.empId,
            username: res.data.username,
            fullName: res.data.fullName,
            email: res.data.email,
            mobile: res.data.mobile,
            role: res.data.role
          });
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error Loading Profile',
          detail: err?.error?.message || 'Failed to load user profile information.'
        });
        this.cdr.detectChanges();
      }
    });
  }

  setTab(index: number): void {
    this.activeTabIndex = index;
  }

  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];

      if (file.size > 2 * 1024 * 1024) {
        this.messageService.add({
          severity: 'warn',
          summary: 'File Too Large',
          detail: 'Profile picture must be smaller than 2MB.'
        });
        fileInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.profilePreviewUrl = reader.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
      fileInput.value = '';
    }
  }

  selectOldPicture(pictureUrl: string): void {
    this.profilePreviewUrl = pictureUrl;
    this.cdr.detectChanges();
    this.messageService.add({
      severity: 'info',
      summary: 'Image Selected',
      detail: 'Selected past profile picture. Click Update Profile to save.'
    });
  }

  submitProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.savingProfile = true;
    const { fullName, email, mobile } = this.profileForm.getRawValue();

    this.userProfileService.updateUserProfile({
      fullName,
      email,
      mobile,
      profilePicture: this.profilePreviewUrl
    }).subscribe({
      next: (res) => {
        this.savingProfile = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Profile Updated',
          detail: res?.message || 'Profile information updated successfully!'
        });
        if (res.data) {
          this.profileData = res.data;
          this.profilePreviewUrl = res.data.profilePicture || null;
          this.oldPicturesHistory = res.data.oldProfilePictures || [];
        }
      },
      error: (err) => {
        this.savingProfile = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: err?.error?.message || 'Failed to update profile details.'
        });
      }
    });
  }

  submitPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { oldPassword, newPassword, confirmPassword } = this.passwordForm.value;

    if (newPassword !== confirmPassword) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'New password and confirm password do not match.'
      });
      return;
    }

    this.savingPassword = true;

    this.userProfileService.changePassword({ oldPassword, newPassword }).subscribe({
      next: (res) => {
        this.savingPassword = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Password Updated',
          detail: res?.message || 'Password updated successfully!'
        });
        this.passwordForm.reset();
      },
      error: (err) => {
        this.savingPassword = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Password Change Failed',
          detail: err?.error?.message || 'Old password does not match or update failed.'
        });
      }
    });
  }

  getUserInitial(): string {
    return (this.profileForm.get('fullName')?.value || 'User').charAt(0).toUpperCase();
  }
}
