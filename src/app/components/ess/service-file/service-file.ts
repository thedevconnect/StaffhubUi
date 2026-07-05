import { ChangeDetectionStrategy, Component, ChangeDetectorRef } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { Breadcrumb } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { SelectModule } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-service-file',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    Breadcrumb,
    ButtonModule,
    DrawerModule,
    SelectModule,
    Toast,
    ReactiveFormsModule,
    FormsModule,
    FloatLabelModule,
    InputTextModule
  ],
  providers: [MessageService],
  templateUrl: './service-file.html',
  styleUrl: './service-file.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceFile {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Service File', icon: 'pi pi-file', routerLink: '/ess/service-file' }
  ];

  documents = [
    { title: 'Offer Letter', type: 'PDF', size: '1.2 MB', uploadDate: '2026-01-10', category: 'Onboarding' },
    { title: 'Appraisal Letter 2026', type: 'PDF', size: '840 KB', uploadDate: '2026-04-01', category: 'Appraisal' },
    { title: 'Form 16 (FY 2025-26)', type: 'PDF', size: '2.1 MB', uploadDate: '2026-06-15', category: 'Taxation' }
  ];

  visible = false;
  uploadForm: FormGroup;
  selectedFileName = '';
  isUploading = false;

  categories = [
    { label: 'Onboarding', value: 'Onboarding' },
    { label: 'Appraisal', value: 'Appraisal' },
    { label: 'Taxation', value: 'Taxation' },
    { label: 'Certifications', value: 'Certifications' },
    { label: 'Other', value: 'Other' }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly messageService: MessageService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.uploadForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      category: ['', [Validators.required]],
      customCategory: [''],
      file: [null as File | null, [Validators.required]]
    });

    this.uploadForm.get('category')?.valueChanges.subscribe(val => {
      const customControl = this.uploadForm.get('customCategory');
      if (val === 'Other') {
        customControl?.setValidators([Validators.required, Validators.minLength(2)]);
      } else {
        customControl?.clearValidators();
      }
      customControl?.updateValueAndValidity();
      this.cdr.markForCheck();
    });
  }

  openUploadDrawer(): void {
    this.visible = true;
    this.uploadForm.reset();
    this.selectedFileName = '';
    this.cdr.markForCheck();
  }

  onFileChange(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      const maxSizeBytes = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSizeBytes) {
        this.messageService.add({
          severity: 'error',
          summary: 'File Too Large',
          detail: 'Only files smaller than 2MB are allowed.',
          life: 4000
        });
        this.selectedFileName = '';
        this.uploadForm.patchValue({ file: null });
        this.uploadForm.get('file')?.setErrors({ maxSizeBytes: true });
        this.uploadForm.get('file')?.markAsTouched();
        event.target.value = '';
        this.cdr.markForCheck();
        return;
      }

      this.selectedFileName = file.name;
      this.uploadForm.patchValue({ file });
      this.uploadForm.get('file')?.setErrors(null);
      this.uploadForm.get('file')?.updateValueAndValidity();
      this.cdr.markForCheck();
    }
  }

  isInvalid(controlName: string): boolean {
    const control = this.uploadForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.uploadForm.invalid) {
      this.uploadForm.markAllAsTouched();
      return;
    }

    this.isUploading = true;

    // Simulate upload delay
    setTimeout(() => {
      const formVal = this.uploadForm.value;
      const file = formVal.file as File;

      const fileType = file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';
      const fileSize = this.formatBytes(file.size);

      const finalCategory = formVal.category === 'Other' ? formVal.customCategory : formVal.category;

      const newDoc = {
        title: formVal.title,
        category: finalCategory,
        type: fileType,
        size: fileSize,
        uploadDate: new Date().toISOString().split('T')[0]
      };

      this.documents = [newDoc, ...this.documents];
      this.isUploading = false;
      this.visible = false;
      this.uploadForm.reset();
      this.selectedFileName = '';

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Document uploaded successfully.',
        life: 3000
      });

      this.cdr.markForCheck();
    }, 1000);
  }

  formatBytes(bytes: number, decimals = 1): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
