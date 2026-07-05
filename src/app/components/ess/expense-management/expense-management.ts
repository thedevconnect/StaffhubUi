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
import { MessageService } from 'primeng/api';

interface DetailRow {
  type: string;
  travelBy: string;
  from: string;
  to: string;
  fromDate: Date;
  toDate: Date;
  amount: number;
  details: string;
  attachmentName?: string;
}

@Component({
  selector: 'app-expense-management',
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
    TableModule
  ],
  providers: [MessageService],
  templateUrl: './expense-management.html',
  styleUrl: './expense-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseManagement implements OnInit {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Expense Requests', icon: 'pi pi-wallet', routerLink: '/ess/expense-management' }
  ];

  drawerVisible = false;
  expenseForm!: FormGroup;
  detailForm!: FormGroup;
  lodgingForm!: FormGroup;
  foodForm!: FormGroup;
  laundryForm!: FormGroup;
  otherForm!: FormGroup;
  
  detailsExpanded = true;
  otherDetailsExpanded = true;
  
  activeTab = 'Fare/Conveyance';
  otherDetailsTabs = ['Fare/Conveyance', 'Lodging', 'Food', 'Laundry', 'Other'];

  requestNumbers = [
    { label: 'REQ-2026-001', value: 'REQ-2026-001' },
    { label: 'REQ-2026-002', value: 'REQ-2026-002' },
    { label: 'REQ-2026-003', value: 'REQ-2026-003' }
  ];

  submitForOptions = [
    { label: 'Tour Reimbursement', value: 'Tour Reimbursement' },
    { label: 'Local Conveyance', value: 'Local Conveyance' },
    { label: 'Client Meeting Exp', value: 'Client Meeting Exp' },
    { label: 'Other Business Expense', value: 'Other Business Expense' }
  ];

  travelByOptions = [
    { label: 'Flight', value: 'Flight' },
    { label: 'Train', value: 'Train' },
    { label: 'Bus', value: 'Bus' },
    { label: 'Taxi / Cab', value: 'Taxi / Cab' },
    { label: 'Own Vehicle', value: 'Own Vehicle' }
  ];

  addedDetails: DetailRow[] = [];
  selectedFileName = '';

  expenseClaims: any[] = [
    {
      id: 1,
      requestNo: 'REQ-2026-001',
      submitFor: 'Tour Reimbursement',
      fromDate: new Date(2026, 6, 1),
      toDate: new Date(2026, 6, 5),
      purpose: 'Client visit to Gurugram office.',
      amount: 18500,
      status: 'PENDING',
      createdDate: new Date(2026, 6, 1)
    }
  ];

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.expenseForm = this.fb.group({
      transferType: ['Self', Validators.required],
      requestNo: [null, Validators.required],
      submitFor: [null, Validators.required],
      name: [{ value: 'Arun Kumar', disabled: true }],
      designation: [{ value: 'Senior Software Developer', disabled: true }],
      fromDate: [null, Validators.required],
      toDate: [null, Validators.required],
      purpose: ['', Validators.required],
      walletAmount: [{ value: '15000', disabled: true }]
    });

    this.detailForm = this.fb.group({
      conveyanceType: ['Fare', Validators.required],
      travelBy: [null, Validators.required],
      travelFrom: ['', Validators.required],
      travelTo: ['', Validators.required],
      fromDate: [null, Validators.required],
      toDate: [null, Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      details: ['']
    });

    this.lodgingForm = this.fb.group({
      hotelName: ['', Validators.required],
      fromDate: [null, Validators.required],
      toDate: [null, Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      details: ['']
    });

    this.foodForm = this.fb.group({
      billNo: [''],
      vendor: ['', Validators.required],
      date: [null, Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      details: ['']
    });

    this.laundryForm = this.fb.group({
      vendor: ['', Validators.required],
      date: [null, Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      details: ['']
    });

    this.otherForm = this.fb.group({
      expenseType: ['', Validators.required],
      date: [null, Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      details: ['']
    });
  }

  showDialog(): void {
    this.expenseForm.reset({
      transferType: 'Self',
      name: 'Arun Kumar',
      designation: 'Senior Software Developer',
      walletAmount: '15000'
    });
    this.detailForm.reset({ conveyanceType: 'Fare' });
    this.lodgingForm.reset();
    this.foodForm.reset();
    this.laundryForm.reset();
    this.otherForm.reset();
    this.addedDetails = [];
    this.selectedFileName = '';
    this.drawerVisible = true;
    this.cdr.detectChanges();
  }

  onDrawerHide(): void {
    this.drawerVisible = false;
  }

  toggleDetails(): void {
    this.detailsExpanded = !this.detailsExpanded;
  }

  toggleOtherDetails(): void {
    this.otherDetailsExpanded = !this.otherDetailsExpanded;
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.selectedFileName = '';
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFileName = file.name;
    }
  }

  addDetail(): void {
    if (this.activeTab === 'Fare/Conveyance') {
      if (this.detailForm.invalid) {
        this.detailForm.markAllAsTouched();
        this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Please fill all required fields.' });
        return;
      }
      const formVal = this.detailForm.value;
      this.addedDetails = [...this.addedDetails, {
        type: 'Conveyance',
        travelBy: formVal.travelBy,
        from: formVal.travelFrom,
        to: formVal.travelTo,
        fromDate: formVal.fromDate,
        toDate: formVal.toDate,
        amount: formVal.amount,
        details: `${formVal.conveyanceType} - ${formVal.details || ''}`,
        attachmentName: this.selectedFileName || undefined
      }];
      this.detailForm.reset({ conveyanceType: 'Fare', travelBy: null, travelFrom: '', travelTo: '', fromDate: null, toDate: null, amount: null, details: '' });
    } else if (this.activeTab === 'Lodging') {
      if (this.lodgingForm.invalid) {
        this.lodgingForm.markAllAsTouched();
        this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Please fill all required fields.' });
        return;
      }
      const formVal = this.lodgingForm.value;
      this.addedDetails = [...this.addedDetails, {
        type: 'Lodging',
        travelBy: formVal.hotelName,
        from: 'N/A',
        to: 'N/A',
        fromDate: formVal.fromDate,
        toDate: formVal.toDate,
        amount: formVal.amount,
        details: formVal.details,
        attachmentName: this.selectedFileName || undefined
      }];
      this.lodgingForm.reset();
    } else if (this.activeTab === 'Food') {
      if (this.foodForm.invalid) {
        this.foodForm.markAllAsTouched();
        this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Please fill all required fields.' });
        return;
      }
      const formVal = this.foodForm.value;
      this.addedDetails = [...this.addedDetails, {
        type: 'Food',
        travelBy: formVal.vendor,
        from: 'N/A',
        to: 'N/A',
        fromDate: formVal.date,
        toDate: formVal.date,
        amount: formVal.amount,
        details: `Bill No: ${formVal.billNo || 'N/A'} - ${formVal.details || ''}`,
        attachmentName: this.selectedFileName || undefined
      }];
      this.foodForm.reset();
    } else if (this.activeTab === 'Laundry') {
      if (this.laundryForm.invalid) {
        this.laundryForm.markAllAsTouched();
        this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Please fill all required fields.' });
        return;
      }
      const formVal = this.laundryForm.value;
      this.addedDetails = [...this.addedDetails, {
        type: 'Laundry',
        travelBy: formVal.vendor,
        from: 'N/A',
        to: 'N/A',
        fromDate: formVal.date,
        toDate: formVal.date,
        amount: formVal.amount,
        details: formVal.details,
        attachmentName: this.selectedFileName || undefined
      }];
      this.laundryForm.reset();
    } else if (this.activeTab === 'Other') {
      if (this.otherForm.invalid) {
        this.otherForm.markAllAsTouched();
        this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Please fill all required fields.' });
        return;
      }
      const formVal = this.otherForm.value;
      this.addedDetails = [...this.addedDetails, {
        type: 'Other',
        travelBy: formVal.expenseType,
        from: 'N/A',
        to: 'N/A',
        fromDate: formVal.date,
        toDate: formVal.date,
        amount: formVal.amount,
        details: formVal.details,
        attachmentName: this.selectedFileName || undefined
      }];
      this.otherForm.reset();
    }

    this.selectedFileName = '';
    this.messageService.add({
      severity: 'success',
      summary: 'Added',
      detail: 'Expense item added to list.'
    });
    this.cdr.detectChanges();
  }

  removeDetail(index: number): void {
    this.addedDetails = this.addedDetails.filter((_, idx) => idx !== index);
    this.messageService.add({
      severity: 'info',
      summary: 'Removed',
      detail: 'Expense item removed.'
    });
    this.cdr.detectChanges();
  }

  onSaveDraft(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Draft Saved',
      detail: 'Expense claim saved as draft.'
    });
  }

  onSubmit(): void {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill all required master details.'
      });
      return;
    }

    if (this.addedDetails.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Details Added',
        detail: 'Please add at least one expense detail item.'
      });
      return;
    }

    const masterVal = this.expenseForm.getRawValue();
    const totalAmount = this.addedDetails.reduce((sum, item) => sum + item.amount, 0);

    const newClaim = {
      id: this.expenseClaims.length + 1,
      requestNo: masterVal.requestNo,
      submitFor: masterVal.submitFor,
      fromDate: masterVal.fromDate,
      toDate: masterVal.toDate,
      purpose: masterVal.purpose,
      amount: totalAmount,
      status: 'PENDING',
      createdDate: new Date()
    };

    this.expenseClaims = [newClaim, ...this.expenseClaims];
    this.drawerVisible = false;

    this.messageService.add({
      severity: 'success',
      summary: 'Claim Submitted',
      detail: 'Tour Reimbursement request submitted successfully.'
    });
    this.cdr.detectChanges();
  }

  onClose(): void {
    this.drawerVisible = false;
  }
}
