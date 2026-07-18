import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { AppBreadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DrawerModule } from 'primeng/drawer';
import { MessageService } from 'primeng/api';
import { ExitInterviewService, ExitInterviewData } from '../../../shared/services/exit-interview.service';

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function minWordsValidator(minWords: number = 25): ValidatorFn {
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
    DrawerModule
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

  constructor(
    private fb: FormBuilder, 
    private messageService: MessageService,
    private exitInterviewService: ExitInterviewService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.exitInterviewForm = this.fb.group({
      expectations: ['', [Validators.required, minWordsValidator(25)]],
      fulfilled: ['', [Validators.required, minWordsValidator(25)]],
      attractNewJob: ['', [Validators.required, minWordsValidator(25)]],
      comeBackLater: ['', [Validators.required, minWordsValidator(25)]],
      whatLiked: ['', [Validators.required, minWordsValidator(25)]],
      whatDisliked: ['', [Validators.required, minWordsValidator(25)]],
      suggestions: ['', [Validators.required, minWordsValidator(25)]]
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
    this.exitInterviewForm.reset();
    this.displayFormDrawer = true;
    this.cdr.markForCheck();
  }

  viewDetails(interview: ExitInterviewData): void {
    this.selectedInterview = interview;
    this.displayViewDrawer = true;
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (this.exitInterviewForm.invalid) {
      this.exitInterviewForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please answer all required questions.'
      });
      return;
    }

    this.isSubmitting = true;
    this.exitInterviewService.submitExitInterview(this.exitInterviewForm.value).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.displayFormDrawer = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
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
