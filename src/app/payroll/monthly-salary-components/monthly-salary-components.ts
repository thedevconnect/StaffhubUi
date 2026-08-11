import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PayrollService } from '../../shared/services/payroll.service';

@Component({
  selector: 'app-monthly-salary-components',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbModule,
    ButtonModule,
    TableModule,
    ToastModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './monthly-salary-components.html',
  styleUrl: './monthly-salary-components.scss'
})
export class MonthlySalaryComponents implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  breadcrumbItems = [
    { label: 'Payroll', icon: 'pi pi-home', routerLink: '/payroll' },
    { label: 'Configurations', icon: 'pi pi-cog' },
    { label: 'Monthly Salary Components', icon: 'pi pi-sliders-h' }
  ];

  componentsList: any[] = [];
  loading: boolean = false;

  displayDialog: boolean = false;
  isEditMode: boolean = false;
  saving: boolean = false;

  formData: any = {
    id: null,
    component_name: '',
    component_code: '',
    component_type: 'ALLOWANCE',
    calculation_type: 'FIXED',
    monthly_amount: 0,
    taxable_status: 'TAXABLE',
    status: 'ACTIVE',
    description: ''
  };

  componentTypes = [
    { label: 'Monthly Allowance', value: 'ALLOWANCE' },
    { label: 'Basic Salary Component', value: 'EARNING' },
    { label: 'Perk / Benefit', value: 'BENEFIT' },
    { label: 'Reimbursement Claim', value: 'REIMBURSEMENT' }
  ];

  calculationTypes = [
    { label: 'Fixed Monthly Amount (₹)', value: 'FIXED' },
    { label: 'Percentage of Basic (%)', value: 'PERCENTAGE_BASIC' }
  ];

  taxableOptions = [
    { label: 'Fully Taxable', value: 'TAXABLE' },
    { label: 'Fully Tax Exempt', value: 'EXEMPT' },
    { label: 'Partially Exempt', value: 'PARTIALLY_EXEMPT' }
  ];

  statusOptions = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' }
  ];

  constructor(
    private payrollService: PayrollService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.loadComponents();
  }

  get totalMonthlyAllowances(): number {
    return this.componentsList.reduce((acc, item) => acc + (Number(item.monthly_amount) || 0), 0);
  }

  loadComponents(): void {
    this.loading = true;
    this.payrollService.getMonthlyComponents().subscribe({
      next: (res) => {
        if (res.success) {
          this.componentsList = res.data || [];
        } else {
          this.componentsList = [];
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading monthly components:', err);
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load monthly components' });
        this.cdr.markForCheck();
      }
    });
  }

  openNewDialog(): void {
    this.isEditMode = false;
    this.formData = {
      id: null,
      component_name: '',
      component_code: '',
      component_type: 'ALLOWANCE',
      calculation_type: 'FIXED',
      monthly_amount: 0,
      taxable_status: 'TAXABLE',
      status: 'ACTIVE',
      description: ''
    };
    this.displayDialog = true;
  }

  editComponent(item: any): void {
    this.isEditMode = true;
    this.formData = { ...item };
    this.displayDialog = true;
  }

  saveComponent(): void {
    if (!this.formData.component_name || !this.formData.component_code) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please provide component name & code.' });
      return;
    }

    this.saving = true;
    if (this.isEditMode && this.formData.id) {
      this.payrollService.updateMonthlyComponent(this.formData.id, this.formData).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success) {
            this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Monthly component updated.' });
            this.displayDialog = false;
            this.loadComponents();
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.saving = false;
          console.error(err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update component' });
          this.cdr.markForCheck();
        }
      });
    } else {
      this.payrollService.createMonthlyComponent(this.formData).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success) {
            this.messageService.add({ severity: 'success', summary: 'Created', detail: 'New monthly component added.' });
            this.displayDialog = false;
            this.loadComponents();
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.saving = false;
          console.error(err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create component' });
          this.cdr.markForCheck();
        }
      });
    }
  }

  confirmDelete(item: any): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete monthly component "${item.component_name}"?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.payrollService.deleteMonthlyComponent(item.id).subscribe({
          next: (res) => {
            if (res.success) {
              this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Component deleted.' });
              this.loadComponents();
            }
          },
          error: (err) => {
            console.error(err);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete component' });
          }
        });
      }
    });
  }
}
