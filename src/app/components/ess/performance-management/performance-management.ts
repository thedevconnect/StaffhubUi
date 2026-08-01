import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { RatingModule } from 'primeng/rating';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { Breadcrumb } from 'primeng/breadcrumb';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, MenuItem } from 'primeng/api';

import { PerformanceService } from '../../../shared/services/performance.service';
import { AuthService } from '../../../shared/services/services/auth.service';
import { TableColumn, TableTemplate } from '../../../shared/ui/table-template/table-template';

@Component({
  selector: 'app-performance-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    RatingModule,
    TagModule,
    ButtonModule,
    DrawerModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    ToastModule,
    Breadcrumb,
    TooltipModule,
    TableTemplate
  ],
  templateUrl: './performance-management.html',
  styleUrl: './performance-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService],
})
export class PerformanceManagement implements OnInit {
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);
  private performanceService = inject(PerformanceService);
  private authService = inject(AuthService);

  breadcrumbItems: MenuItem[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Performance & Monthly Ratings', icon: 'pi pi-star' },
  ];

  columns: TableColumn[] = [
    { key: 'monthName', header: 'Month & Year' },
    { key: 'employeeName', header: 'Employee' },
    { key: 'selfRating', header: 'Employee Self Rating' },
    { key: 'managerRating', header: 'Manager Rating' },
    { key: 'hrRating', header: 'HR Rating' },
    { key: 'finalScore', header: 'Final Score' },
    { key: 'status', header: 'Review Status' },
    { key: 'actions', header: 'Action' }
  ];

  ratings: any[] = [];
  isLoading = signal(false);
  submitting = signal(false);

  selectedYear: number = new Date().getFullYear();
  yearOptions = [
    { label: 'Year 2026', value: 2026 },
    { label: 'Year 2025', value: 2025 },
    { label: 'Year 2024', value: 2024 }
  ];

  monthOptions = [
    { label: 'January', value: 1 },
    { label: 'February', value: 2 },
    { label: 'March', value: 3 },
    { label: 'April', value: 4 },
    { label: 'May', value: 5 },
    { label: 'June', value: 6 },
    { label: 'July', value: 7 },
    { label: 'August', value: 8 },
    { label: 'September', value: 9 },
    { label: 'October', value: 10 },
    { label: 'November', value: 11 },
    { label: 'December', value: 12 }
  ];

  summary = {
    totalMonthsSubmitted: 0,
    avgSelfRating: 0,
    avgManagerRating: 0,
    avgHrRating: 0,
    cumulativeAppraisalScore: 0,
    year: new Date().getFullYear()
  };

  // Modals & Drawers
  submitDrawerVisible = false;
  reviewDrawerVisible = false;
  viewDrawerVisible = false;

  selectedRecord: any = null;

  selfForm!: FormGroup;
  reviewForm!: FormGroup;

  isHrOrManager = false;

  ngOnInit(): void {
    this.checkUserRole();
    this.initForms();
    this.loadRatings();
  }

  checkUserRole(): void {
    const user = this.authService.user();
    const roleStr = JSON.stringify(user || '').toUpperCase();
    this.isHrOrManager = roleStr.includes('HR') || roleStr.includes('ADMIN') || roleStr.includes('MANAGER');
  }

  initForms(): void {
    const currentMonth = new Date().getMonth() + 1;

    this.selfForm = this.fb.group({
      year: [this.selectedYear, [Validators.required]],
      month: [currentMonth, [Validators.required]],
      achievements: ['', [Validators.required, Validators.minLength(10)]],
      selfRating: [4, [Validators.required, Validators.min(1), Validators.max(5)]],
      selfRemarks: ['']
    });

    this.reviewForm = this.fb.group({
      id: [null, [Validators.required]],
      managerRating: [null],
      managerRemarks: [''],
      hrRating: [null],
      hrRemarks: [''],
      status: ['']
    });
  }

  loadRatings(): void {
    this.isLoading.set(true);
    this.performanceService.getMonthlyRatings(undefined, this.selectedYear).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.ratings = res.data || [];
          if (res.summary) {
            this.summary = res.summary;
          }
        }
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching performance ratings:', err);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  openSubmitDrawer(record?: any): void {
    if (record) {
      this.selectedRecord = record;
      this.selfForm.patchValue({
        year: record.year,
        month: record.month,
        achievements: record.achievements,
        selfRating: Number(record.self_rating || record.selfRating || 4),
        selfRemarks: record.self_remarks || record.selfRemarks || ''
      });
    } else {
      this.selectedRecord = null;
      const currentMonth = new Date().getMonth() + 1;
      this.selfForm.reset({
        year: this.selectedYear,
        month: currentMonth,
        achievements: '',
        selfRating: 4,
        selfRemarks: ''
      });
    }
    this.submitDrawerVisible = true;
    this.cdr.markForCheck();
  }

  onSubmitSelfRating(): void {
    if (this.selfForm.invalid) {
      this.selfForm.markAllAsTouched();
      this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill all required details and self-rating.' });
      return;
    }

    const val = this.selfForm.value;
    const monthObj = this.monthOptions.find(m => m.value === Number(val.month));
    const payload = {
      year: Number(val.year),
      month: Number(val.month),
      monthName: monthObj ? monthObj.label : `Month ${val.month}`,
      achievements: val.achievements,
      selfRating: Number(val.selfRating),
      selfRemarks: val.selfRemarks
    };

    this.submitting.set(true);
    this.performanceService.submitSelfRating(payload).subscribe({
      next: (res: any) => {
        this.submitting.set(false);
        if (res && res.success) {
          this.messageService.add({ severity: 'success', summary: 'Submitted', detail: 'Monthly self-rating submitted successfully!' });
          this.submitDrawerVisible = false;
          this.loadRatings();
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: res?.message || 'Submission failed' });
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submitting.set(false);
        console.error('Submission error:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to submit rating' });
        this.cdr.markForCheck();
      }
    });
  }

  openReviewDrawer(record: any): void {
    this.selectedRecord = record;
    this.reviewForm.patchValue({
      id: record.id,
      managerRating: record.manager_rating ? Number(record.manager_rating) : 4,
      managerRemarks: record.manager_remarks || '',
      hrRating: record.hr_rating ? Number(record.hr_rating) : 4,
      hrRemarks: record.hr_remarks || '',
      status: record.status || 'APPROVED'
    });
    this.reviewDrawerVisible = true;
    this.cdr.markForCheck();
  }

  onSubmitReview(): void {
    if (!this.selectedRecord) return;

    const val = this.reviewForm.value;
    const payload = {
      managerRating: val.managerRating ? Number(val.managerRating) : undefined,
      managerRemarks: val.managerRemarks,
      hrRating: val.hrRating ? Number(val.hrRating) : undefined,
      hrRemarks: val.hrRemarks,
      status: val.status || 'APPROVED'
    };

    this.submitting.set(true);
    this.performanceService.reviewMonthlyRating(this.selectedRecord.id, payload).subscribe({
      next: (res: any) => {
        this.submitting.set(false);
        if (res && res.success) {
          this.messageService.add({ severity: 'success', summary: 'Review Saved', detail: 'Manager/HR appraisal review saved successfully!' });
          this.reviewDrawerVisible = false;
          this.loadRatings();
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: res?.message || 'Review update failed' });
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submitting.set(false);
        console.error('Review error:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to save review' });
        this.cdr.markForCheck();
      }
    });
  }

  openViewDrawer(record: any): void {
    this.selectedRecord = record;
    this.viewDrawerVisible = true;
    this.cdr.markForCheck();
  }

  deleteRecord(id: number): void {
    this.performanceService.deleteRating(id).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.messageService.add({ severity: 'info', summary: 'Deleted', detail: 'Rating entry deleted.' });
          this.loadRatings();
        }
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to delete rating' });
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'APPROVED') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s === 'MANAGER_REVIEWED') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
}
