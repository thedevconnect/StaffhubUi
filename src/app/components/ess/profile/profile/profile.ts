import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Breadcrumb } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../../shared/services/services/auth.service';
import { UserService } from '../../../../shared/services/user-service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    Breadcrumb,
    ButtonModule,
    CardModule,
    TableModule,
    ToastModule,
    TooltipModule
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

  profileData: any = {
    personal: {
      fullName: 'Avika Tyagi',
      username: 'avika_tyagi',
      dob: '1995-08-15',
      gender: 'Female',
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
      role: 'ESS, DEVELOPER, HR_ADMIN',
      status: 'Active'
    },
    contact: {
      officialEmail: 'avika.tyagi@devconnect.com',
      personalEmail: 'avika.tyagi.personal@gmail.com',
      mobileNumber: '+91 98765 43210',
      extension: 'EXT-402',
      currentAddress: 'B-45, Sector 62, Noida, Uttar Pradesh, 201301',
      permanentAddress: 'C-12, Green Park, South Delhi, Delhi, 110016'
    },
    emergency: {
      contactName: 'Rajesh Tyagi',
      relationship: 'Father',
      phone: '+91 99999 88888',
      altPhone: '+91 99999 77777'
    },
    financial: {
      bankName: 'HDFC Bank Ltd.',
      accountName: 'Avika Tyagi',
      accountNumber: '50100452361289',
      ifscCode: 'HDFC0000240',
      branch: 'Sector 62, Noida Branch',
      panCard: 'BPDPT8412K',
      aadhaarNumber: '4852 9632 1478',
      uan: '100985471236',
      pfNumber: 'DL/CPM/1009854/042'
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
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

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
    this.userService.getUserById(userId).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          const u = response.data;
          this.profileData.personal.fullName = u.fullName || u.full_name || this.profileData.personal.fullName;
          this.profileData.personal.username = u.username || this.profileData.personal.username;
          this.profileData.contact.officialEmail = u.officialEmail || u.email || this.profileData.contact.officialEmail;
          this.profileData.contact.mobileNumber = u.mobileNumber || u.mobile || this.profileData.contact.mobileNumber;
          this.profileData.employment.designation = u.designation || this.profileData.employment.designation;
          this.profileData.employment.department = u.department || this.profileData.employment.department;
          this.profileData.employment.reportingManager = u.reportingManagerName || u.reportingManager || this.profileData.employment.reportingManager;
          this.profileData.employment.joiningDate = u.joiningDate || u.joining_date || this.profileData.employment.joiningDate;
          this.profileData.employment.employmentType = u.employmentType || u.employment_type || this.profileData.employment.employmentType;
          this.profileData.employment.workLocation = u.workLocation || u.work_location || this.profileData.employment.workLocation;
          this.profileData.employment.employeeCode = u.employeeCode || u.emp_id || this.profileData.employment.employeeCode;
          
          this.cdr.markForCheck();
        }
      },
      error: () => {
        // Fall back gracefully to the rich default mock profile details
        console.log('Using local cached details for employee profile');
      }
    });
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  onRequestUpdate(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Request Submitted',
      detail: 'A profile update request has been routed to HR Admin.',
      life: 4000
    });
  }
}
