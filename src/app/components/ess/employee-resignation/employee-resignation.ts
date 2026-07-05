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

  resignationRecords: any[] = [
    {
      id: 1,
      reason: 'Better Career Opportunity',
      joinAgain: 'Yes',
      referUs: 'Yes',
      lwdPolicy: new Date(2026, 7, 3),
      lwdEmployee: new Date(2026, 7, 3),
      status: 'PENDING',
      remarks: 'Looking for a new professional path. Thank you!',
      createdDate: new Date(2026, 6, 5)
    }
  ];

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
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
    const newRecord = {
      id: this.resignationRecords.length + 1,
      reason: formVal.leavingReason,
      joinAgain: formVal.willJoinAgain,
      referUs: formVal.willRefer,
      lwdPolicy: formVal.lwdPolicy,
      lwdEmployee: formVal.lwdEmployee,
      status: 'PENDING',
      remarks: formVal.remarks,
      createdDate: new Date()
    };

    this.resignationRecords = [newRecord, ...this.resignationRecords];
    this.visible = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Resignation request has been submitted successfully.'
    });
    this.cdr.detectChanges();
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
        this.resignationRecords = this.resignationRecords.map(rec => {
          if (rec.id === id) {
            return { ...rec, status: 'WITHDRAWN' };
          }
          return rec;
        });
        this.messageService.add({
          severity: 'success',
          summary: 'Withdrawn',
          detail: 'Resignation request has been withdrawn successfully.'
        });
        this.cdr.detectChanges();
      }
    });
  }
}
