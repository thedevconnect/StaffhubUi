import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { AppBreadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DrawerModule } from 'primeng/drawer';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ExitInterviewService, ExitInterviewData } from '../../../shared/services/exit-interview.service';

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function minWordsValidator(minWords: number = 5): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value || typeof control.value !== 'string') {
      return { minWords: { requiredWords: minWords, actualWords: 0 } };
    }
    const trimmed = control.value.trim();
    if (!trimmed) {
      return { minWords: { requiredWords: minWords, actualWords: 0 } };
    }
    const words = trimmed.split(/\s+/).filter(w => w.length > 0);
    if (words.length < minWords) {
      return { minWords: { requiredWords: minWords, actualWords: words.length } };
    }
    return null;
  };
}

@Component({
  selector: 'app-exit-interview',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    AppBreadcrumb,
    ReactiveFormsModule,
    ToastModule,
    ButtonModule,
    TableModule,
    DrawerModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './exit-interview.html',
  styleUrl: './exit-interview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExitInterview implements OnInit {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Exit', icon: 'pi pi-sign-out' },
    { label: 'Exit Interview Form', icon: 'pi pi-file-edit', routerLink: '/ess/exit-interview' }
  ];

  exitInterviewForm!: FormGroup;
  isSubmitting = false;
  isLoading = false;
  myExitInterviews: ExitInterviewData[] = [];

  displayFormDrawer = false;
  displayViewDrawer = false;
  selectedInterview: ExitInterviewData | null = null;
  editingInterview: ExitInterviewData | null = null;

  isFormDrawerFullScreen = false;
  isViewDrawerFullScreen = false;

  toggleFormDrawerFullScreen(): void {
    this.isFormDrawerFullScreen = !this.isFormDrawerFullScreen;
  }

  toggleViewDrawerFullScreen(): void {
    this.isViewDrawerFullScreen = !this.isViewDrawerFullScreen;
  }

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private exitInterviewService: ExitInterviewService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.exitInterviewForm = this.fb.group({
      expectations: ['', [Validators.required, minWordsValidator(5)]],
      fulfilled: ['', [Validators.required, minWordsValidator(5)]],
      attractNewJob: ['', [Validators.required, minWordsValidator(5)]],
      comeBackLater: ['', [Validators.required, minWordsValidator(5)]],
      whatLiked: ['', [Validators.required, minWordsValidator(5)]],
      whatDisliked: ['', [Validators.required, minWordsValidator(5)]],
      suggestions: ['', [Validators.required, minWordsValidator(5)]]
    });

    this.loadMySubmissions();
  }

  getWordCount(fieldName: string): number {
    const val = this.exitInterviewForm.get(fieldName)?.value;
    if (!val || typeof val !== 'string') return 0;
    const trimmed = val.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(w => w.length > 0).length;
  }

  loadMySubmissions(): void {
    this.isLoading = true;
    this.exitInterviewService.getMyExitInterviews().subscribe({
      next: (res) => {
        if (res && res.success) {
          this.myExitInterviews = res.data;
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  openFormDrawer(): void {
    this.editingInterview = null;
    this.exitInterviewForm.reset();
    this.displayFormDrawer = true;
    this.cdr.markForCheck();
  }

  openEditFormDrawer(interview: ExitInterviewData): void {
    const statusUpper = (interview.status || 'PENDING').toUpperCase();
    if (statusUpper === 'APPROVED') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Action Restricted',
        detail: 'Approved exit interview feedback cannot be edited.'
      });
      return;
    }

    this.editingInterview = interview;
    this.exitInterviewForm.patchValue({
      expectations: interview.expectations || '',
      fulfilled: interview.fulfilled || '',
      attractNewJob: interview.attractNewJob || interview.attract_new_job || '',
      comeBackLater: interview.comeBackLater || interview.come_back_later || '',
      whatLiked: interview.whatLiked || interview.what_liked || '',
      whatDisliked: interview.whatDisliked || interview.what_disliked || '',
      suggestions: interview.suggestions || ''
    });
    this.displayFormDrawer = true;
    this.cdr.markForCheck();
  }

  viewDetails(interview: ExitInterviewData): void {
    this.selectedInterview = interview;
    this.displayViewDrawer = true;
    this.cdr.markForCheck();
  }

  deleteInterview(interview: ExitInterviewData): void {
    const statusUpper = (interview.status || 'PENDING').toUpperCase();
    if (statusUpper === 'APPROVED') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Action Restricted',
        detail: 'Approved exit interview feedback cannot be deleted.'
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this exit interview submission?')) {
      return;
    }

    this.exitInterviewService.deleteExitInterview(interview.id!).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Exit interview submission deleted successfully.'
        });
        this.loadMySubmissions();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Failed to delete exit interview submission.'
        });
        this.cdr.markForCheck();
      }
    });
  }

  canEditOrDelete(interview: ExitInterviewData): boolean {
    return (interview.status || 'PENDING').toUpperCase() !== 'APPROVED';
  }

  onSubmit(): void {
    if (this.exitInterviewForm.invalid) {
      this.exitInterviewForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please answer all required questions correctly.'
      });
      return;
    }

    this.isSubmitting = true;

    if (this.editingInterview && this.editingInterview.id) {
      // Update existing
      this.exitInterviewService.updateExitInterview(this.editingInterview.id, this.exitInterviewForm.value).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.displayFormDrawer = false;
          this.editingInterview = null;
          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: 'Exit interview feedback updated successfully.'
          });
          this.loadMySubmissions();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'Failed to update exit interview feedback.'
          });
          this.cdr.markForCheck();
        }
      });
    } else {
      // Create new
      this.exitInterviewService.submitExitInterview(this.exitInterviewForm.value).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.displayFormDrawer = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Submitted',
            detail: 'Your exit interview feedback has been submitted successfully.'
          });
          this.loadMySubmissions();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'Failed to submit exit interview feedback.'
          });
          this.cdr.markForCheck();
        }
      });
    }
  }
}
