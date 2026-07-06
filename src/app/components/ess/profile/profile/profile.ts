import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../../shared/services/services/auth.service';
import { UserService } from '../../../../shared/services/user-service';
import { EmployeeManagementService } from '../../../../shared/services/employee-management.service';
import { EmployeeOnboardingService } from '../../../../shared/services/employee-onboarding.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Breadcrumb,
    ButtonModule,
    CardModule,
    TableModule,
    ToastModule,
    TooltipModule,
    DrawerModule,
    SelectModule,
    DatePickerModule,
    InputTextModule
  ],
  providers: [MessageService],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile implements OnInit {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Profile', icon: 'pi pi-user', routerLink: '/ess/profile' }
  ];

  activeTab: string = 'details';
  onboardingStatus: string = 'NOT_STARTED'; // NOT_STARTED, PENDING, COMPLETED, REJECTED
  showDrawer: boolean = false;
  onboardingForm: FormGroup;
  employeeId: string | number | null = null;
  companyId: string | number | null = null;
  loading: boolean = false;

  genderOptions = [
    { label: 'Male', value: 'MALE' },
    { label: 'Female', value: 'FEMALE' },
    { label: 'Other', value: 'OTHER' }
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
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
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
    },
    assets: [
      { id: 'AST-940', name: 'MacBook Pro 16"', type: 'Laptop', serial: 'C02FG123Q05D', assignedDate: '2025-05-14', status: 'In Use' },
      { id: 'AST-284', name: 'Dell 27" UltraSharp Monitor', type: 'Display', serial: 'MX-084W1-593B', assignedDate: '2025-05-14', status: 'In Use' },
      { id: 'AST-105', name: 'Logitech MX Keys Keyboard', type: 'Input Device', serial: '2103LZ940B', assignedDate: '2025-06-01', status: 'In Use' }
    ],
    leaves: {
      annualTotal: 18,
      annualConsumed: 4,
      annualBalance: 14,
      sickTotal: 12,
      sickConsumed: 2,
      sickBalance: 10,
      shortLeaveCount: 2,
      regularizations: 1
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
      father_name: ['', Validators.required],
      mother_name: [''],
      dob: [null, Validators.required],
      gender: ['MALE', Validators.required],
      blood_group: [''],
      profile_photo: [''],
      current_address: ['', Validators.required],
      permanent_address: [''],
      emergency_contact_name: [''],
      emergency_contact: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      emergency_contact_relation: [''],
      bank_name: ['', Validators.required],
      account_holder_name: ['', Validators.required],
      account_number: ['', Validators.required],
      ifsc_code: ['', Validators.required],
      pan_number: ['', [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i)]],
      aadhar_number: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]]
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
          
          this.profileData.personal.fullName = emp.fullName || emp.full_name || this.profileData.personal.fullName;
          this.profileData.personal.username = emp.username || this.profileData.personal.username;
          this.profileData.contact.officialEmail = emp.officialEmail || emp.email || this.profileData.contact.officialEmail;
          this.profileData.contact.mobileNumber = emp.mobileNumber || emp.mobile || this.profileData.contact.mobileNumber;
          this.profileData.employment.designation = emp.designation || this.profileData.employment.designation;
          this.profileData.employment.department = emp.department || this.profileData.employment.department;
          this.profileData.employment.reportingManager = emp.reportingManagerName || emp.reportingManager || this.profileData.employment.reportingManager;
          this.profileData.employment.joiningDate = emp.joiningDate || emp.joining_date || this.profileData.employment.joiningDate;
          this.profileData.employment.employmentType = emp.employmentType || emp.employment_type || this.profileData.employment.employmentType;
          this.profileData.employment.workLocation = emp.workLocation || emp.work_location || this.profileData.employment.workLocation;
          this.profileData.employment.employeeCode = emp.employeeCode || emp.emp_id || this.profileData.employment.employeeCode;
          
          if (this.employeeId) {
            this.loadOnboardingRecord(this.employeeId);
          } else {
            this.cdr.markForCheck();
          }
        }
      },
      error: () => {
        // Fall back to old userService just in case
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
          this.onboardingStatus = rec.profile_status || 'PENDING';
          
          // Map to profileData
          this.profileData.personal.fatherName = rec.father_name;
          this.profileData.personal.motherName = rec.mother_name;
          this.profileData.personal.dob = rec.dob;
          this.profileData.personal.gender = rec.gender;
          this.profileData.personal.bloodGroup = rec.blood_group;
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

          // Populate Form
          const formVal = {
            father_name: rec.father_name || '',
            mother_name: rec.mother_name || '',
            dob: rec.dob ? new Date(rec.dob) : null,
            gender: rec.gender || 'MALE',
            blood_group: rec.blood_group || '',
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

          if (this.onboardingStatus === 'COMPLETED' || this.onboardingStatus === 'APPROVED') {
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
        }
        this.cdr.markForCheck();
      }
    });
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  openOnboardingDrawer(): void {
    if (this.onboardingStatus === 'COMPLETED' || this.onboardingStatus === 'APPROVED') {
      this.messageService.add({
        severity: 'info',
        summary: 'Profile Locked',
        detail: 'Your onboarding is approved. Profile cannot be edited.',
        life: 3000
      });
      return;
    }
    this.showDrawer = true;
    this.cdr.markForCheck();
  }

  closeDrawer(): void {
    this.showDrawer = false;
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

    const formRaw = this.onboardingForm.value;
    // Format Date to string
    let formattedDob = formRaw.dob;
    if (formattedDob instanceof Date) {
      formattedDob = formattedDob.toISOString().split('T')[0];
    }

    const payload = {
      ...formRaw,
      dob: formattedDob,
      employee_id: this.employeeId,
      company_id: this.companyId || 15,
      profile_status: 'PENDING'
    };

    if (this.onboardingStatus === 'NOT_STARTED') {
      this.employeeOnboardingService.createOnboarding(payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Onboarding Submitted',
            detail: 'Your onboarding details have been submitted to HR Admin for approval.',
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
            detail: 'Your details have been updated and submitted for approval.',
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
}
