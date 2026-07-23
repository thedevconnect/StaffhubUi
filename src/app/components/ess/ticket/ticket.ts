import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppBreadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';

import { TicketService, TicketItem, TicketStats } from '../../../shared/services/ticket.service';
import { EmployeeManagementService } from '../../../shared/services/employee-management.service';
import { MessageService } from 'primeng/api';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';
import { DrawerModule } from 'primeng/drawer';
import { ToastModule } from 'primeng/toast';
import { TextareaModule } from 'primeng/textarea';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';

interface CategoryCard {
  name: 'ADMINISTRATION' | 'HUMAN RESOURCE - CRG' | 'IT HELPDESK';
  label: string;
  description: string;
  icon: string;
  colorClass: string;
  badgeClass: string;
}

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppBreadcrumb,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    MultiSelectModule,
    TagModule,
    DrawerModule,
    ToastModule,
    TextareaModule,
    CardModule,
    BadgeModule
  ],
  providers: [MessageService],
  templateUrl: './ticket.html',
  styleUrl: './ticket.scss',
})
export class Ticket implements OnInit {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Raise Ticket', icon: 'pi pi-ticket', routerLink: '/ess/ticket' }
  ];

  // Restricted strictly to the 3 target categories as requested
  categories: CategoryCard[] = [
    {
      name: 'ADMINISTRATION',
      label: 'ADMINISTRATION',
      description: 'Office admin, seating, stationery, infrastructure, facility requests',
      icon: 'pi pi-building',
      colorClass: 'bg-red-50 text-red-600 border-red-200',
      badgeClass: 'bg-red-100 text-red-700 border-red-300'
    },
    {
      name: 'HUMAN RESOURCE - CRG',
      label: 'HUMAN RESOURCE - CRG',
      description: 'Payroll queries, leave issues, policies, HR documentation & support',
      icon: 'pi pi-users',
      colorClass: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-300'
    },
    {
      name: 'IT HELPDESK',
      label: 'IT HELPDESK',
      description: 'Hardware, software access, email setup, network, laptop & VPN support',
      icon: 'pi pi-desktop',
      colorClass: 'bg-sky-50 text-sky-600 border-sky-200',
      badgeClass: 'bg-sky-100 text-sky-700 border-sky-300'
    }
  ];

  categoryOptions = [
    { label: 'All Categories', value: 'ALL' },
    { label: 'ADMINISTRATION', value: 'ADMINISTRATION' },
    { label: 'HUMAN RESOURCE - CRG', value: 'HUMAN RESOURCE - CRG' },
    { label: 'IT HELPDESK', value: 'IT HELPDESK' }
  ];

  formCategoryOptions = [
    { label: 'ADMINISTRATION', value: 'ADMINISTRATION' },
    { label: 'HUMAN RESOURCE - CRG', value: 'HUMAN RESOURCE - CRG' },
    { label: 'IT HELPDESK', value: 'IT HELPDESK' }
  ];

  priorityOptions = [
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' },
    { label: 'Urgent', value: 'URGENT' }
  ];

  statusOptions = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'Under Process', value: 'UNDER_PROCESS' },
    { label: 'In Review', value: 'IN_REVIEW' },
    { label: 'Resolved', value: 'RESOLVED' },
    { label: 'Closed', value: 'CLOSED' },
    { label: 'Rejected', value: 'REJECTED' }
  ];

  tickets: TicketItem[] = [];
  stats: TicketStats = {
    totalTickets: 0,
    underProcessCount: 0,
    inReviewCount: 0,
    resolvedCount: 0,
    closedCount: 0,
    rejectedCount: 0,
    adminCount: 0,
    hrCount: 0,
    itCount: 0
  };

  employees: { label: string; value: number }[] = [];
  loading = false;
  totalRecords = 0;
  page = 1;
  limit = 10;

  searchQuery = '';
  selectedStatus = 'ALL';
  selectedCategoryFilter = 'ALL';

  // Raise Ticket Drawer State
  showRaiseDrawer = false;
  ticketForm!: FormGroup;
  submitting = false;

  // Workflow / Detail View Drawer State
  showWorkflowDrawer = false;
  selectedTicket: TicketItem | null = null;
  newCommentText = '';

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private employeeService: EmployeeManagementService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadEmployees();
    this.loadStats();
    this.loadTickets();
  }

  initForm(): void {
    this.ticketForm = this.fb.group({
      category: ['HUMAN RESOURCE - CRG', Validators.required],
      subject: ['', [Validators.required, Validators.maxLength(255)]],
      priority: ['MEDIUM', Validators.required],
      cc_employees: [[]],
      remark: ['', [Validators.required, Validators.minLength(5)]] // REMARK IS MANDATORY
    });
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        if (list.length > 0) {
          this.employees = list.map((emp: any) => {
            const name = emp.full_name || emp.fullName || emp.name || `Employee #${emp.id}`;
            const desig = emp.designation || emp.role || 'Employee';
            const empCode = emp.emp_id || emp.employeeCode ? ` (${emp.emp_id || emp.employeeCode})` : '';
            return {
              label: `${name}/${desig}${empCode}`,
              value: emp.id
            };
          });
          this.cdr.markForCheck();
        } else {
          this.loadGlobalEmployees();
        }
      },
      error: (err) => {
        console.error('Error loading employees via EmployeeManagementService:', err);
        this.loadGlobalEmployees();
      }
    });
  }

  loadGlobalEmployees(): void {
    this.employeeService.getGlobalEmployees().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        this.employees = list.map((emp: any) => {
          const name = emp.full_name || emp.fullName || emp.name || `Employee #${emp.id}`;
          const desig = emp.designation || emp.role || 'Employee';
          const empCode = emp.emp_id || emp.employeeCode ? ` (${emp.emp_id || emp.employeeCode})` : '';
          return {
            label: `${name}/${desig}${empCode}`,
            value: emp.id
          };
        });
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error loading global employees:', err)
    });
  }

  loadStats(): void {
    this.ticketService.getTicketStats().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.stats = res.data;
          this.cdr.markForCheck();
        }
      },
      error: (err) => console.error('Error loading ticket stats:', err)
    });
  }

  loadTickets(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.ticketService
      .getTickets({
        search: this.searchQuery,
        status: this.selectedStatus,
        category: this.selectedCategoryFilter,
        page: this.page,
        limit: this.limit
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          if (res.success) {
            this.tickets = res.data || [];
            this.totalRecords = res.pagination?.totalItems || 0;
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'Failed to load tickets'
          });
          this.cdr.markForCheck();
        }
      });
  }

  openRaiseDrawer(categoryName?: 'ADMINISTRATION' | 'HUMAN RESOURCE - CRG' | 'IT HELPDESK'): void {
    this.ticketForm.reset({
      category: categoryName || 'HUMAN RESOURCE - CRG',
      subject: '',
      priority: 'MEDIUM',
      cc_employees: [],
      remark: ''
    });
    this.showRaiseDrawer = true;
  }

  submitTicket(): void {
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Form Validation Error',
        detail: 'Please fill all mandatory fields including Remark.'
      });
      return;
    }

    this.submitting = true;
    const payload = this.ticketForm.value;

    this.ticketService.createTicket(payload).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Ticket Raised Successfully',
            detail: `Ticket ${res.data?.ticket_code} has been created.`
          });
          this.showRaiseDrawer = false;
          this.loadStats();
          this.loadTickets();
          
          // Automatically view the workflow drawer for the newly raised ticket
          if (res.data) {
            this.openWorkflowDrawer(res.data);
          }
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submitting = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Submission Failed',
          detail: err?.error?.message || 'Failed to raise ticket'
        });
        this.cdr.markForCheck();
      }
    });
  }

  openWorkflowDrawer(ticket: TicketItem): void {
    this.ticketService.getTicketById(ticket.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedTicket = res.data;
          this.newCommentText = '';
          this.showWorkflowDrawer = true;
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.selectedTicket = ticket;
        this.showWorkflowDrawer = true;
        this.cdr.markForCheck();
      }
    });
  }

  postComment(): void {
    if (!this.selectedTicket || !this.newCommentText.trim()) return;

    const ticketId = this.selectedTicket.id;
    this.ticketService.addComment(ticketId, this.newCommentText.trim()).subscribe({
      next: () => {
        this.newCommentText = '';
        this.messageService.add({
          severity: 'success',
          summary: 'Update Posted',
          detail: 'Your comment was added to the ticket history.'
        });
        // Reload ticket details
        this.ticketService.getTicketById(ticketId).subscribe((res) => {
          if (res.success) {
            this.selectedTicket = res.data;
            this.cdr.markForCheck();
          }
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Failed to post update'
        });
      }
    });
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadTickets();
  }

  onSearch(): void {
    this.page = 1;
    this.loadTickets();
  }

  onPageChange(event: any): void {
    this.page = Math.floor(event.first / event.rows) + 1;
    this.limit = event.rows;
    this.loadTickets();
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return 'success';
      case 'IN_REVIEW':
        return 'warn';
      case 'UNDER_PROCESS':
        return 'info';
      case 'REJECTED':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getPrioritySeverity(priority: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (priority) {
      case 'URGENT':
        return 'danger';
      case 'HIGH':
        return 'warn';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
      default:
        return 'secondary';
    }
  }

  getWorkflowStepIndex(status: string): number {
    switch (status) {
      case 'UNDER_PROCESS':
        return 1;
      case 'IN_REVIEW':
        return 2;
      case 'RESOLVED':
      case 'CLOSED':
        return 3;
      case 'REJECTED':
        return 0;
      default:
        return 1;
    }
  }

  formatStatus(status: string | undefined): string {
    if (!status) return '';
    return status.replace(/_/g, ' ');
  }
}
