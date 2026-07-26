import { Component, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

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
import { Breadcrumb } from 'primeng/breadcrumb';

import { TableColumn, TableTemplate } from '../../../shared/ui/table-template/table-template';

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
    Breadcrumb,
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
    BadgeModule,
    TableTemplate
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

  subjectSelectOptions = [
    { label: 'Laptop Hardware Change / Upgrade', value: 'Laptop Hardware Change / Upgrade' },
    { label: 'Laptop Charger / Mouse / Keyboard Request', value: 'Laptop Charger / Mouse / Keyboard Request' },
    { label: 'Office Stationery (Pen, Diary, Notebook)', value: 'Office Stationery (Pen, Diary, Notebook)' },
    { label: 'Asset / Identity Card Request', value: 'Asset / Identity Card Request' },
    { label: 'Salary Slip / Leave Balance Query', value: 'Salary Slip / Leave Balance Query' },
    { label: 'Software Installation / Access Request', value: 'Software Installation / Access Request' },
    { label: 'Other', value: 'Other' }
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

  // TableTemplate Configurations
  statusTabs = [
    { label: 'All Tickets', value: 'ALL', icon: 'pi pi-list' },
    { label: 'Under Process', value: 'UNDER_PROCESS', icon: 'pi pi-spin pi-spinner' },
    { label: 'In Review', value: 'IN_REVIEW', icon: 'pi pi-eye' },
    { label: 'Resolved', value: 'RESOLVED', icon: 'pi pi-check-circle' },
    { label: 'Closed', value: 'CLOSED', icon: 'pi pi-lock' },
    { label: 'Rejected', value: 'REJECTED', icon: 'pi pi-times-circle' }
  ];

  columns: TableColumn[] = [
    { key: 'ticket_code', header: 'Ticket Code', isSortable: true },
    { key: 'category', header: 'Category', isSortable: true },
    { key: 'subject', header: 'Subject & Remark', isSortable: true },
    { key: 'creator_name', header: 'Raised By', isSortable: true },
    { key: 'created_at', header: 'Created Date', isSortable: true },
    { key: 'status', header: 'Status', isSortable: true },
    { key: 'actions', header: 'Actions' }
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

  // Drawer Fullscreen Mode
  isFormFullscreen = signal(false);

  // Raise Ticket Drawer State
  showRaiseDrawer = false;
  editingTicketId: number | null = null;
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
      remark: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  toggleFormFullscreen(): void {
    this.isFormFullscreen.update(v => !v);
    this.cdr.markForCheck();
  }

  onTabChange(tabValue: string): void {
    this.selectedStatus = tabValue;
    this.page = 1;
    this.loadTickets();
  }

  applyQuickTemplate(category: string, subject: string, remark: string): void {
    this.ticketForm.patchValue({
      category,
      subject,
      remark
    });
    this.cdr.markForCheck();
  }

  loadEmployees(): void {
    this.ticketService.getEmployees().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        if (list && list.length > 0) {
          this.employees = list.map((emp: any) => {
            const empId = Number(emp.id || emp.employee_id);
            const name = emp.full_name || emp.fullName || emp.employee_name || emp.name || `Employee #${empId}`;
            const desig = emp.designation || emp.role || 'Employee';
            const empCode = emp.emp_id || emp.employee_code || emp.employeeCode ? ` (${emp.emp_id || emp.employee_code || emp.employeeCode})` : '';
            return {
              label: `${name} - ${desig}${empCode}`,
              value: empId
            };
          });
          this.cdr.markForCheck();
        } else {
          this.loadFallbackEmployees();
        }
      },
      error: () => this.loadFallbackEmployees()
    });
  }

  loadFallbackEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        this.employees = list.map((emp: any) => {
          const empId = Number(emp.id || emp.employee_id);
          const name = emp.full_name || emp.fullName || emp.name || `Employee #${empId}`;
          const desig = emp.designation || emp.role || 'Employee';
          const empCode = emp.emp_id || emp.employeeCode ? ` (${emp.emp_id || emp.employeeCode})` : '';
          return {
            label: `${name} - ${desig}${empCode}`,
            value: empId
          };
        });
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error loading fallback employees:', err)
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

  openRaiseDrawer(categoryName?: string): void {
    this.editingTicketId = null;
    this.ticketForm.reset({
      category: categoryName || 'IT HELPDESK',
      subject: 'Laptop Hardware Change / Upgrade',
      priority: 'MEDIUM',
      cc_employees: [],
      remark: ''
    });
    this.showRaiseDrawer = true;
    this.cdr.markForCheck();
  }

  editTicket(ticket: TicketItem): void {
    this.ticketService.getTicketById(ticket.id).subscribe({
      next: (res) => {
        const item = res && res.success ? res.data : ticket;
        this.editingTicketId = item.id;
        const ccIds = (item.cc_employees || []).map((c: any) => Number(c.employee_id));

        this.ticketForm.patchValue({
          category: item.category || 'IT HELPDESK',
          subject: item.subject || '',
          priority: item.priority || 'MEDIUM',
          cc_employees: ccIds,
          remark: item.remark || ''
        });

        this.showRaiseDrawer = true;
        this.cdr.markForCheck();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch ticket details for edit' });
      }
    });
  }

  deleteTicket(ticketId: number): void {
    this.ticketService.deleteTicket(ticketId).subscribe({
      next: (res) => {
        if (res.success) {
          this.messageService.add({ severity: 'info', summary: 'Deleted', detail: 'Support ticket deleted successfully.' });
          this.loadStats();
          this.loadTickets();
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to delete ticket' });
      }
    });
  }

  submitTicket(): void {
    if (this.ticketForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Form Invalid',
        detail: 'Please fill all required fields, including remark description.'
      });
      return;
    }

    this.submitting = true;
    const val = this.ticketForm.value;

    if (this.editingTicketId) {
      this.ticketService.updateTicket(this.editingTicketId, val).subscribe({
        next: (res) => {
          this.submitting = false;
          if (res.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Ticket Updated',
              detail: `Ticket updated successfully!`
            });
            this.showRaiseDrawer = false;
            this.editingTicketId = null;
            this.loadStats();
            this.loadTickets();
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.submitting = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Failed',
            detail: err?.error?.message || 'Failed to update ticket'
          });
          this.cdr.markForCheck();
        }
      });
    } else {
      this.ticketService.createTicket(val).subscribe({
        next: (res) => {
          this.submitting = false;
          if (res.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Ticket Created',
              detail: `Ticket ${res.data?.ticket_code || ''} created successfully!`
            });
            this.showRaiseDrawer = false;
            this.loadStats();
            this.loadTickets();
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.submitting = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Failed',
            detail: err?.error?.message || 'Failed to create ticket'
          });
          this.cdr.markForCheck();
        }
      });
    }
  }

  openWorkflowDrawer(ticket: TicketItem): void {
    this.ticketService.getTicketById(ticket.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.selectedTicket = res.data;
          this.showWorkflowDrawer = true;
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.selectedTicket = ticket;
        this.showWorkflowDrawer = true;
        this.cdr.markForCheck();
      }
    });
  }

  updateTicketStatus(newStatus: string): void {
    if (!this.selectedTicket) return;

    this.ticketService.updateTicketStatus(this.selectedTicket.id, newStatus).subscribe({
      next: (res) => {
        if (res.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Status Updated',
            detail: `Ticket status updated to ${newStatus}`
          });
          if (this.selectedTicket) {
            this.selectedTicket.status = newStatus as any;
          }
          this.loadStats();
          this.loadTickets();
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Failed to update status'
        });
      }
    });
  }

  addComment(): void {
    if (!this.selectedTicket || !this.newCommentText.trim()) return;

    this.ticketService.addComment(this.selectedTicket.id, this.newCommentText.trim()).subscribe({
      next: (res) => {
        if (res.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Comment Added',
            detail: 'Your remark has been posted'
          });
          this.newCommentText = '';
          this.openWorkflowDrawer(this.selectedTicket!);
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Failed to add comment'
        });
      }
    });
  }

  onSearch(): void {
    this.page = 1;
    this.loadTickets();
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadTickets();
  }

  onPageChange(event: any): void {
    this.page = Math.floor(event.first / event.rows) + 1;
    this.limit = event.rows;
    this.loadTickets();
  }
}
