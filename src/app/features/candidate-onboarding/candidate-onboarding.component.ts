import { Component, OnInit, ElementRef, ViewChild, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { PreOnboardingService } from '../../shared/services/pre-onboarding.service';

export interface UploadedFileMeta {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  url: string;
  uploadedAt: string;
}

export interface DocUploadItem {
  key: string;
  label: string;
  description: string;
  icon: string;
  required: boolean;
  files: UploadedFileMeta[];
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  url?: string;
  uploadedAt?: string;
}

@Component({
  selector: 'app-candidate-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    DialogModule,
    ToastModule,
    ProgressBarModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './candidate-onboarding.component.html',
  styleUrl: './candidate-onboarding.component.scss'
})
export class CandidateOnboardingComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly preOnboardingService = inject(PreOnboardingService);
  private readonly messageService = inject(MessageService);
  private readonly sanitizer = inject(DomSanitizer);

  @ViewChild('signatureCanvas') signatureCanvas!: ElementRef<HTMLCanvasElement>;

  token = '';
  loading = signal<boolean>(true);
  submittingDocs = signal<boolean>(false);
  respondingOffer = signal<boolean>(false);
  candidateData = signal<any>(null);
  loadError = signal<string | null>(null);

  // Active step: 1 = Documents, 2 = Under Review, 3 = Offer Letter, 4 = Completed
  activeStep = signal<number>(1);

  // 3 Signature Options: 'draw' | 'upload' | 'type'
  signatureMode = signal<'draw' | 'upload' | 'type'>('draw');
  uploadedSignatureUrl = signal<string | null>(null);
  uploadedSignatureFileName = signal<string>('');
  typedSignatureName = signal<string>('');
  termsAccepted = signal<boolean>(false);

  // 8 Mandatory Documents list
  documents: DocUploadItem[] = [
    {
      key: 'aadhaar',
      label: 'Aadhaar Card (Front & Back)',
      description: 'Government issued Aadhaar card copy (Upload front & back)',
      icon: 'pi pi-id-card',
      required: true,
      files: []
    },
    {
      key: 'pan',
      label: 'PAN Card',
      description: 'Permanent Account Number card copy',
      icon: 'pi pi-credit-card',
      required: true,
      files: []
    },
    {
      key: 'photo',
      label: 'Passport Size Photograph',
      description: 'Recent professional color photograph with white background',
      icon: 'pi pi-image',
      required: true,
      files: []
    },
    {
      key: 'degree',
      label: 'Highest Graduation / Degree Certificate',
      description: 'Degree certificate or consolidated marksheets',
      icon: 'pi pi-graduation-cap',
      required: true,
      files: []
    },
    {
      key: 'salary_slips',
      label: 'Last 3 Months Salary Slips',
      description: 'Upload salary slips for last 3 consecutive months',
      icon: 'pi pi-file-excel',
      required: true,
      files: []
    },
    {
      key: 'relieving_letter',
      label: 'Previous Relieving / Experience Letter',
      description: 'Relieving letter or resignation acceptance email',
      icon: 'pi pi-file-pdf',
      required: true,
      files: []
    },
    {
      key: 'cheque',
      label: 'Cancelled Cheque / Bank Passbook',
      description: 'Cheque with your name printed or passbook copy with IFSC',
      icon: 'pi pi-book',
      required: true,
      files: []
    },
    {
      key: 'bank_statement',
      label: 'Bank Statement (Last 6 Months)',
      description: 'Salary bank account statement showing salary credits',
      icon: 'pi pi-wallet',
      required: true,
      files: []
    }
  ];

  // Document Preview Modal
  previewDialogVisible = false;
  previewUrl: SafeResourceUrl | null = null;
  previewRawUrl = '';
  previewTitle = '';
  isPdf = false;
  previewFileList: UploadedFileMeta[] = [];
  previewCurrentIndex = 0;
  previewCategoryLabel = '';
  isDownloadingAll = false;

  // Signature Canvas State
  private isDrawing = false;
  private ctx: CanvasRenderingContext2D | null = null;
  hasSigned = false;

  // Decline Dialog
  declineDialogVisible = false;
  declineReason = '';

  ngOnInit(): void {
    this.token = this.route.snapshot.params['token'] || '';
    if (!this.token) {
      this.loadError.set('Invalid pre-onboarding link. Token is missing.');
      this.loading.set(false);
      return;
    }

    this.loadPortalData();
  }

  loadPortalData(): void {
    this.loading.set(true);
    this.preOnboardingService.getCandidateByToken(this.token).subscribe({
      next: (res) => {
        const data = res.data;
        this.candidateData.set(data);
        this.loadError.set(null);

        // Pre-populate any existing uploaded documents
        if (Array.isArray(data.documents) && data.documents.length > 0) {
          data.documents.forEach((uploaded: any) => {
            const target = this.documents.find(d => d.key === uploaded.key || d.key === uploaded.type);
            if (target) {
              if (Array.isArray(uploaded.files) && uploaded.files.length > 0) {
                target.files = uploaded.files.map((f: any, idx: number) => ({
                  id: f.id || `${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
                  fileName: f.fileName || f.name || `${target.label}_${idx + 1}.pdf`,
                  fileSize: f.fileSize || f.size || '',
                  fileType: f.fileType || f.type || '',
                  url: f.url,
                  uploadedAt: f.uploadedAt || uploaded.uploadedAt || ''
                }));
              } else if (uploaded.url) {
                target.files = [{
                  id: `${Date.now()}_0`,
                  fileName: uploaded.fileName || `${target.label}.pdf`,
                  fileSize: uploaded.fileSize || '',
                  fileType: uploaded.fileType || '',
                  url: uploaded.url,
                  uploadedAt: uploaded.uploadedAt || ''
                }];
              }
              target.url = target.files[0]?.url;
              target.fileName = target.files[0]?.fileName;
              target.fileSize = target.files[0]?.fileSize;
              target.uploadedAt = target.files[0]?.uploadedAt;
            }
          });
        }

        // Populate candidate full name into typedSignatureName if empty
        if (data.full_name && !this.typedSignatureName()) {
          this.typedSignatureName.set(data.full_name);
        }

        // Determine initial active step
        if (data.onboarding_completed) {
          this.activeStep.set(4);
        } else if (data.offer_status === 'ACCEPTED') {
          this.activeStep.set(4);
        } else if (data.offer_status === 'OFFER_SENT') {
          this.activeStep.set(3);
          setTimeout(() => this.initSignatureCanvas(), 300);
        } else if (data.documents_status === 'VERIFIED') {
          this.activeStep.set(2);
        } else {
          this.activeStep.set(1);
        }

        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set(err.error?.message || 'Invalid or expired pre-onboarding link. Please contact HR.');
      }
    });
  }

  todayDate = new Date();

  selectSignatureMode(mode: 'draw' | 'upload' | 'type'): void {
    this.signatureMode.set(mode);
    if (mode === 'draw') {
      setTimeout(() => this.initSignatureCanvas(), 100);
    }
    if (mode === 'type' && !this.typedSignatureName()) {
      this.typedSignatureName.set(this.candidateData()?.full_name || '');
    }
  }

  // Multiple files selection handler
  onFilesSelected(event: any, docItem: DocUploadItem): void {
    const fileList: FileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);
    let filesLoaded = 0;

    filesArray.forEach((file) => {
      if (file.size > 15 * 1024 * 1024) {
        this.messageService.add({
          severity: 'error',
          summary: 'File Too Large',
          detail: `${file.name} exceeds 15MB limit`
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const fileMeta: UploadedFileMeta = {
          id: `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          fileType: file.type,
          url: reader.result as string,
          uploadedAt: new Date().toISOString()
        };

        if (!docItem.files) docItem.files = [];
        docItem.files.push(fileMeta);

        docItem.url = docItem.files[0]?.url;
        docItem.fileName = docItem.files[0]?.fileName;
        docItem.fileSize = docItem.files[0]?.fileSize;
        docItem.uploadedAt = docItem.files[0]?.uploadedAt;

        filesLoaded++;
        if (filesLoaded === filesArray.length) {
          this.messageService.add({
            severity: 'success',
            summary: 'File(s) Attached',
            detail: `${filesLoaded} file(s) added to ${docItem.label}`
          });
        }
      };
      reader.readAsDataURL(file);
    });

    event.target.value = '';
  }

  // Remove individual file from category
  removeFile(docItem: DocUploadItem, fileId: string): void {
    if (!docItem.files) return;
    docItem.files = docItem.files.filter(f => f.id !== fileId);
    docItem.url = docItem.files[0]?.url;
    docItem.fileName = docItem.files[0]?.fileName;
    docItem.fileSize = docItem.files[0]?.fileSize;
    docItem.uploadedAt = docItem.files[0]?.uploadedAt;

    this.messageService.add({
      severity: 'info',
      summary: 'File Removed',
      detail: 'File removed successfully'
    });
  }

  // Replace all files in a category
  replaceAllFiles(event: any, docItem: DocUploadItem): void {
    docItem.files = [];
    docItem.url = undefined;
    docItem.fileName = undefined;
    docItem.fileSize = undefined;
    this.onFilesSelected(event, docItem);
  }

  // Document Preview with Next, Previous & Download All
  previewFile(file: UploadedFileMeta, docLabel: string, fileList?: UploadedFileMeta[], index: number = 0): void {
    if (!file || !file.url) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No File',
        detail: 'Document file is not uploaded yet.'
      });
      return;
    }

    let list: UploadedFileMeta[] = [];
    if (fileList && fileList.length > 0) {
      list = fileList;
    } else {
      list = [file];
    }

    this.previewFileList = list;
    this.previewCurrentIndex = Math.max(0, Math.min(index, list.length - 1));
    this.previewCategoryLabel = docLabel;
    this.loadCurrentCandidatePreviewFile();
    this.previewDialogVisible = true;
  }

  previewDoc(docItem: DocUploadItem): void {
    if (docItem.files && docItem.files.length > 0) {
      this.previewFile(docItem.files[0], docItem.label, docItem.files, 0);
    } else if (docItem.url) {
      const meta: UploadedFileMeta = {
        id: 'legacy-doc',
        fileName: docItem.fileName || `${docItem.label}.pdf`,
        fileSize: docItem.fileSize || '',
        fileType: docItem.fileType || 'application/pdf',
        url: docItem.url,
        uploadedAt: docItem.uploadedAt || new Date().toISOString()
      };
      this.previewFile(meta, docItem.label, [meta], 0);
    }
  }

  loadCurrentCandidatePreviewFile(): void {
    const file = this.previewFileList[this.previewCurrentIndex];
    if (!file || !file.url) return;

    this.previewRawUrl = file.url;
    const fileName = file.fileName || `${this.previewCategoryLabel || 'Document'}_${this.previewCurrentIndex + 1}`;
    const total = this.previewFileList.length;
    if (total > 1) {
      this.previewTitle = `${this.previewCategoryLabel ? this.previewCategoryLabel + ' • ' : ''}${fileName} (${this.previewCurrentIndex + 1} of ${total})`;
    } else {
      this.previewTitle = `${this.previewCategoryLabel ? this.previewCategoryLabel + ' • ' : ''}${fileName}`;
    }

    this.isPdf = file.url.startsWith('data:application/pdf') || (fileName.toLowerCase().endsWith('.pdf'));
    this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(file.url);
  }

  prevPreviewFile(): void {
    if (this.hasPrevPreview()) {
      this.previewCurrentIndex--;
      this.loadCurrentCandidatePreviewFile();
    }
  }

  nextPreviewFile(): void {
    if (this.hasNextPreview()) {
      this.previewCurrentIndex++;
      this.loadCurrentCandidatePreviewFile();
    }
  }

  jumpToPreviewIndex(index: number): void {
    if (index >= 0 && index < this.previewFileList.length) {
      this.previewCurrentIndex = index;
      this.loadCurrentCandidatePreviewFile();
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
    const fileName = file?.fileName || (this.previewTitle || 'document').replace(/\s+/g, '_');
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
          const name = file.fileName || `document_${idx + 1}.jpg`;
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

  openInNewTab(url?: string): void {
    const targetUrl = url || this.previewRawUrl;
    if (!targetUrl) return;
    const win = window.open();
    if (win) {
      if (this.isPdf) {
        win.document.write(`<title>${this.previewTitle || 'Document Preview'}</title><iframe src="${targetUrl}" style="border:0; top:0; left:0; bottom:0; right:0; width:100%; height:100vh;" allowfullscreen></iframe>`);
      } else {
        win.document.write(`<title>${this.previewTitle || 'Document Preview'}</title><div style="display:flex;justify-content:center;align-items:center;min-height:100vh;background:#0f172a;margin:0;"><img src="${targetUrl}" style="max-width:100%;max-height:100vh;object-fit:contain;box-shadow:0 10px 25px rgba(0,0,0,0.5);border-radius:8px;"/></div>`);
      }
    }
  }

  @HostListener('window:keydown', ['$event'])
  handlePreviewKeydown(event: KeyboardEvent): void {
    if (this.previewDialogVisible) {
      if (event.key === 'ArrowLeft') {
        this.prevPreviewFile();
      } else if (event.key === 'ArrowRight') {
        this.nextPreviewFile();
      } else if (event.key === 'Escape') {
        this.previewDialogVisible = false;
      }
    }
  }

  getUploadedCount(): number {
    return this.documents.filter(d => d.files && d.files.length > 0).length;
  }

  getTotalFilesCount(): number {
    return this.documents.reduce((acc, d) => acc + (d.files?.length || 0), 0);
  }

  getUploadProgress(): number {
    return Math.round((this.getUploadedCount() / this.documents.length) * 100);
  }

  canSubmitDocuments(): boolean {
    return this.documents.every(d => d.files && d.files.length > 0);
  }

  submitAllDocuments(): void {
    if (!this.canSubmitDocuments()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing Documents',
        detail: 'Please upload files for all 8 mandatory document categories.'
      });
      return;
    }

    this.submittingDocs.set(true);
    const docsPayload = this.documents.map(d => ({
      key: d.key,
      title: d.label,
      files: d.files || [],
      url: d.files?.[0]?.url || '',
      fileName: d.files?.[0]?.fileName || '',
      fileSize: d.files?.[0]?.fileSize || '',
      fileType: d.files?.[0]?.fileType || '',
      uploadedAt: d.files?.[0]?.uploadedAt || new Date().toISOString()
    }));

    this.preOnboardingService.submitDocumentsByToken(this.token, docsPayload).subscribe({
      next: (res) => {
        this.submittingDocs.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Documents Submitted',
          detail: 'All 8 documents submitted successfully! HR will review and verify shortly.'
        });
        // Stay on Step 1 with "Under Review" state; Step 2 stays locked until HR verifies
        this.activeStep.set(1);
        this.loadPortalData();
      },
      error: (err) => {
        this.submittingDocs.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Submission Failed',
          detail: err.error?.message || 'Could not submit documents. Please try again.'
        });
      }
    });
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.activeStep() === 3 && !this.hasSigned) {
      this.initSignatureCanvas();
    }
  }

  // Signature Canvas Logic
  initSignatureCanvas(): void {
    if (!this.signatureCanvas) return;
    const canvas = this.signatureCanvas.nativeElement;
    const parentW = canvas.parentElement?.clientWidth || 500;
    canvas.width = Math.min(parentW, 700);
    canvas.height = 150;
    this.ctx = canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.strokeStyle = '#1e3a8a';
      this.ctx.lineWidth = 2.5;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
    }
  }

  startDrawing(e: MouseEvent | TouchEvent): void {
    if (e.cancelable) e.preventDefault();
    this.isDrawing = true;
    const pos = this.getCanvasPos(e);
    this.ctx?.beginPath();
    this.ctx?.moveTo(pos.x, pos.y);
  }

  draw(e: MouseEvent | TouchEvent): void {
    if (!this.isDrawing || !this.ctx) return;
    if (e.cancelable) e.preventDefault();
    const pos = this.getCanvasPos(e);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
    this.hasSigned = true;
  }

  stopDrawing(): void {
    this.isDrawing = false;
  }

  clearSignature(): void {
    if (!this.signatureCanvas || !this.ctx) return;
    const canvas = this.signatureCanvas.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.hasSigned = false;
  }

  private getCanvasPos(e: MouseEvent | TouchEvent): { x: number; y: number } {
    const canvas = this.signatureCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    if (e instanceof MouseEvent) {
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    } else {
      const touch = e.touches[0] || (e as any).changedTouches?.[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
  }

  // Step access / locking logic
  canAccessStep(stepNum: number): boolean {
    const c = this.candidateData();
    if (!c) return stepNum === 1;

    // Step 1: Upload Docs is always accessible
    if (stepNum === 1) return true;

    // Step 2: HR Verification unlocks ONLY when HR has verified the documents!
    // Until HR verifies, Step 2 is locked!
    if (stepNum === 2) {
      return c.documents_status === 'VERIFIED';
    }

    // Step 3: Review & Sign Offer unlocks ONLY when HR has released an offer
    if (stepNum === 3) {
      return c.offer_status === 'OFFER_SENT' || c.offer_status === 'ACCEPTED' || c.offer_status === 'DECLINED';
    }

    // Step 4: Welcome Aboard unlocks ONLY once offer is accepted or onboarding complete
    if (stepNum === 4) {
      return c.offer_status === 'ACCEPTED' || !!c.onboarding_completed;
    }

    return false;
  }

  getStepLockReason(stepNum: number): string {
    const c = this.candidateData();
    if (stepNum === 2) {
      if (!c || c.documents_status === 'PENDING_UPLOAD') {
        return 'Step 2 will unlock after you submit all 8 mandatory documents and HR Admin verifies them.';
      }
      if (c.documents_status === 'SUBMITTED') {
        return 'Your 8 documents are currently under review by HR Admin. Step 2 will unlock as soon as HR completes verification.';
      }
      if (c.documents_status === 'REJECTED') {
        return 'HR Admin requested document re-upload. Please update the affected documents in Step 1 and re-submit.';
      }
      return 'Step 2 unlocks once HR Admin verifies your documents.';
    }
    if (stepNum === 3) {
      if (c?.documents_status !== 'VERIFIED') {
        return 'Step 3 will unlock after HR Admin verifies your documents and issues your official Job Offer Letter.';
      }
      return 'Your documents are verified! Step 3 will unlock as soon as HR Admin releases your formal Job Offer Letter.';
    }
    if (stepNum === 4) {
      return 'Step 4 will unlock after you digitally sign and accept your Job Offer Letter.';
    }
    return '';
  }

  goToStep(stepNum: number): void {
    if (!this.canAccessStep(stepNum)) {
      this.messageService.add({
        severity: 'info',
        summary: `Step ${stepNum} Locked`,
        detail: this.getStepLockReason(stepNum)
      });
      return;
    }
    this.activeStep.set(stepNum);
    if (stepNum === 3 && this.candidateData()?.offer_status === 'OFFER_SENT') {
      setTimeout(() => this.initSignatureCanvas(), 250);
    }
  }

  // Document Lock States:
  // When VERIFIED or OFFER ACCEPTED, documents CANNOT be edited or deleted (READ-ONLY)
  isDocumentsLocked(): boolean {
    const c = this.candidateData();
    if (!c) return false;
    return c.documents_status === 'VERIFIED' || c.offer_status === 'ACCEPTED' || !!c.onboarding_completed;
  }

  isDocumentsUnderReview(): boolean {
    const c = this.candidateData();
    return c?.documents_status === 'SUBMITTED';
  }

  canEditDocuments(): boolean {
    const c = this.candidateData();
    if (!c) return true;
    return c.documents_status === 'PENDING_UPLOAD' || c.documents_status === 'REJECTED';
  }

  // Signature Option 2: Upload Image handler
  onSignatureFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.messageService.add({
        severity: 'error',
        summary: 'File Too Large',
        detail: 'Signature image must be under 5MB'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.uploadedSignatureUrl.set(reader.result as string);
      this.uploadedSignatureFileName.set(file.name);
      this.messageService.add({
        severity: 'success',
        summary: 'Signature Attached',
        detail: 'Signature image uploaded successfully'
      });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  removeUploadedSignature(): void {
    this.uploadedSignatureUrl.set(null);
    this.uploadedSignatureFileName.set('');
  }

  hasValidSignature(): boolean {
    if (this.signatureMode() === 'draw') {
      return this.hasSigned;
    }
    if (this.signatureMode() === 'upload') {
      return !!this.uploadedSignatureUrl();
    }
    if (this.signatureMode() === 'type') {
      return this.typedSignatureName().trim().length >= 2;
    }
    return false;
  }

  generateSignatureData(): string {
    if (this.signatureMode() === 'draw') {
      return this.signatureCanvas?.nativeElement.toDataURL('image/png') || '';
    }
    if (this.signatureMode() === 'upload') {
      return this.uploadedSignatureUrl() || '';
    }
    if (this.signatureMode() === 'type') {
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 140;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 500, 140);
        ctx.font = 'italic 34px "Brush Script MT", "Caveat", "Dancing Script", cursive, serif';
        ctx.fillStyle = '#1e3a8a';
        ctx.fillText(this.typedSignatureName().trim(), 35, 75);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(30, 95);
        ctx.lineTo(470, 95);
        ctx.stroke();
        ctx.font = '10px monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`Digitally Verified Acceptance • ${new Date().toLocaleDateString('en-GB')}`, 30, 115);
        return canvas.toDataURL('image/png');
      }
    }
    return '';
  }

  printOfferLetter(): void {
    window.print();
  }

  // Offer Acceptance / Decline
  acceptOffer(): void {
    if (!this.termsAccepted()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Terms & Conditions Required',
        detail: 'Please check the box to agree to the Terms & Conditions before accepting.'
      });
      return;
    }

    if (!this.hasValidSignature()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Signature Required',
        detail: 'Please provide your digital signature using Draw, Upload Image, or Type Name.'
      });
      return;
    }

    const signatureData = this.generateSignatureData();
    if (!signatureData) {
      this.messageService.add({
        severity: 'error',
        summary: 'Signature Error',
        detail: 'Could not generate signature. Please try again.'
      });
      return;
    }

    this.respondingOffer.set(true);

    this.preOnboardingService.respondToOfferByToken(this.token, {
      action: 'ACCEPT',
      signatureData
    }).subscribe({
      next: () => {
        this.respondingOffer.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Offer Accepted! 🎉',
          detail: 'Your signed acceptance has been submitted. HR will finalize your employee profile.'
        });
        this.activeStep.set(4);
        this.loadPortalData();
      },
      error: (err) => {
        this.respondingOffer.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Action Failed',
          detail: err.error?.message || 'Failed to submit acceptance'
        });
      }
    });
  }

  openDeclineDialog(): void {
    this.declineReason = '';
    this.declineDialogVisible = true;
  }

  confirmDecline(): void {
    if (!this.declineReason.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Reason Required',
        detail: 'Please provide a brief reason for declining the offer.'
      });
      return;
    }

    this.respondingOffer.set(true);
    this.preOnboardingService.respondToOfferByToken(this.token, {
      action: 'DECLINE',
      reason: this.declineReason
    }).subscribe({
      next: () => {
        this.respondingOffer.set(false);
        this.declineDialogVisible = false;
        this.messageService.add({
          severity: 'info',
          summary: 'Offer Declined',
          detail: 'Your response has been communicated to HR.'
        });
        this.loadPortalData();
      },
      error: (err) => {
        this.respondingOffer.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Failed',
          detail: err.error?.message || 'Could not decline offer'
        });
      }
    });
  }
}

