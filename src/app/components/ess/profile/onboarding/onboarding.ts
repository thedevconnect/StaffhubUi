import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Breadcrumb } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DrawerModule } from 'primeng/drawer';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../../shared/services/services/auth.service';
import { UserService } from '../../../../shared/services/user-service';
import { EmployeeManagementService } from '../../../../shared/services/employee-management.service';
import { EmployeeOnboardingService } from '../../../../shared/services/employee-onboarding.service';

export interface QualificationDoc {
  id: string;
  docType: string;
  title: string;
  passingYear: string;
  marksObtained: string;
  totalMarks: string;
  percentage: string;
  fileUrl: string;
  fileName: string;
  uploadedAt: string | null;
  status?: string;
  approvedBy?: string;
  approvedAt?: string;
  isLocked?: boolean;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    Breadcrumb,
    ButtonModule,
    CardModule,
    TableModule,
    ToastModule,
    TooltipModule,
    DrawerModule,
    SelectModule,
    DatePickerModule,
    InputTextModule,
    DialogModule,
    TagModule
  ],
  providers: [MessageService],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Onboarding implements OnInit {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Onboarding', icon: 'pi pi-id-card', routerLink: '/ess/onboarding' }
  ];

  activeTab: string = 'details';
  onboardingStatus: string = 'NOT_STARTED'; // NOT_STARTED, PENDING, COMPLETED, APPROVED, REJECTED
  rejectionRemarks: string = '';
  approvedBy: string = '';
  approvedAt: string = '';
  showDrawer: boolean = false;
  showWelcomeVideoModal: boolean = false;
  onboardingForm: FormGroup;

  openWelcomeVideo(): void {
    this.showWelcomeVideoModal = true;
    this.cdr.markForCheck();
  }
  employeeId: string | number | null = null;
  companyId: string | number | null = null;
  loading: boolean = false;
  isFullScreen: boolean = false;

  // Bank Proof Photo
  bankProofPhotoUrl: string | null = null;

  // Documents Upload State
  documentsList: QualificationDoc[] = [];
  editingDocId: string | null = null;

  // Document Input Form State
  docForm = {
    docType: '10th',
    customDocTitle: '',
    passingYear: '',
    marksObtained: '',
    totalMarks: '',
    percentage: '',
    fileUrl: '',
    fileName: ''
  };

  previewDocUrl: string | null = null;
  previewDocTitle: string = '';
  showDocPreviewModal: boolean = false;

  docTypeOptions = [
    { label: '10th Marksheet / Certificate', value: '10th' },
    { label: '12th Marksheet / Certificate', value: '12th' },
    { label: 'Graduation Degree / Marksheet', value: 'Graduation' },
    { label: 'Post Graduation Degree / Marksheet', value: 'Post Graduation' },
    { label: 'ITI Diploma / Certificate', value: 'ITI' },
    { label: 'Other Document', value: 'Other' }
  ];

  toggleFullScreen(): void {
    this.isFullScreen = !this.isFullScreen;
    this.cdr.markForCheck();
  }

  genderOptions = [
    { label: 'Male', value: 'MALE' },
    { label: 'Female', value: 'FEMALE' },
    { label: 'Other', value: 'OTHER' }
  ];

  bloodGroupOptions = [
    { label: 'A+', value: 'A+' },
    { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' },
    { label: 'B-', value: 'B-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB-', value: 'AB-' },
    { label: 'O+', value: 'O+' },
    { label: 'O-', value: 'O-' }
  ];

  profileData: any = {
    personal: {
      fullName: 'Avika Tyagi',
      username: 'avika_tyagi',
      dob: null,
      gender: 'MALE',
      fatherName: '',
      motherName: '',
      maritalStatus: 'Single',
      nationality: 'Indian',
      avatarUrl: 'assets/img/hrms logo.jpg'
    },
    employment: {
      employeeCode: 'EMP-2026-042',
      designation: 'Software Engineer',
      department: 'Technology & Engineering',
      reportingManager: 'Sam Multi',
      joiningDate: '2025-05-13',
      employmentType: 'Full-Time',
      workLocation: 'Noida Office',
      role: 'ESS',
      status: 'Active'
    },
    contact: {
      officialEmail: 'avika.tyagi@devconnect.com',
      personalEmail: '',
      mobileNumber: '',
      extension: 'EXT-402',
      currentAddress: '',
      permanentAddress: ''
    },
    emergency: {
      contactName: '',
      relationship: '',
      phone: '',
      altPhone: ''
    },
    financial: {
      bankName: '',
      accountName: '',
      accountNumber: '',
      ifscCode: '',
      branch: '',
      panCard: '',
      aadhaarNumber: '',
      uan: '',
      pfNumber: ''
    }
  };

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private employeeManagementService: EmployeeManagementService,
    private employeeOnboardingService: EmployeeOnboardingService,
    private messageService: MessageService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.onboardingForm = this.fb.group({
      employee_name: [{ value: '', disabled: true }],
      father_name: [''],
      mother_name: [''],
      dob: [null],
      gender: ['MALE'],
      blood_group: [''],
      marital_status: [''],
      personal_email: ['', Validators.email],
      alternate_mobile: [''],
      profile_photo: [''],
      current_address: [''],
      permanent_address: [''],
      emergency_contact_name: [''],
      emergency_contact: [''],
      emergency_contact_relation: [''],
      bank_name: [''],
      account_holder_name: [''],
      account_number: [''],
      ifsc_code: [''],
      pan_number: [''],
      aadhar_number: ['']
    });
  }

  ngOnInit(): void {
    const currentUser = this.authService.user();
    if (currentUser) {
      this.profileData.personal.fullName = currentUser.employeeName || currentUser.username || this.profileData.personal.fullName;
      this.profileData.personal.username = currentUser.username || this.profileData.personal.username;

      if (currentUser.roles && currentUser.roles.length) {
        this.profileData.employment.role = currentUser.roles.map(r => r.rolDes).join(', ');
      }

      this.loadUserDetails(currentUser.id);
    }
  }

  loadUserDetails(userId: string | number): void {
    this.employeeManagementService.getEmployeeById(userId).subscribe({
      next: (emp: any) => {
        if (emp) {
          this.employeeId = emp.employeeId || emp.id;
          this.companyId = emp.companyId || emp.company_id || 15;

          this.profileData.personal.fullName = emp.fullName || emp.full_name || emp.employeeName || emp.name || this.profileData.personal.fullName;
          this.profileData.personal.username = emp.username || this.profileData.personal.username;
          if (emp.dob || emp.dateOfBirth) {
            this.profileData.personal.dob = emp.dob || emp.dateOfBirth;
          }
          if (emp.gender) {
            this.profileData.personal.gender = emp.gender;
          }
          if (emp.fatherName || emp.father_name) {
            this.profileData.personal.fatherName = emp.fatherName || emp.father_name;
          }
          if (emp.motherName || emp.mother_name) {
            this.profileData.personal.motherName = emp.motherName || emp.mother_name;
          }
          if (emp.maritalStatus || emp.marital_status) {
            this.profileData.personal.maritalStatus = emp.maritalStatus || emp.marital_status;
          }

          this.profileData.contact.officialEmail = emp.officialEmail || emp.email || this.profileData.contact.officialEmail;
          if (emp.personalEmail || emp.personal_email) {
            this.profileData.contact.personalEmail = emp.personalEmail || emp.personal_email;
          }
          this.profileData.contact.mobileNumber = emp.mobileNumber || emp.mobile || emp.phone || this.profileData.contact.mobileNumber;
          if (emp.alternateMobile || emp.alternate_mobile) {
            this.profileData.contact.altPhone = emp.alternateMobile || emp.alternate_mobile;
          }
          if (emp.currentAddress || emp.current_address) {
            this.profileData.contact.currentAddress = emp.currentAddress || emp.current_address;
          }
          if (emp.permanentAddress || emp.permanent_address) {
            this.profileData.contact.permanentAddress = emp.permanentAddress || emp.permanent_address;
          }

          this.profileData.employment.designation = emp.designation || this.profileData.employment.designation;
          this.profileData.employment.department = emp.department || this.profileData.employment.department;
          this.profileData.employment.reportingManager = emp.reportingManagerName || emp.reportingManager || this.profileData.employment.reportingManager;
          this.profileData.employment.joiningDate = emp.joiningDate || emp.joining_date || this.profileData.employment.joiningDate;
          this.profileData.employment.employmentType = emp.employmentType || emp.employment_type || this.profileData.employment.employmentType;
          this.profileData.employment.workLocation = emp.workLocation || emp.work_location || this.profileData.employment.workLocation;
          this.profileData.employment.employeeCode = emp.employeeCode || emp.emp_id || emp.code || this.profileData.employment.employeeCode;

          // Pre-fill form with master details
          this.onboardingForm.patchValue({
            employee_name: this.profileData.personal.fullName,
            father_name: this.profileData.personal.fatherName || '',
            mother_name: this.profileData.personal.motherName || '',
            dob: this.profileData.personal.dob ? new Date(this.profileData.personal.dob) : null,
            gender: this.profileData.personal.gender || 'MALE',
            marital_status: this.profileData.personal.maritalStatus || 'Single',
            personal_email: this.profileData.contact.personalEmail || '',
            alternate_mobile: this.profileData.contact.altPhone || '',
            current_address: this.profileData.contact.currentAddress || '',
            permanent_address: this.profileData.contact.permanentAddress || ''
          }, { emitEvent: false });

          if (this.employeeId) {
            this.loadOnboardingRecord(this.employeeId);
          } else {
            this.cdr.markForCheck();
          }
        }
      },
      error: () => {
        this.userService.getUserById(userId).subscribe({
          next: (response: any) => {
            if (response && response.data) {
              const u = response.data;
              this.employeeId = u.id;
              this.companyId = u.company_id || 15;
              this.profileData.personal.fullName = u.fullName || u.full_name || this.profileData.personal.fullName;
              this.profileData.personal.username = u.username || this.profileData.personal.username;
              this.profileData.contact.officialEmail = u.officialEmail || u.email || this.profileData.contact.officialEmail;
              this.profileData.contact.mobileNumber = u.mobileNumber || u.mobile || this.profileData.contact.mobileNumber;
              this.cdr.markForCheck();
            }
          }
        });
      }
    });
  }

  loadOnboardingRecord(employeeId: string | number): void {
    this.employeeOnboardingService.getOnboardingByEmployeeId(employeeId).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          const rec = res.data;

          if (rec.verification_status === 'APPROVED') {
            this.onboardingStatus = 'APPROVED';
            this.approvedBy = rec.approved_by || 'HR Admin';
            this.approvedAt = rec.approved_at ? new Date(rec.approved_at).toLocaleDateString('en-GB') : 'Approved';
          } else if (rec.verification_status === 'REJECTED') {
            this.onboardingStatus = 'REJECTED';
            this.rejectionRemarks = rec.remarks || 'No remarks provided.';
          } else if (rec.profile_status === 'COMPLETED') {
            this.onboardingStatus = 'PENDING';
          } else {
            this.onboardingStatus = 'NOT_STARTED';
          }

          // Map to profileData
          this.profileData.personal.fatherName = rec.father_name;
          this.profileData.personal.motherName = rec.mother_name;
          this.profileData.personal.dob = rec.dob;
          this.profileData.personal.gender = rec.gender;
          this.profileData.personal.bloodGroup = rec.blood_group;
          this.profileData.personal.maritalStatus = rec.marital_status || this.profileData.personal.maritalStatus;
          this.profileData.contact.personalEmail = rec.personal_email || this.profileData.contact.personalEmail;
          this.profileData.contact.altPhone = rec.alternate_mobile || this.profileData.contact.altPhone;
          this.profileData.contact.currentAddress = rec.current_address;
          this.profileData.contact.permanentAddress = rec.permanent_address;
          this.profileData.emergency.contactName = rec.emergency_contact_name;
          this.profileData.emergency.phone = rec.emergency_contact;
          this.profileData.emergency.relationship = rec.emergency_contact_relation;
          this.profileData.financial.bankName = rec.bank_name;
          this.profileData.financial.accountName = rec.account_holder_name;
          this.profileData.financial.accountNumber = rec.account_number;
          this.profileData.financial.ifscCode = rec.ifsc_code;
          this.profileData.financial.panCard = rec.pan_number;
          this.profileData.financial.aadhaarNumber = rec.aadhar_number;
          if (rec.profile_photo) {
            this.profileData.personal.avatarUrl = rec.profile_photo;
          }
          if (rec.bank_proof_photo) {
            this.bankProofPhotoUrl = rec.bank_proof_photo;
          }

          // Load documents
          if (rec.documents) {
            const docs = typeof rec.documents === 'string' ? JSON.parse(rec.documents) : rec.documents;
            this.documentsList = Array.isArray(docs) ? docs : [];
          } else {
            this.documentsList = [];
          }

          // Populate Form
          const formVal = {
            employee_name: rec.employee_name || this.profileData.personal.fullName,
            father_name: rec.father_name || '',
            mother_name: rec.mother_name || '',
            dob: rec.dob ? new Date(rec.dob) : null,
            gender: rec.gender || 'MALE',
            blood_group: rec.blood_group || '',
            marital_status: rec.marital_status || '',
            personal_email: rec.personal_email || '',
            alternate_mobile: rec.alternate_mobile || '',
            profile_photo: rec.profile_photo || '',
            current_address: rec.current_address || '',
            permanent_address: rec.permanent_address || '',
            emergency_contact_name: rec.emergency_contact_name || '',
            emergency_contact: rec.emergency_contact || '',
            emergency_contact_relation: rec.emergency_contact_relation || '',
            bank_name: rec.bank_name || '',
            account_holder_name: rec.account_holder_name || '',
            account_number: rec.account_number || '',
            ifsc_code: rec.ifsc_code || '',
            pan_number: rec.pan_number || '',
            aadhar_number: rec.aadhar_number || ''
          };
          this.onboardingForm.patchValue(formVal);

          if (this.onboardingStatus === 'APPROVED') {
            this.onboardingForm.disable();
          } else {
            this.onboardingForm.enable();
          }
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        if (err.status === 404) {
          this.onboardingStatus = 'NOT_STARTED';
          this.onboardingForm.enable();
          this.documentsList = [];
        }
        this.cdr.markForCheck();
      }
    });
  }

  editSection: string = 'all'; // 'personal' | 'contact' | 'emergency' | 'financial' | 'identity' | 'all'

  setTab(tab: string): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  openSectionDrawer(section: string = 'all'): void {
    if (this.onboardingStatus === 'APPROVED') {
      this.messageService.add({
        severity: 'info',
        summary: 'Profile Approved',
        detail: 'Onboarding details have been approved by HR Admin and are locked.',
        life: 3000
      });
      return;
    }
    this.editSection = section;
    this.showDrawer = true;
    this.cdr.markForCheck();
  }

  openOnboardingDrawer(): void {
    this.openSectionDrawer('all');
  }

  getSectionTitle(): string {
    switch (this.editSection) {
      case 'personal': return 'Edit Personal Information';
      case 'contact': return 'Edit Contact & Address';
      case 'emergency': return 'Edit Emergency Contacts';
      case 'financial': return 'Edit Bank Account Information';
      case 'identity': return 'Edit Identity & Statutories';
      default: return 'Edit Onboarding Profile';
    }
  }

  closeDrawer(): void {
    this.showDrawer = false;
    this.cdr.markForCheck();
  }

  onProfilePhotoSelect(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      this.messageService.add({
        severity: 'error',
        summary: 'File Too Large',
        detail: 'Profile photo must be less than 2MB.'
      });
      inputElement.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      this.onboardingForm.patchValue({ profile_photo: base64String });
      this.profileData.personal.avatarUrl = base64String;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  onBankProofSelect(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.messageService.add({
        severity: 'warn',
        summary: 'File Too Large',
        detail: 'Bank passbook/cheque photo must be smaller than 5MB.'
      });
      inputElement.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.bankProofPhotoUrl = reader.result as string;
      this.messageService.add({
        severity: 'success',
        summary: 'Bank Proof Uploaded',
        detail: 'Bank Passbook / Cheque photo attached.'
      });
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  onDocFormFileSelect(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.messageService.add({
        severity: 'warn',
        summary: 'File Too Large',
        detail: 'Document file size must be less than 5MB.'
      });
      inputElement.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.docForm.fileUrl = reader.result as string;
      this.docForm.fileName = file.name;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  calculatePercentage(): void {
    const obtained = parseFloat(this.docForm.marksObtained);
    const total = parseFloat(this.docForm.totalMarks);
    if (!isNaN(obtained) && !isNaN(total) && total > 0) {
      const pct = ((obtained / total) * 100).toFixed(2);
      this.docForm.percentage = `${pct}%`;
    }
    this.cdr.markForCheck();
  }

  addOrUpdateDocument(): void {
    const title = this.docForm.docType === 'Other' ? this.docForm.customDocTitle.trim() : this.getDocTypeLabel(this.docForm.docType);

    if (!title) {
      this.messageService.add({ severity: 'warn', summary: 'Missing Title', detail: 'Please provide document title.' });
      return;
    }

    if (!this.docForm.fileUrl && !this.editingDocId) {
      this.messageService.add({ severity: 'warn', summary: 'File Required', detail: 'Please upload a document file/photo.' });
      return;
    }

    if (this.editingDocId) {
      const target = this.documentsList.find(d => d.id === this.editingDocId);
      if (target) {
        target.docType = this.docForm.docType;
        target.title = title;
        target.passingYear = this.docForm.passingYear;
        target.marksObtained = this.docForm.marksObtained;
        target.totalMarks = this.docForm.totalMarks;
        target.percentage = this.docForm.percentage;
        if (this.docForm.fileUrl) {
          target.fileUrl = this.docForm.fileUrl;
          target.fileName = this.docForm.fileName;
        }
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Document updated successfully.' });
      }
      this.editingDocId = null;
    } else {
      const newDoc: QualificationDoc = {
        id: 'doc_' + Date.now(),
        docType: this.docForm.docType,
        title: title,
        passingYear: this.docForm.passingYear,
        marksObtained: this.docForm.marksObtained,
        totalMarks: this.docForm.totalMarks,
        percentage: this.docForm.percentage,
        fileUrl: this.docForm.fileUrl,
        fileName: this.docForm.fileName || title,
        uploadedAt: new Date().toLocaleDateString('en-GB'),
        status: 'PENDING',
        isLocked: false
      };
      this.documentsList.push(newDoc);
      this.messageService.add({ severity: 'success', summary: 'Added', detail: `${title} added to list.` });
    }

    this.resetDocForm();
    this.cdr.markForCheck();
  }

  editDocument(doc: QualificationDoc): void {
    if (this.onboardingStatus === 'APPROVED' && doc.status === 'APPROVED') {
      this.messageService.add({ severity: 'info', summary: 'Locked', detail: 'Approved document cannot be edited.' });
      return;
    }
    this.editingDocId = doc.id;
    this.docForm = {
      docType: doc.docType,
      customDocTitle: doc.docType === 'Other' ? doc.title : '',
      passingYear: doc.passingYear || '',
      marksObtained: doc.marksObtained || '',
      totalMarks: doc.totalMarks || '',
      percentage: doc.percentage || '',
      fileUrl: doc.fileUrl || '',
      fileName: doc.fileName || ''
    };
    this.cdr.markForCheck();
  }

  deleteDocument(docId: string): void {
    const target = this.documentsList.find(d => d.id === docId);
    if (this.onboardingStatus === 'APPROVED' && target?.status === 'APPROVED') {
      this.messageService.add({ severity: 'info', summary: 'Locked', detail: 'Approved document cannot be deleted.' });
      return;
    }
    this.documentsList = this.documentsList.filter(d => d.id !== docId);
    this.messageService.add({ severity: 'info', summary: 'Removed', detail: 'Document removed from list.' });
    this.cdr.markForCheck();
  }

  resetDocForm(): void {
    this.editingDocId = null;
    this.docForm = {
      docType: '10th',
      customDocTitle: '',
      passingYear: '',
      marksObtained: '',
      totalMarks: '',
      percentage: '',
      fileUrl: '',
      fileName: ''
    };
    this.cdr.markForCheck();
  }

  getDocTypeLabel(val: string): string {
    const match = this.docTypeOptions.find(o => o.value === val);
    return match ? match.label : val;
  }

  viewDocument(doc: any): void {
    if (!doc || !doc.fileUrl) return;
    this.previewDocUrl = doc.fileUrl;
    this.previewDocTitle = doc.title || 'Document Preview';
    this.showDocPreviewModal = true;
    this.cdr.markForCheck();
  }

  submitOnboarding(): void {
    if (this.onboardingForm.invalid) {
      this.onboardingForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill all required fields correctly.'
      });
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    const formRaw = this.onboardingForm.getRawValue();
    let formattedDob = formRaw.dob;
    if (formattedDob instanceof Date) {
      formattedDob = formattedDob.toISOString().split('T')[0];
    }

    const payload = {
      ...formRaw,
      dob: formattedDob,
      employee_id: this.employeeId,
      company_id: this.companyId || 15,
      bank_proof_photo: this.bankProofPhotoUrl,
      documents: this.documentsList,
      profile_status: 'COMPLETED',
      verification_status: 'PENDING'
    };

    if (this.onboardingStatus === 'NOT_STARTED') {
      this.employeeOnboardingService.createOnboarding(payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Onboarding Submitted',
            detail: 'Your onboarding details, bank proof, and educational documents have been submitted to HR Admin for approval.',
            life: 4000
          });
          this.showDrawer = false;
          this.loading = false;
          if (this.employeeId) {
            this.loadOnboardingRecord(this.employeeId);
          }
        },
        error: (err) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Submission Failed',
            detail: err.error?.message || 'Failed to submit onboarding details.'
          });
          this.cdr.markForCheck();
        }
      });
    } else {
      this.employeeOnboardingService.updateOnboarding(this.employeeId!, payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Onboarding Updated',
            detail: 'Your details and documents have been updated and submitted for approval.',
            life: 4000
          });
          this.showDrawer = false;
          this.loading = false;
          this.loadOnboardingRecord(this.employeeId!);
        },
        error: (err) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: err.error?.message || 'Failed to update onboarding details.'
          });
          this.cdr.markForCheck();
        }
      });
    }
  }

  onRequestUpdate(): void {
    this.openOnboardingDrawer();
  }

  onAvatarError(event: any): void {
    if (event?.target) {
      event.target.src = 'assets/img/hrms logo.jpg';
    }
  }
}
