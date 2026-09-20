import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MessageService, ConfirmationService } from 'primeng/api';

// Shared Table Template (Same as Employee Management)
import { TableTemplate, TableColumn, TableAction } from '../../../shared/ui/table-template/table-template';
import { PreOnboardingService, PreOnboardingCandidate } from '../../../shared/services/pre-onboarding.service';
import { AuthService } from '../../../shared/services/services/auth.service';

export interface MandatoryDocDef {
  key: string;
  label: string;
  required: boolean;
  icon: string;
}

export const MANDATORY_DOCS: MandatoryDocDef[] = [
  { key: 'aadhaar', label: 'Aadhaar Card (Front & Back)', required: true, icon: 'pi pi-id-card' },
  { key: 'pan', label: 'PAN Card', required: true, icon: 'pi pi-credit-card' },
  { key: 'photo', label: 'Passport Size Photograph', required: true, icon: 'pi pi-image' },
  { key: 'degree', label: 'Highest Graduation / Degree Certificate', required: true, icon: 'pi pi-graduation-cap' },
  { key: 'salary_slips', label: 'Last 3 Months Salary Slips', required: true, icon: 'pi pi-file-excel' },
  { key: 'relieving_letter', label: 'Previous Relieving / Experience Letter', required: true, icon: 'pi pi-file-pdf' },
  { key: 'cheque', label: 'Cancelled Cheque / Bank Passbook', required: true, icon: 'pi pi-book' },
  { key: 'bank_statement', label: 'Bank Statement (Last 6 Months)', required: true, icon: 'pi pi-wallet' }
];

