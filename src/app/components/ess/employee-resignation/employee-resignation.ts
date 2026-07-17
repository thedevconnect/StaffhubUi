import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { Breadcrumb } from 'primeng/breadcrumb';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ResignationService } from '../../../shared/services/resignation.service';

@Component({
  selector: 'app-employee-resignation',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    Breadcrumb,
    ReactiveFormsModule,
    FormsModule,
    SelectModule,
    DatePickerModule,
    ToastModule,
    ButtonModule,
    DrawerModule,
    TableModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './employee-resignation.html',
  styleUrl: './employee-resignation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeResignation implements OnInit {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Exit', icon: 'pi pi-sign-out' },
    { label: 'Employee Resignation', icon: 'pi pi-sign-out', routerLink: '/ess/employee-resignation' }
  ];

  visible = false;
  isFormLoading = false;
  resignationForm!: FormGroup;

  leavingReasons = [
    { label: 'Better Career Opportunity', value: 'Better Career Opportunity' },
    { label: 'Personal Reasons', value: 'Personal Reasons' },
    { label: 'Health Issues', value: 'Health Issues' },
    { label: 'Relocation / Family reasons', value: 'Relocation / Family reasons' },
    { label: 'Higher Studies', value: 'Higher Studies' },
    { label: 'Other', value: 'Other' }
  ];

  joinAgainOptions = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' },
    { label: 'May Be', value: 'May Be' }
  ];

  referOptions = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' },
    { label: 'May Be', value: 'May Be' }
  ];

  resignationRecords: any[] = [];

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private resignationService: ResignationService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadMyResignations();
    const lwdDate = new Date();
    lwdDate.setDate(lwdDate.getDate() + 30);

    this.resignationForm = this.fb.group({
      leavingReason: [null, Validators.required],
      willJoinAgain: [null, Validators.required],
      willRefer: [null, Validators.required],
      lwdPolicy: [{ value: lwdDate, disabled: true }],
      lwdEmployee: [lwdDate, Validators.required],
      remarks: ['']
    });
  }

  showDialog(): void {
    const lwdDate = new Date();
    lwdDate.setDate(lwdDate.getDate() + 30);

    this.resignationForm.reset({
      leavingReason: null,
      willJoinAgain: null,
      willRefer: null,
      lwdPolicy: lwdDate,
      lwdEmployee: lwdDate,
      remarks: ''
    });

    this.visible = true;
    this.cdr.detectChanges();
  }

  loadMyResignations(): void {
    this.resignationService.getMyResignations().subscribe({
      next: (res) => {
        if (res && res.success) {
          this.resignationRecords = res.data.map((r: any) => ({
            id: r.id,
            reason: r.reason,
            joinAgain: r.join_again,
            referUs: r.refer_us,
            lwdPolicy: new Date(r.lwd_policy),
            lwdEmployee: new Date(r.lwd_employee),
            status: r.status,
            remarks: r.remarks,
            hrRemarks: r.hr_remarks,
            createdDate: new Date(r.created_at)
          }));
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load resignations' });
      }
    });
  }

  onDrawerHide(): void {
    this.visible = false;
  }

  onSubmit(): void {
    if (this.resignationForm.invalid) {
      this.resignationForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill all required fields.'
      });
      return;
    }

    const formVal = this.resignationForm.getRawValue();
    const payload = {
      leavingReason: formVal.leavingReason,
      willJoinAgain: formVal.willJoinAgain,
      willRefer: formVal.willRefer,
      lwdPolicy: formVal.lwdPolicy,
      lwdEmployee: formVal.lwdEmployee,
      remarks: formVal.remarks
    };

    this.resignationService.submitResignation(payload).subscribe({
      next: (res) => {
        this.visible = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Resignation request has been submitted successfully.'
        });
        this.loadMyResignations();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to submit resignation request.'
        });
      }
    });
  }

  onWithdraw(id: number, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure you want to withdraw this resignation request?',
      header: 'Confirm Withdrawal',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'No', severity: 'secondary', outlined: true },
      acceptButtonProps: { label: 'Yes' },
      accept: () => {
        this.resignationService.withdrawResignation(id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Withdrawn',
              detail: 'Resignation request has been withdrawn successfully.'
            });
            this.loadMyResignations();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to withdraw resignation request.'
            });
          }
        });
      }
    });
  }
}
