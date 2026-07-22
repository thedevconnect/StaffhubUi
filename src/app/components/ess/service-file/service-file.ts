import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { Breadcrumb } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

import { DocumentService } from '../../../shared/services/document.service';

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
    DialogModule,
    SelectModule,
    ToastModule,
    ReactiveFormsModule,
    FormsModule,
    FloatLabelModule,
    InputTextModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './service-file.html',
  styleUrl: './service-file.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceFile implements OnInit {
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);
  private documentService = inject(DocumentService);

  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Service File & Documents', icon: 'pi pi-file', routerLink: '/ess/service-file' }
  ];

  activeTab: 'PERSONAL' | 'COMPANY_ISSUED' = 'PERSONAL';
  documents: any[] = [];

  loading = signal(false);
  submitting = signal(false);

  visible = false;
  previewModalVisible = false;

  activePreviewUrl = '';
  activePreviewTitle = '';
  activePreviewType = 'PDF';

  uploadForm!: FormGroup;
  selectedFileName = '';
  selectedFileBase64 = '';
  selectedFileType = 'PDF';
  selectedFileSize = '0 KB';

  categoryOptions = [
    { label: 'My Personal Documents (Aadhaar, PAN, Bank, Education)', value: 'PERSONAL' },
    { label: 'Company Issued Documents (Offer Letter, Policy, Increment)', value: 'COMPANY_ISSUED' }
  ];

  docTypeOptionsMap: { [key: string]: { label: string; value: string }[] } = {
    'PERSONAL': [
      { label: 'Aadhaar Card', value: 'AADHAAR' },
      { label: 'PAN Card', value: 'PAN' },
      { label: 'Bank Passbook / Cheque Copy', value: 'BANK' },
      { label: 'Educational Certificates (Degree / Marksheets)', value: 'EDUCATION' },
      { label: 'Previous Work Experience / Relieving Letters', value: 'EXPERIENCE' },
      { label: 'Other Personal Document', value: 'OTHER' }
    ],
    'COMPANY_ISSUED': [
      { label: 'Offer Letter', value: 'OFFER_LETTER' },
      { label: 'Appointment Letter', value: 'APPOINTMENT_LETTER' },
      { label: 'Appraisal / Salary Revision Letter', value: 'INCREMENT_LETTER' },
      { label: 'Company Policy & NDA Agreement', value: 'POLICY' },
      { label: 'Asset Allocation Record', value: 'ASSET_AGREEMENT' },
      { label: 'Experience / Relieving Certificate', value: 'EXPERIENCE_CERTIFICATE' },
      { label: 'Other Company Document', value: 'OTHER' }
    ]
  };

  currentDocTypes: { label: string; value: string }[] = [];

  ngOnInit(): void {
    this.initForm();
    this.loadDocuments();
  }

  initForm(): void {
    this.uploadForm = this.fb.group({
      docCategory: ['PERSONAL', [Validators.required]],
      docType: ['AADHAAR', [Validators.required]],
      docTitle: ['', [Validators.required, Validators.minLength(2)]],
      docNumber: ['']
    });

    this.currentDocTypes = this.docTypeOptionsMap['PERSONAL'];

    this.uploadForm.get('docCategory')?.valueChanges.subscribe((cat: string) => {
      this.currentDocTypes = this.docTypeOptionsMap[cat] || this.docTypeOptionsMap['PERSONAL'];
      if (this.currentDocTypes.length > 0) {
        this.uploadForm.patchValue({ docType: this.currentDocTypes[0].value });
      }
      this.cdr.markForCheck();
    });

    this.uploadForm.get('docType')?.valueChanges.subscribe((type: string) => {
      const typeObj = this.currentDocTypes.find(t => t.value === type);
      if (typeObj && !this.uploadForm.get('docTitle')?.dirty) {
        this.uploadForm.patchValue({ docTitle: typeObj.label }, { emitEvent: false });
      }
      this.cdr.markForCheck();
    });
  }

  setTab(tab: 'PERSONAL' | 'COMPANY_ISSUED'): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  get filteredDocuments(): any[] {
    return this.documents.filter(doc => (doc.doc_category || doc.docCategory || 'PERSONAL') === this.activeTab);
  }

  loadDocuments(): void {
    this.loading.set(true);
    this.documentService.getDocuments().subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.documents = res.data || [];
        }
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching documents:', err);
        this.loading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  openUploadDrawer(category: 'PERSONAL' | 'COMPANY_ISSUED' = 'PERSONAL'): void {
    this.uploadForm.reset({
      docCategory: category,
      docType: category === 'PERSONAL' ? 'AADHAAR' : 'OFFER_LETTER',
      docTitle: category === 'PERSONAL' ? 'Aadhaar Card' : 'Offer Letter',
      docNumber: ''
    });
    this.currentDocTypes = this.docTypeOptionsMap[category];
    this.selectedFileName = '';
    this.selectedFileBase64 = '';
    this.selectedFileType = 'PDF';
    this.selectedFileSize = '0 KB';
    this.visible = true;
    this.cdr.markForCheck();
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFileName = file.name;
      this.selectedFileType = file.type.includes('image') ? 'IMAGE' : 'PDF';

      const kb = Math.round(file.size / 1024);
      this.selectedFileSize = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedFileBase64 = e.target.result;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.uploadForm.invalid) {
      this.uploadForm.markAllAsTouched();
      this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill all required document details.' });
      return;
    }

    if (!this.selectedFileBase64) {
      this.messageService.add({ severity: 'warn', summary: 'File Required', detail: 'Please attach a document file (PDF / Image).' });
      return;
    }

    const val = this.uploadForm.value;
    const payload = {
      docCategory: val.docCategory,
      docType: val.docType,
      docTitle: val.docTitle,
      docNumber: val.docNumber || null,
      fileName: this.selectedFileName || `${val.docTitle}.pdf`,
      fileUrl: this.selectedFileBase64,
      fileType: this.selectedFileType,
      fileSize: this.selectedFileSize
    };

    this.submitting.set(true);
    this.documentService.uploadDocument(payload).subscribe({
      next: (res: any) => {
        this.submitting.set(false);
        if (res && res.success) {
          this.messageService.add({ severity: 'success', summary: 'Uploaded', detail: 'Document uploaded successfully!' });
          this.visible = false;
          this.loadDocuments();
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: res?.message || 'Upload failed' });
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submitting.set(false);
        console.error('Upload error:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to upload document' });
        this.cdr.markForCheck();
      }
    });
  }

  previewDocument(doc: any): void {
    const url = doc.file_url || doc.fileUrl;
    if (!url) {
      this.messageService.add({ severity: 'info', summary: 'No File Preview', detail: 'Document file preview is not available.' });
      return;
    }
    this.activePreviewUrl = url;
    this.activePreviewTitle = doc.doc_title || doc.docTitle || 'Document Preview';
    this.activePreviewType = (doc.file_type || doc.fileType || 'PDF').toUpperCase();
    this.previewModalVisible = true;
    this.cdr.markForCheck();
  }

  downloadDocument(doc: any): void {
    const url = doc.file_url || doc.fileUrl;
    if (!url) return;

    const link = document.createElement('a');
    link.href = url;
    link.download = doc.file_name || doc.fileName || `${doc.doc_title || 'document'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  deleteDocument(docId: number): void {
    this.documentService.deleteDocument(docId).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.messageService.add({ severity: 'info', summary: 'Deleted', detail: 'Document deleted.' });
          this.loadDocuments();
        }
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to delete document' });
      }
    });
  }

  getBadgeClass(type: string): string {
    const t = (type || '').toUpperCase();
    if (t === 'AADHAAR' || t === 'PAN' || t === 'BANK') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (t === 'OFFER_LETTER' || t === 'APPOINTMENT_LETTER') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (t === 'POLICY' || t === 'ASSET_AGREEMENT') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
}