@Component({
  selector: 'app-pre-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    DrawerModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    SelectModule,
    TextareaModule,
    DatePickerModule,
    TagModule,
    BreadcrumbModule,
    TableTemplate
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './pre-onboarding.html',
  styleUrl: './pre-onboarding.scss'
})
export class PreOnboardingComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly preOnboardingService = inject(PreOnboardingService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly sanitizer = inject(DomSanitizer);

  breadcrumbItems = [
    { label: 'HR Administration', icon: 'pi pi-home', routerLink: '/hradmin' },
    { label: 'Pre-Onboarding', icon: 'pi pi-user-plus', routerLink: '/hradmin/pre-onboarding' }
  ];

  readonly mandatoryDocs = MANDATORY_DOCS;

  // Table Configuration (Same as Employee Management)
  columns: TableColumn[] = [
    { key: 'actions', header: 'Actions', isVisible: true },
    { key: 'candidate_code', header: 'Candidate Code', isVisible: true, isSortable: true },
    { key: 'candidate', header: 'Candidate Info', isVisible: true, isSortable: true },
    { key: 'designation', header: 'Designation', isVisible: true, isSortable: true },
    { key: 'department', header: 'Department', isVisible: true, isSortable: true },
    { key: 'offered_ctc', header: 'Offered CTC (₹)', isVisible: true, isSortable: true, pipe: 'currency', pipeArgs: 'INR' },
    { key: 'joining_date', header: 'Expected Joining', isVisible: true, isSortable: true, format: 'date' },
    { key: 'linkStatus', header: 'Link & Invite', isVisible: true },
    { key: 'docsStatus', header: 'Documents Status', isVisible: true },
    { key: 'offerStatus', header: 'Offer Status', isVisible: true },
    { key: 'empStatus', header: 'Employee Status', isVisible: true },
    { key: 'created_at', header: 'Created At', isVisible: true, isSortable: true, format: 'date' }
  ];

  rowActions: TableAction[] = [
    { label: 'View Profile & Docs', icon: 'pi pi-eye', id: 'view' },
    { label: 'Edit Details', icon: 'pi pi-pencil', id: 'edit' },
    { label: 'Verify 8 Documents', icon: 'pi pi-check-square', id: 'verify' },
    { label: 'Issue Offer Letter', icon: 'pi pi-file-arrow-up', id: 'offer' },
    { label: 'Copy Portal Link', icon: 'pi pi-copy', id: 'copy_link' },
    { label: 'Send Email Link', icon: 'pi pi-send', id: 'send_email' },
    { label: 'Convert to Employee', icon: 'pi pi-user-plus', id: 'convert' },
    { label: 'Delete Candidate', icon: 'pi pi-trash', id: 'delete' }
  ];

  // Action disable rules for 3-dot dropdown
  disableActionCondition = (actionId: string, row: PreOnboardingCandidate): boolean => {
    if (actionId === 'edit' || actionId === 'delete') {
      return !!row.onboarding_completed;
    }
    if (actionId === 'verify') {
      return row.documents_status === 'PENDING_UPLOAD';
    }
    if (actionId === 'offer') {
      return row.documents_status !== 'VERIFIED' && row.offer_status !== 'OFFER_SENT';
    }
    if (actionId === 'convert') {
      return row.offer_status !== 'ACCEPTED' || row.documents_status !== 'VERIFIED' || !!row.onboarding_completed;
    }
    return false;
  };

  // Reactive State Signals
  candidates = signal<PreOnboardingCandidate[]>([]);
  loading = signal<boolean>(false);
  totalRecords = signal<number>(0);
  searchQuery = signal<string>('');
  selectedDocsStatus = signal<string>('');
  selectedOfferStatus = signal<string>('');
  selectedCandidate = signal<PreOnboardingCandidate | null>(null);

  // Strictly Scoped Company Signals
  userCompanyId = signal<number>(0);
  userCompanyName = signal<string>('');
  nextCodePreview = signal<string>('');
  nextCodePrefix = signal<string>('');

  // Metrics Signals
  metricTotal = signal<number>(0);
  metricPendingDocs = signal<number>(0);
  metricUnderReview = signal<number>(0);
  metricVerified = signal<number>(0);
  metricOfferSent = signal<number>(0);
  metricCompleted = signal<number>(0);

  // Drawer Management (Matching Employee Management)
  showDrawer = false;
  isViewMode = false;
  isEditMode = false;
  isDrawerFullScreen = false;
  editingCandidateId: number | null = null;

  // Additional Modals
  verifyModalVisible = false;
  offerModalVisible = false;
  sendLinkModalVisible = false;
  // Document Preview State
  docPreviewVisible = false;
  previewUrl: SafeResourceUrl | null = null;
  previewRawUrl = '';
  previewTitle = '';
  isPdfPreview = false;
  previewFileList: any[] = [];
  previewCurrentIndex = 0;
  previewCategoryLabel = '';
  isDownloadingAll = false;
  offerLetterPreviewVisible = false;
  selectedOfferCandidate: any = null;
  isDownloadingOfferPdf = false;
  currentYear = new Date().getFullYear();

  // Forms
  candidateForm!: FormGroup;
  verifyForm!: FormGroup;
  offerForm!: FormGroup;
  sendLinkForm!: FormGroup;

  // Options
  readonly docsStatusOptions = [
    { label: 'All Document Statuses', value: '' },
    { label: 'Pending Upload', value: 'PENDING_UPLOAD' },
    { label: 'Submitted (Review Needed)', value: 'SUBMITTED' },
    { label: 'Verified & Approved', value: 'VERIFIED' },
    { label: 'Rejected (Requires Re-upload)', value: 'REJECTED' }
  ];

  readonly offerStatusOptions = [
    { label: 'All Offer Statuses', value: '' },
    { label: 'Not Issued', value: 'NOT_ISSUED' },
    { label: 'Offer Sent', value: 'OFFER_SENT' },
    { label: 'Accepted with Signature', value: 'ACCEPTED' },
    { label: 'Declined', value: 'DECLINED' }
  ];

  readonly interviewStatusOptions = [
    { label: 'Interview Cleared (Selected)', value: 'INTERVIEW_CLEARED' },
    { label: 'Final Round Pending', value: 'FINAL_ROUND_PENDING' },
    { label: 'Management Approval Done', value: 'MANAGEMENT_APPROVED' }
  ];

  readonly verifyStatusOptions = [
    { label: 'Approve & Mark All Verified', value: 'VERIFIED' },
    { label: 'Reject / Request Re-upload', value: 'REJECTED' }
  ];

  designationOptions = [
    { label: 'Software Engineer', value: 'Software Engineer' },
    { label: 'Junior Software Engineer', value: 'Junior Software Engineer' },
    { label: 'Senior Software Engineer', value: 'Senior Software Engineer' },
    { label: 'Lead Full Stack Engineer', value: 'Lead Full Stack Engineer' },
    { label: 'QA Engineer', value: 'QA Engineer' },
    { label: 'Product Manager', value: 'Product Manager' },
    { label: 'UI/UX Designer', value: 'UI/UX Designer' },
    { label: 'DevOps & Cloud Engineer', value: 'DevOps & Cloud Engineer' },
    { label: 'HR Executive', value: 'HR Executive' },
    { label: 'Operations Lead', value: 'Operations Lead' },
    { label: 'Business Analyst', value: 'Business Analyst' },
    { label: 'Other', value: 'Other' }
  ];

  departmentOptions = [
    { label: 'IT-Development', value: 'IT-Development' },
    { label: 'Engineering', value: 'Engineering' },
    { label: 'HR', value: 'HR' },
    { label: 'Product Management', value: 'Product Management' },
    { label: 'Design / UI-UX', value: 'Design / UI-UX' },
    { label: 'Sales & Marketing', value: 'Sales & Marketing' },
    { label: 'Finance & Accounts', value: 'Finance & Accounts' },
    { label: 'Operations', value: 'Operations' },
    { label: 'Quality Assurance', value: 'Quality Assurance' },
    { label: 'Other', value: 'Other' }

  ];

  private getCompanyIdFromSession(): number {
    const fromUser = (this.authService.user?.() as any)?.companyId;
    if (Number.isFinite(Number(fromUser)) && Number(fromUser) > 0) return Number(fromUser);
    const token = localStorage.getItem('userToken') || sessionStorage.getItem('userToken') || '';
    const decoded: any = this.authService.decodeToken(token);
    if (decoded && Number.isFinite(Number(decoded.companyId)) && Number(decoded.companyId) > 0) return Number(decoded.companyId);
    const fromStorage = localStorage.getItem('companyId') || sessionStorage.getItem('companyId');
    if (Number.isFinite(Number(fromStorage)) && Number(fromStorage) > 0) return Number(fromStorage);
    return 0;
  }

  ngOnInit(): void {
    const sessCompId = this.getCompanyIdFromSession();
    this.userCompanyId.set(sessCompId);

    this.loadCompanyDetails(sessCompId);
    this.initForms();
    this.loadCandidates();
    if (sessCompId > 0) {
      this.loadNextCodePreview(sessCompId);
    }
  }

  loadCompanyDetails(companyId: number): void {
    this.preOnboardingService.getActiveCompanies().subscribe({
      next: (res) => {
        const comps = res.data || [];
        const myComp = (companyId > 0 ? comps.find((c: any) => c.id === companyId) : null) || comps[0];
        if (myComp) {
          if (!companyId || companyId <= 0) {
            this.userCompanyId.set(myComp.id);
            this.loadNextCodePreview(myComp.id);
          }
          this.userCompanyName.set(myComp.company_name || myComp.legal_name || 'My Company');
          if (myComp.short_name) {
            this.nextCodePrefix.set(myComp.short_name);
          }
        }
      },
      error: (err) => console.error('Failed to load company details:', err)
    });
  }

  loadNextCodePreview(companyId: number): void {
    if (!companyId) return;
    this.preOnboardingService.getNextCandidateCode(companyId).subscribe({
      next: (res) => {
        if (res.data) {
          this.nextCodePreview.set(res.data.candidate_code);
          this.nextCodePrefix.set(res.data.prefix);
        }
      },
      error: (err) => console.error('Failed to load next candidate code:', err)
    });
  }

  onFilterChange(): void {
    this.loadCandidates();
  }

  resetFilters(): void {
    this.selectedDocsStatus.set('');
    this.selectedOfferStatus.set('');
    this.searchQuery.set('');
    this.loadCandidates();
  }

  filterByMetric(type: string): void {
    if (type === 'TOTAL') {
      this.resetFilters();
    } else if (type === 'PENDING_DOCS') {
      this.selectedDocsStatus.set('PENDING_UPLOAD');
      this.selectedOfferStatus.set('');
      this.loadCandidates();
    } else if (type === 'UNDER_REVIEW') {
      this.selectedDocsStatus.set('SUBMITTED');
      this.selectedOfferStatus.set('');
      this.loadCandidates();
    } else if (type === 'VERIFIED') {
      this.selectedDocsStatus.set('VERIFIED');
      this.selectedOfferStatus.set('');
      this.loadCandidates();
    } else if (type === 'OFFER_SENT') {
      this.selectedDocsStatus.set('');
      this.selectedOfferStatus.set('OFFER_SENT');
      this.loadCandidates();
    } else if (type === 'ACTIVE_HIRED') {
      this.selectedDocsStatus.set('');
      this.selectedOfferStatus.set('ACCEPTED');
      this.loadCandidates();
    }
  }

  get f() {
    return this.candidateForm.controls;
  }

  // CTC in Words with 5-second timer
  offeredCtcInWords = signal<string>('');
  showOfferedCtcWords = signal<boolean>(false);
  private offeredCtcTimer: any = null;

  annualCtcInWords = signal<string>('');
  showAnnualCtcWords = signal<boolean>(false);
  private annualCtcTimer: any = null;

  private initForms(): void {
    this.candidateForm = this.fb.group({
      company_id: [this.userCompanyId(), Validators.required],
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      designation: ['', Validators.required],
      department: ['', Validators.required],
      interview_status: ['INTERVIEW_CLEARED', Validators.required],
      joining_date: [null],
      offered_ctc: [null, [Validators.min(0)]],
      notes: ['']
    });

    // Real-time preview of candidate code when company changes
    this.candidateForm.get('company_id')?.valueChanges.subscribe(cid => {
      if (cid) {
        this.loadNextCodePreview(Number(cid));
      }
    });

    // Real-time English words for Offered CTC with 5s display duration
    this.candidateForm.get('offered_ctc')?.valueChanges.subscribe(val => {
      const num = Number(val);
      if (val && !isNaN(num) && num > 0) {
        this.offeredCtcInWords.set(this.numberToWordsIndian(num));
        this.showOfferedCtcWords.set(true);

        if (this.offeredCtcTimer) clearTimeout(this.offeredCtcTimer);
        this.offeredCtcTimer = setTimeout(() => {
          this.showOfferedCtcWords.set(false);
        }, 5000);
      } else {
        this.offeredCtcInWords.set('');
        this.showOfferedCtcWords.set(false);
      }
    });

    this.verifyForm = this.fb.group({
      status: ['VERIFIED', Validators.required],
      rejectionRemarks: ['']
    });

    this.offerForm = this.fb.group({
      designation: ['', Validators.required],
      department: ['', Validators.required],
      joining_date: [null, Validators.required],
      annual_ctc: [null, [Validators.required, Validators.min(0)]],
      monthly_gross: [null],
      basic: [null],
      hra: [null],
      special_allowance: [null],
      pf: [null],
      valid_until: [null],
      offer_letter_text: ['']
    });

    // Real-time English words for Offer Annual CTC with 5s display duration
    this.offerForm.get('annual_ctc')?.valueChanges.subscribe(ctc => {
      const num = Number(ctc);
      if (ctc && !isNaN(num) && num > 0) {
        this.annualCtcInWords.set(this.numberToWordsIndian(num));
        this.showAnnualCtcWords.set(true);

        if (this.annualCtcTimer) clearTimeout(this.annualCtcTimer);
        this.annualCtcTimer = setTimeout(() => {
          this.showAnnualCtcWords.set(false);
        }, 5000);

        const monthly = Math.round(num / 12);
        const basic = Math.round(monthly * 0.5);
        const hra = Math.round(basic * 0.5);
        const pf = Math.round(Math.min(basic, 15000) * 0.12);
        const special = Math.max(0, monthly - basic - hra);

        this.offerForm.patchValue({
          monthly_gross: monthly,
          basic,
          hra,
          special_allowance: special,
          pf
        }, { emitEvent: false });
      } else {
        this.annualCtcInWords.set('');
        this.showAnnualCtcWords.set(false);
      }
    });

    this.sendLinkForm = this.fb.group({
      customMessage: ['']
    });
  }

  onEmailInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    let value = inputElement.value;
    if (value.endsWith('@')) {
      value = value + 'gmail.com';
      const emailControl = this.candidateForm.get('email');
      if (emailControl) {
        emailControl.setValue(value);
      }
    }
  }

  loadCandidates(): void {
    this.loading.set(true);
    this.preOnboardingService.getCandidates({
      search: this.searchQuery(),
      documents_status: this.selectedDocsStatus(),
      offer_status: this.selectedOfferStatus(),
      company_id: this.userCompanyId()
    }).subscribe({
      next: (res) => {
        const list: PreOnboardingCandidate[] = res.data || [];
        this.candidates.set(list);
        this.totalRecords.set(res.total || list.length);
        this.calculateMetrics(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to load pre-onboarding candidates'
        });
      }
    });
  }

  private calculateMetrics(list: PreOnboardingCandidate[]): void {
    this.metricTotal.set(list.length);
    this.metricPendingDocs.set(list.filter(c => c.documents_status === 'PENDING_UPLOAD').length);
    this.metricUnderReview.set(list.filter(c => c.documents_status === 'SUBMITTED').length);
    this.metricVerified.set(list.filter(c => c.documents_status === 'VERIFIED').length);
    this.metricOfferSent.set(list.filter(c => c.offer_status === 'OFFER_SENT' || c.offer_status === 'ACCEPTED').length);
    this.metricCompleted.set(list.filter(c => c.onboarding_completed).length);
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
    this.loadCandidates();
  }

  // 3-Dot Actions Handler (Same pattern as Employee Management)
  handleRowAction(event: { actionId: string; row: PreOnboardingCandidate }): void {
    const candidate = event.row;
    switch (event.actionId) {
      case 'view':
        this.openViewDrawer(candidate);
        break;
      case 'edit':
      case 'update':
        this.openEditDrawer(candidate);
        break;
      case 'verify':
        this.openVerifyModal(candidate);
        break;
      case 'offer':
        this.openOfferModal(candidate);
        break;
      case 'copy_link':
        this.copyPortalLink(candidate);
        break;
      case 'send_email':
        this.openSendLinkModal(candidate);
        break;
      case 'convert':
        this.confirmConvertToEmployee(candidate);
        break;
      case 'delete':
        this.confirmDeleteCandidate(candidate);
        break;
      default:
        break;
    }
  }

  // Drawer Full Screen Toggle
  toggleDrawerFullScreen(): void {
    this.isDrawerFullScreen = !this.isDrawerFullScreen;
  }

  // Drawer Open Handlers
  openAddDrawer(): void {
    this.isViewMode = false;
    this.isEditMode = false;
    this.editingCandidateId = null;
    this.selectedCandidate.set(null);
    const cid = this.userCompanyId();

    this.candidateForm.reset({
      company_id: cid,
      interview_status: 'INTERVIEW_CLEARED'
    });
    this.candidateForm.enable();
    this.loadNextCodePreview(cid);
    this.showDrawer = true;
  }

  openEditDrawer(c: PreOnboardingCandidate): void {
    this.isViewMode = false;
    this.isEditMode = true;
    this.editingCandidateId = c.id;
    this.selectedCandidate.set(c);
    this.candidateForm.patchValue({
      company_id: c.company_id,
      full_name: c.full_name,
      email: c.email,
      mobile: c.mobile,
      designation: c.designation,
      department: c.department,
      interview_status: c.interview_status,
      joining_date: c.joining_date ? new Date(c.joining_date) : null,
      offered_ctc: c.offered_ctc,
      notes: c.notes
    });
    this.candidateForm.enable();
    this.nextCodePreview.set(c.candidate_code);
    this.showDrawer = true;
  }

  openViewDrawer(c: PreOnboardingCandidate): void {
    this.isViewMode = true;
    this.isEditMode = false;
    this.selectedCandidate.set(c);
    this.candidateForm.patchValue({
      company_id: c.company_id,
      full_name: c.full_name,
      email: c.email,
      mobile: c.mobile,
      designation: c.designation,
      department: c.department,
      interview_status: c.interview_status,
      joining_date: c.joining_date ? new Date(c.joining_date) : null,
      offered_ctc: c.offered_ctc,
      notes: c.notes
    });
    this.candidateForm.disable();
    this.nextCodePreview.set(c.candidate_code);
    this.showDrawer = true;
  }

  closeDrawer(): void {
    this.showDrawer = false;
    this.selectedCandidate.set(null);
  }

  saveCandidate(): void {
    if (this.candidateForm.invalid) {
      this.candidateForm.markAllAsTouched();
      return;
    }

    const formVal = this.candidateForm.value;
    const cid = formVal.company_id || this.userCompanyId();
    const payload = {
      ...formVal,
      company_id: cid,
      joining_date: formVal.joining_date ? this.formatDate(formVal.joining_date) : null
    };

    if (this.isEditMode && this.editingCandidateId) {
      this.preOnboardingService.updateCandidate(this.editingCandidateId, payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: 'Candidate details updated successfully'
          });
          this.showDrawer = false;
          this.loadCandidates();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: err.error?.message || 'Could not update candidate'
          });
        }
      });
    } else {
      this.preOnboardingService.createCandidate(payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Candidate Created',
            detail: 'Candidate added for pre-onboarding. You can now share the upload link.'
          });
          this.showDrawer = false;
          this.loadCandidates();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Creation Failed',
            detail: err.error?.message || 'Could not add candidate'
          });
        }
      });
    }
  }

  confirmDeleteCandidate(c: PreOnboardingCandidate): void {
    this.confirmationService.confirm({
      header: 'Delete Candidate Record',
      message: `Are you sure you want to delete ${c.full_name} (${c.candidate_code}) from Pre-Onboarding? This cannot be undone.`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: {
        label: 'Delete',
        severity: 'danger'
      },
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true
      },
      accept: () => {
        this.preOnboardingService.deleteCandidate(c.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: 'Candidate removed successfully'
            });
            this.loadCandidates();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Deletion Failed',
              detail: err.error?.message || 'Failed to delete candidate'
            });
          }
        });
      }
    });
  }

  // Link Sharing
  getCandidatePortalUrl(c: PreOnboardingCandidate): string {
    return `${window.location.origin}/candidate-onboarding/${c.access_token}`;
  }

  copyPortalLink(c: PreOnboardingCandidate): void {
    const url = this.getCandidatePortalUrl(c);
    navigator.clipboard.writeText(url).then(() => {
      this.messageService.add({
        severity: 'info',
        summary: 'Link Copied',
        detail: `Pre-onboarding link for ${c.full_name} copied to clipboard!`
      });
    });
  }

  openSendLinkModal(c: PreOnboardingCandidate): void {
    this.selectedCandidate.set(c);
    this.sendLinkForm.reset({
      customMessage: `Dear ${c.full_name}, congratulations on clearing your interview! Please complete your document submission before joining.`
    });
    this.sendLinkModalVisible = true;
  }

  sendInvitationEmail(): void {
    const candidate = this.selectedCandidate();
    if (!candidate) return;

    const customMsg = this.sendLinkForm.get('customMessage')?.value;
    this.preOnboardingService.sendInvitationLink(candidate.id, customMsg).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Email Sent',
          detail: `Pre-onboarding invitation email sent to ${candidate.email}`
        });
        this.sendLinkModalVisible = false;
        this.loadCandidates();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Email Failed',
          detail: err.error?.message || 'Could not send invitation email'
        });
      }
    });
  }

  // Document Verification
  openVerifyModal(c: PreOnboardingCandidate): void {
    this.selectedCandidate.set(c);
    this.verifyForm.reset({
      status: 'VERIFIED',
      rejectionRemarks: ''
    });
    this.verifyModalVisible = true;
  }

  submitVerification(): void {
    const candidate = this.selectedCandidate();
    if (!candidate) return;

    const val = this.verifyForm.value;
    if (val.status === 'REJECTED' && !val.rejectionRemarks) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Remarks Required',
        detail: 'Please provide rejection remarks explaining why documents were rejected.'
      });
      return;
    }

    this.preOnboardingService.verifyDocuments(candidate.id, {
      status: val.status,
      rejectionRemarks: val.rejectionRemarks
    }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Verification Saved',
          detail: val.status === 'VERIFIED' ? 'All documents approved and marked verified!' : 'Rejection feedback sent to candidate.'
        });
        this.verifyModalVisible = false;
        this.loadCandidates();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Verification Failed',
          detail: err.error?.message || 'Could not save verification'
        });
      }
    });
  }

  // Offer Management
  openOfferModal(c: PreOnboardingCandidate): void {
    this.selectedCandidate.set(c);
    const ctc = c.offered_ctc || 600000;
    const monthly = Math.round(ctc / 12);
    const basic = Math.round(monthly * 0.5);
    const hra = Math.round(basic * 0.5);
    const pf = Math.round(Math.min(basic, 15000) * 0.12);
    const special = Math.max(0, monthly - basic - hra);

    this.offerForm.patchValue({
      designation: c.designation,
      department: c.department,
      joining_date: c.joining_date ? new Date(c.joining_date) : new Date(Date.now() + 14 * 86400000),
      annual_ctc: ctc,
      monthly_gross: monthly,
      basic,
      hra,
      special_allowance: special,
      pf,
      valid_until: new Date(Date.now() + 7 * 86400000),
      offer_letter_text: `We are delighted to extend an offer of employment to you for the position of ${c.designation} at our organization.`
    });

    this.offerModalVisible = true;
  }

  issueOfferLetter(): void {
    const candidate = this.selectedCandidate();
    if (!candidate || this.offerForm.invalid) {
      this.offerForm.markAllAsTouched();
      return;
    }

    const val = this.offerForm.value;
    const payload = {
      ...val,
      issued_at: new Date().toISOString(),
      joining_date: val.joining_date ? this.formatDate(val.joining_date) : null,
      valid_until: val.valid_until ? this.formatDate(val.valid_until) : null,
      ctc_breakup: {
        basic: val.basic,
        hra: val.hra,
        special_allowance: val.special_allowance,
        pf: val.pf
      }
    };

    this.preOnboardingService.issueOffer(candidate.id, payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Offer Released',
          detail: `Offer letter issued & emailed to ${candidate.full_name}!`
        });
        this.offerModalVisible = false;
        this.loadCandidates();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Offer Issuance Failed',
          detail: err.error?.message || 'Could not issue offer'
        });
      }
    });
  }

  // Convert Candidate to Active Employee
  confirmConvertToEmployee(c: PreOnboardingCandidate): void {
    if (c.documents_status !== 'VERIFIED') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Documents Not Verified',
        detail: `All 8 mandatory documents for ${c.full_name} must be verified and approved before converting to an active employee.`
      });
      return;
    }

    if (c.offer_status !== 'ACCEPTED') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Offer Acceptance Required',
        detail: `Official offer letter must be issued and accepted with digital signature by ${c.full_name} before converting.`
      });
      return;
    }

    this.confirmationService.confirm({
      header: 'Convert Candidate to Active Employee',
      message: `Candidate ${c.full_name} has accepted the offer! Do you want to generate an Employee Code, create active system credentials, and complete pre-onboarding?`,
      icon: 'pi pi-user-plus',
      acceptButtonProps: {
        label: 'Convert Now',
        severity: 'success'
      },
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true
      },
      accept: () => {
        this.preOnboardingService.convertToEmployee(c.id).subscribe({
          next: (res) => {
            this.confirmationService.confirm({
              header: 'Employee Created Successfully! 🎉',
              message: `Employee Code: ${res.data?.employee_code}\nTemporary Password: ${res.data?.temporary_password}\nWelcome email with credentials dispatched to ${c.email}.`,
              icon: 'pi pi-check-circle',
              rejectVisible: false,
              acceptButtonProps: {
                label: 'Close'
              },
              accept: () => {
                this.loadCandidates();
              }
            });
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Conversion Failed',
              detail: err.error?.message || 'Could not convert candidate to employee'
            });
          }
        });
      }
    });
  }

  // Document Preview with Next, Previous & Download All
  previewDocument(docItem: any, fileList?: any[], index: number = 0, categoryLabel: string = ''): void {
    if (!docItem) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No File',
        detail: 'Document file is not uploaded yet.'
      });
      return;
    }

    let list: any[] = [];
    if (fileList && fileList.length > 0) {
      list = fileList;
    } else if (docItem.files && Array.isArray(docItem.files) && docItem.files.length > 0) {
      list = docItem.files;
    } else if (docItem.url) {
      list = [docItem];
    }

    if (list.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No File',
        detail: 'Document file is not uploaded yet.'
      });
      return;
    }

    this.previewFileList = list;
    this.previewCurrentIndex = Math.max(0, Math.min(index, list.length - 1));
    this.previewCategoryLabel = categoryLabel || docItem.label || docItem.title || '';
    this.loadCurrentPreviewFile();
    this.docPreviewVisible = true;
  }

  loadCurrentPreviewFile(): void {
    const file = this.previewFileList[this.previewCurrentIndex];
    if (!file || !file.url) return;

    this.previewRawUrl = file.url;
    const fileName = file.fileName || file.name || `${this.previewCategoryLabel || 'Document'}_${this.previewCurrentIndex + 1}`;
    const total = this.previewFileList.length;
    if (total > 1) {
      this.previewTitle = `${this.previewCategoryLabel ? this.previewCategoryLabel + ' • ' : ''}${fileName} (${this.previewCurrentIndex + 1} of ${total})`;
    } else {
      this.previewTitle = `${this.previewCategoryLabel ? this.previewCategoryLabel + ' • ' : ''}${fileName}`;
    }

    const isPdf = file.url.toLowerCase().includes('.pdf') ||
      file.url.startsWith('data:application/pdf') ||
      (fileName.toLowerCase().endsWith('.pdf'));
    this.isPdfPreview = isPdf;
    this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(file.url);
  }

  prevPreviewFile(): void {
    if (this.hasPrevPreview()) {
      this.previewCurrentIndex--;
      this.loadCurrentPreviewFile();
    }
  }

  nextPreviewFile(): void {
    if (this.hasNextPreview()) {
      this.previewCurrentIndex++;
      this.loadCurrentPreviewFile();
    }
  }

  jumpToPreviewIndex(index: number): void {
    if (index >= 0 && index < this.previewFileList.length) {
      this.previewCurrentIndex = index;
      this.loadCurrentPreviewFile();
    }
  }

  hasPrevPreview(): boolean {
    return this.previewCurrentIndex > 0;
  }

  hasNextPreview(): boolean {
    return this.previewCurrentIndex < this.previewFileList.length - 1;
  }

  downloadCurrentDoc(): void {
    if (!this.previewRawUrl) return;
    const file = this.previewFileList[this.previewCurrentIndex];
    const fileName = file?.fileName || file?.name || (this.previewTitle || 'document').replace(/\s+/g, '_');
    this.triggerDownload(this.previewRawUrl, fileName);
  }

  downloadAllDocs(): void {
    if (!this.previewFileList || this.previewFileList.length === 0) return;

    if (this.previewFileList.length === 1) {
      this.downloadCurrentDoc();
      return;
    }

    this.isDownloadingAll = true;
    this.messageService.add({
      severity: 'info',
      summary: 'Downloading All Files',
      detail: `Downloading ${this.previewFileList.length} files...`
    });

    this.previewFileList.forEach((file, idx) => {
      if (file.url) {
        setTimeout(() => {
          const name = file.fileName || file.name || `document_${idx + 1}.jpg`;
          this.triggerDownload(file.url, name);
          if (idx === this.previewFileList.length - 1) {
            this.isDownloadingAll = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Downloads Complete',
              detail: `All ${this.previewFileList.length} files downloaded successfully!`
            });
          }
        }, idx * 300);
      }
    });
  }

  private triggerDownload(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  openPreviewInNewTab(): void {
    if (!this.previewRawUrl) return;
    const win = window.open();
    if (win) {
      if (this.isPdfPreview) {
        win.document.write(`<title>${this.previewTitle}</title><iframe src="${this.previewRawUrl}" style="border:0; top:0; left:0; bottom:0; right:0; width:100%; height:100vh;" allowfullscreen></iframe>`);
      } else {
        win.document.write(`<title>${this.previewTitle}</title><div style="display:flex;justify-content:center;align-items:center;min-height:100vh;background:#090d16;margin:0;"><img src="${this.previewRawUrl}" style="max-width:100%;max-height:100vh;object-fit:contain;box-shadow:0 10px 30px rgba(0,0,0,0.6);border-radius:8px;"/></div>`);
      }
    }
  }

  @HostListener('window:keydown', ['$event'])
  handlePreviewKeydown(event: KeyboardEvent): void {
    if (this.docPreviewVisible) {
      if (event.key === 'ArrowLeft') {
        this.prevPreviewFile();
      } else if (event.key === 'ArrowRight') {
        this.nextPreviewFile();
      } else if (event.key === 'Escape') {
        this.docPreviewVisible = false;
      }
    }
  }

  openOfferLetterPreview(candidate: any): void {
    if (!candidate || !candidate.offer_details) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Offer Issued',
        detail: 'Official offer letter has not been issued for this candidate yet.'
      });
      return;
    }
    this.selectedOfferCandidate = candidate;
    this.offerLetterPreviewVisible = true;
  }

  printOfferLetter(): void {
    window.print();
  }

  async downloadOfferLetterPdf(): Promise<void> {
    const page1 = document.getElementById('hr-offer-letter-page-1');
    const page2 = document.getElementById('hr-offer-letter-page-2');
    if (!page1 || !page2) {
      this.printOfferLetter();
      return;
    }

    this.isDownloadingOfferPdf = true;
    this.messageService.add({
      severity: 'info',
      summary: 'Generating PDF',
      detail: 'Compiling 2-page Appointment Letter...'
    });

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const canvas1 = await html2canvas(page1, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const img1 = canvas1.toDataURL('image/jpeg', 0.95);
      pdf.addImage(img1, 'JPEG', 0, 0, pdfWidth, pdfHeight);

      pdf.addPage();
      const canvas2 = await html2canvas(page2, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const img2 = canvas2.toDataURL('image/jpeg', 0.95);
      pdf.addImage(img2, 'JPEG', 0, 0, pdfWidth, pdfHeight);

      const candidateName = (this.selectedOfferCandidate?.full_name || 'Candidate').replace(/\s+/g, '_');
      pdf.save(`Appointment_Letter_${candidateName}.pdf`);

      this.messageService.add({
        severity: 'success',
        summary: 'Download Complete',
        detail: 'Official 2-Page Appointment Letter downloaded successfully!'
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      this.printOfferLetter();
    } finally {
      this.isDownloadingOfferPdf = false;
    }
  }

  getUploadedDoc(candidate: PreOnboardingCandidate | null, key: string): any {
    if (!candidate || !Array.isArray(candidate.documents)) return null;
    const doc = candidate.documents.find((d: any) => d.key === key || d.type === key);
    if (!doc) return null;
    if (doc.files && doc.files.length > 0) return doc;
    if (doc.url && doc.url.trim().length > 0) return doc;
    return null;
  }

  getUploadedDocFiles(candidate: PreOnboardingCandidate | null, key: string): any[] {
    const doc = this.getUploadedDoc(candidate, key);
    if (!doc) return [];
    if (Array.isArray(doc.files) && doc.files.length > 0) return doc.files;
    if (doc.url) return [{ fileName: doc.fileName || `${doc.title || key}.pdf`, url: doc.url, fileSize: doc.fileSize || '' }];
    return [];
  }

  getUploadedCount(candidate: PreOnboardingCandidate): number {
    if (!Array.isArray(candidate.documents)) return 0;
    return candidate.documents.filter((d: any) => (d.files && d.files.length > 0) || (d.url && d.url.trim().length > 0)).length;
  }

  // Badge / Tag Styles
  getDocsBadgeSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'VERIFIED': return 'success';
      case 'SUBMITTED': return 'info';
      case 'REJECTED': return 'danger';
      case 'PENDING_UPLOAD': return 'warn';
      default: return 'secondary';
    }
  }

  getOfferBadgeSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'ACCEPTED': return 'success';
      case 'OFFER_SENT': return 'info';
      case 'DECLINED': return 'danger';
      case 'NOT_ISSUED': return 'secondary';
      default: return 'secondary';
    }
  }

  onCtcFocus(): void {
    const val = Number(this.candidateForm.get('offered_ctc')?.value);
    if (val && val > 0) {
      this.offeredCtcInWords.set(this.numberToWordsIndian(val));
      this.showOfferedCtcWords.set(true);
      if (this.offeredCtcTimer) clearTimeout(this.offeredCtcTimer);
      this.offeredCtcTimer = setTimeout(() => this.showOfferedCtcWords.set(false), 5000);
    }
  }

  onAnnualCtcFocus(): void {
    const val = Number(this.offerForm.get('annual_ctc')?.value);
    if (val && val > 0) {
      this.annualCtcInWords.set(this.numberToWordsIndian(val));
      this.showAnnualCtcWords.set(true);
      if (this.annualCtcTimer) clearTimeout(this.annualCtcTimer);
      this.annualCtcTimer = setTimeout(() => this.showAnnualCtcWords.set(false), 5000);
    }
  }

  numberToWordsIndian(num: number | null | undefined): string {
    if (!num || isNaN(num) || num <= 0) return '';
    num = Math.floor(num);

    const a = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
      'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n: number): string => {
      if (n === 0) return '';
      if (n < 20) return a[n] + ' ';
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + a[n % 10] : '') + ' ';
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred ' + inWords(n % 100);
      if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + inWords(n % 1000);
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + inWords(n % 100000);
      return inWords(Math.floor(n / 10000000)) + 'Crore ' + inWords(n % 10000000);
    };

    const words = inWords(num).trim().replace(/\s+/g, ' ');
    return words ? `${words} Rupees Only` : '';
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }
}
