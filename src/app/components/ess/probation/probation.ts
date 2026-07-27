import { Component, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { ProbationService, ProbationRecord, ProbationStats } from '../../../shared/services/probation.service';
import { EmployeeManagementService } from '../../../shared/services/employee-management.service';
import { MessageService } from 'primeng/api';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DrawerModule } from 'primeng/drawer';
import { ToastModule } from 'primeng/toast';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { Breadcrumb } from 'primeng/breadcrumb';

import { TableColumn, TableTemplate } from '../../../shared/ui/table-template/table-template';

import { AuthService } from '../../../shared/services/services/auth.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-probation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    Breadcrumb,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DrawerModule,
    ToastModule,
    TextareaModule,
    TagModule,
    TableTemplate
  ],
  providers: [MessageService],
  templateUrl: './probation.html',
  styleUrl: './probation.scss',
})
export class Probation implements OnInit {
  authService = inject(AuthService);

  get isHrAdmin(): boolean {
    const user = this.authService.user();
    if (!user) return false;
    const roleStr = user.role || '';
    const roles = roleStr.split(',').map((r: string) => r.trim().toUpperCase());
    const roleObjs = (user.roles || []).map(r => (r.roleId || r.rolDes || '').toUpperCase());
    const privileged = ['HR_ADMIN', 'ADMIN', 'SUPER_ADMIN', 'SUPERADMIN', 'DEVELOPER', 'HRADMIN'];
    return roles.some((r: string) => privileged.includes(r)) || roleObjs.some((r: string) => privileged.includes(r));
  }

  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Probation & Confirmation', icon: 'pi pi-user-minus', routerLink: '/ess/probation' }
  ];

  statusTabs = [
    { label: 'All Records', value: 'ALL', icon: 'pi pi-list' },
    { label: 'Under Probation', value: 'UNDER_PROBATION', icon: 'pi pi-clock' },
    { label: 'Confirmed', value: 'CONFIRMED', icon: 'pi pi-check-circle' },
    { label: 'Extended', value: 'EXTENDED', icon: 'pi pi-exclamation-triangle' }
  ];

  columns: TableColumn[] = [
    { key: 'employee_name', header: 'Employee Details', isSortable: true },
    { key: 'department', header: 'Dept & Designation', isSortable: true },
    { key: 'joining_date', header: 'Joining Date', isSortable: true },
    { key: 'probation_end_date', header: 'Probation End Date', isSortable: true },
    { key: 'review_rating', header: 'Rating', isSortable: true },
    { key: 'confirmation_status', header: 'Status', isSortable: true },
    { key: 'remarks', header: 'Evaluation Remarks / Reason' },
    { key: 'actions', header: 'Actions' }
  ];

  probationRecords: ProbationRecord[] = [];
  filteredRecords: ProbationRecord[] = [];
  stats: ProbationStats = {
    total: 0,
    underProbation: 0,
    confirmed: 0,
    extended: 0
  };

  loading = false;
  activeTab = 'ALL';

  // Drawer & Form State
  showReviewDrawer = false;
  selectedRecord: ProbationRecord | null = null;
  reviewForm!: FormGroup;
  submitting = false;

  // Drawer Fullscreen mode
  isFormFullscreen = signal(false);

  ratingOptions = [
    { label: 'Exceeds Expectations', value: 'Exceeds Expectations' },
    { label: 'Meets Expectations', value: 'Meets Expectations' },
    { label: 'Needs Improvement', value: 'Needs Improvement' },
    { label: 'Unsatisfactory', value: 'Unsatisfactory' }
  ];

  statusOptions = [
    { label: 'Under Probation', value: 'UNDER_PROBATION' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Extended Probation', value: 'EXTENDED' },
    { label: 'Terminated', value: 'TERMINATED' }
  ];

  constructor(
    private fb: FormBuilder,
    private probationService: ProbationService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.isHrAdmin) {
      this.columns = this.columns.filter(c => c.key !== 'actions');
      this.statusTabs[0].label = 'My Probation Record';
    }
    this.initForm();
    this.loadProbations();
  }

  initForm(): void {
    this.reviewForm = this.fb.group({
      confirmationStatus: ['CONFIRMED', Validators.required],
      extensionMonths: [0],
      reviewRating: ['Meets Expectations', Validators.required],
      remarks: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  toggleFormFullscreen(): void {
    this.isFormFullscreen.update(v => !v);
    this.cdr.markForCheck();
  }

  loadProbations(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.probationService.getProbations().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.probationRecords = res.data || [];
          this.stats = res.stats || { total: 0, underProbation: 0, confirmed: 0, extended: 0 };
          this.filterRecords();
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Failed to load probation records'
        });
        this.cdr.markForCheck();
      }
    });
  }

  onTabChange(tabValue: string): void {
    this.activeTab = tabValue;
    this.filterRecords();
  }

  filterRecords(): void {
    if (this.activeTab === 'ALL') {
      this.filteredRecords = [...this.probationRecords];
    } else {
      this.filteredRecords = this.probationRecords.filter(r => r.confirmation_status === this.activeTab);
    }
    this.cdr.markForCheck();
  }

  openReviewDrawer(record: ProbationRecord): void {
    this.selectedRecord = record;
    this.reviewForm.patchValue({
      confirmationStatus: record.confirmation_status === 'UNDER_PROBATION' ? 'CONFIRMED' : record.confirmation_status,
      extensionMonths: record.extension_months || 0,
      reviewRating: record.review_rating || 'Meets Expectations',
      remarks: record.remarks || ''
    });
    this.showReviewDrawer = true;
    this.cdr.markForCheck();
  }

  submitReview(): void {
    if (this.reviewForm.invalid || !this.selectedRecord) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Form',
        detail: 'Please fill all required fields and review remarks.'
      });
      return;
    }

    this.submitting = true;
    const val = this.reviewForm.value;

    const payload = {
      confirmationStatus: val.confirmationStatus,
      extensionMonths: val.extensionMonths,
      reviewRating: val.reviewRating,
      remarks: val.remarks,
      employeeId: this.selectedRecord.employee_id,
      employeeName: this.selectedRecord.employee_name,
      designation: this.selectedRecord.designation,
      department: this.selectedRecord.department,
      joiningDate: this.selectedRecord.joining_date
    };

    this.probationService.updateStatus(this.selectedRecord.id, payload).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Review Submitted',
            detail: `Probation evaluation status updated to ${val.confirmationStatus} successfully.`
          });
          this.showReviewDrawer = false;
          this.loadProbations();
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submitting = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Failed',
          detail: err?.error?.message || 'Failed to update probation status'
        });
        this.cdr.markForCheck();
      }
    });
  }
}
