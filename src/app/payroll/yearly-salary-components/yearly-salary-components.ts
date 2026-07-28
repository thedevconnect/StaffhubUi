import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
  selector: 'app-yearly-salary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
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
  templateUrl: './yearly-salary-components.html',
  styleUrl: './yearly-salary-components.scss'
})
export class YearlySalary implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  breadcrumbItems = [
    { label: 'Payroll', icon: 'pi pi-home', routerLink: '/payroll' },
    { label: 'Configurations', icon: 'pi pi-cog' },
    { label: 'Yearly Salary Components', icon: 'pi pi-calendar' }
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
    component_type: 'EARNING',
    calculation_type: 'FIXED',
    annual_amount: 0,
    taxable_status: 'TAXABLE',
    status: 'ACTIVE',
    description: ''
  };

  componentTypes = [
    { label: 'Earning / Allowance', value: 'EARNING' },
    { label: 'Annual Bonus', value: 'BONUS' },
    { label: 'Perk / Benefit', value: 'BENEFIT' },
    { label: 'Statutory Fund', value: 'STATUTORY' }
  ];

  calculationTypes = [
    { label: 'Fixed Annual Amount', value: 'FIXED' },
    { label: 'Percentage of Basic', value: 'PERCENTAGE_BASIC' },
    { label: 'Percentage of Gross', value: 'PERCENTAGE_GROSS' }
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

  get totalAnnualPerks(): number {
    return this.componentsList.reduce((acc, item) => acc + (Number(item.annual_amount) || 0), 0);
  }

  loadComponents(): void {
    this.loading = true;
    this.payrollService.getYearlyComponents().subscribe({
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
        console.error('Error loading yearly components:', err);
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load yearly components' });
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
      component_type: 'EARNING',
      calculation_type: 'FIXED',
      annual_amount: 0,
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
      this.payrollService.updateYearlyComponent(this.formData.id, this.formData).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success) {
            this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Yearly component updated successfully.' });
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
      this.payrollService.createYearlyComponent(this.formData).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success) {
            this.messageService.add({ severity: 'success', summary: 'Created', detail: 'New yearly component added.' });
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
      message: `Are you sure you want to delete component "${item.component_name}"?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.payrollService.deleteYearlyComponent(item.id).subscribe({
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
