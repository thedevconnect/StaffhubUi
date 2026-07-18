import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { Breadcrumb } from 'primeng/breadcrumb';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { ResignationService, Resignation } from '../../../shared/services/resignation.service';
import { EmployeeManagementService } from '../../../shared/services/employee-management.service';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-resignation-approvals',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    Breadcrumb,
    TableModule,
    ButtonModule,
    ConfirmDialogModule,
    ToastModule,
    DialogModule,
    FormsModule,
    TextareaModule,
    DatePickerModule,
    SelectModule,
    DrawerModule,
    MenuModule,
    ReactiveFormsModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './resignation-approvals.html',
  styleUrl: './resignation-approvals.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResignationApprovals implements OnInit {
  breadcrumbItems: any[] = [
    { label: 'HR Admin', icon: 'pi pi-home', routerLink: '/hradmin' },
    { label: 'Offboarding', icon: 'pi pi-user-minus' },
    { label: 'Resignation Requests', icon: 'pi pi-check-square' }
  ];

  resignations: Resignation[] = [];
  isLoading = false;
  actionMenuItems: MenuItem[] = [];

  displayDialog = false;
  selectedResignation: Resignation | null = null;
  actionType: 'APPROVED' | 'REJECTED' | 'IN_PROCESS' | null = null;
  hrRemarks = '';

  // Add Resignation State
  displayAddDrawer = false;
  employees: any[] = [];
  resignationForm: FormGroup;
  isSubmitting = false;

  // History Drawer State
  displayHistoryDrawer = false;

  yesNoOptions = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' }
  ];

  constructor(
    private resignationService: ResignationService,
    private employeeManagementService: EmployeeManagementService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.resignationForm = this.fb.group({
      employeeId: [null, Validators.required],
      leavingReason: ['', Validators.required],
      willJoinAgain: ['Yes', Validators.required],
      willRefer: ['Yes', Validators.required],
      lwdEmployee: [null, Validators.required],
      remarks: ['']
    });
  }

  ngOnInit(): void {
    this.loadResignations();
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.employeeManagementService.getEmployees().subscribe({
      next: (data: any[]) => {
        this.employees = data.map(emp => ({
          label: `${emp.first_name} ${emp.last_name} (${emp.employee_code})`,
          value: emp.id
        }));
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load employees' });
      }
    });
  }

  loadResignations(): void {
    this.isLoading = true;
    this.resignationService.getCompanyResignations().subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.resignations = res.data;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load requests' });
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openActionDialog(resignation: Resignation, type: 'APPROVED' | 'REJECTED' | 'IN_PROCESS'): void {
    this.selectedResignation = resignation;
    this.actionType = type;
    this.hrRemarks = '';
    this.displayDialog = true;
  }

  confirmAction(): void {
    if (!this.selectedResignation || !this.actionType) return;

    if (this.actionType === 'REJECTED' && !this.hrRemarks?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Required', detail: 'HR Remarks are required for rejection.' });
      return;
    }

    this.resignationService.updateStatus(this.selectedResignation.id, this.actionType, this.hrRemarks).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Resignation has been ${this.actionType!.toLowerCase()}.`
        });
        this.displayDialog = false;
        this.loadResignations();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update status' });
      }
    });
  }

  getShortfallDays(policyDateInput: any, empDateInput: any): number {
    if (!policyDateInput || !empDateInput) return 0;
    const policyDate = new Date(policyDateInput);
    const empDate = new Date(empDateInput);
    policyDate.setHours(0, 0, 0, 0);
    empDate.setHours(0, 0, 0, 0);
    const diffTime = policyDate.getTime() - empDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  openActionMenu(event: Event, req: Resignation, menu: any): void {
    this.actionMenuItems = [
      {
        label: 'View History & Details',
        icon: 'pi pi-history',
        command: () => this.openHistoryDrawer(req)
      }
    ];

    if (req.status === 'PENDING' || req.status === 'IN_PROCESS') {
      this.actionMenuItems.push(
        {
          label: 'Approve',
          icon: 'pi pi-check',
          command: () => this.openActionDialog(req, 'APPROVED')
        },
        {
          label: 'Reject',
          icon: 'pi pi-times',
          command: () => this.openActionDialog(req, 'REJECTED')
        }
      );

      if (req.status === 'PENDING') {
        this.actionMenuItems.push({
          label: 'Mark In Process',
          icon: 'pi pi-clock',
          command: () => this.openActionDialog(req, 'IN_PROCESS')
        });
      }
    }

    menu.toggle(event);
  }

  openHistoryDrawer(req: Resignation): void {
    this.selectedResignation = req;
    this.hrRemarks = '';
    this.displayHistoryDrawer = true;
  }

  submitHistoryAction(type: 'APPROVED' | 'REJECTED'): void {
    if (!this.hrRemarks || !this.hrRemarks.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'HR Reason/Remarks is required before submitting.' });
      return;
    }
    this.actionType = type;
    this.confirmAction();
    this.displayHistoryDrawer = false;
  }

  openAddDrawer(): void {
    this.resignationForm.reset({
      willJoinAgain: 'Yes',
      willRefer: 'Yes'
    });
    this.displayAddDrawer = true;
  }

  submitResignation(): void {
    if (this.resignationForm.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please fill all required fields.' });
      return;
    }

    this.isSubmitting = true;
    this.resignationService.submitResignation(this.resignationForm.value).subscribe({
      next: (res) => {
        if (res.success) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Resignation submitted successfully' });
          this.displayAddDrawer = false;
          this.loadResignations();
        }
        this.isSubmitting = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to submit resignation' });
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }
}
