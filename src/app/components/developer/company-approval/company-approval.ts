import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Toast } from 'primeng/toast';
import { Tooltip } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableColumn, TableTemplate } from '../../../shared/ui/table-template/table-template';
import { UserService } from '../../../shared/services/user-service';

@Component({
  selector: 'app-company-approval',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ConfirmDialog,
    Toast,
    Tooltip,
    TableTemplate
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './company-approval.html',
  styleUrl: './company-approval.scss'
})
export class CompanyApproval implements OnInit {
  isLoading = true;
  data: any[] = [];
  
  columns: TableColumn[] = [
    { key: 'actions', header: '⚙️ Actions', isVisible: true, isSortable: false, isCustom: true },
    { key: 'company_name', header: 'Company Name', isVisible: true, isSortable: true },
    { key: 'short_name', header: 'Short Name', isVisible: true, isSortable: true },
    { key: 'company_email', header: 'Company Email', isVisible: true, isSortable: true },
    { key: 'company_phone', header: 'Company Phone', isVisible: true, isSortable: true },
    { key: 'industry', header: 'Industry', isVisible: true, isSortable: true },
    { key: 'address', header: 'Address', isVisible: true, isSortable: false },
    { key: 'admin_name', header: 'Admin Name', isVisible: true, isSortable: true },
    { key: 'admin_email', header: 'Admin Email', isVisible: true, isSortable: true },
    { key: 'admin_mobile', header: 'Admin Mobile', isVisible: true, isSortable: true }
  ];

  pageNo = 1;
  pageSize = 10;
  searchText = '';
  totalCount = 0;

  constructor(
    private userService: UserService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.userService.getPendingCompanies().subscribe({
      next: (res: any) => {
        this.data = res.data || [];
        this.totalCount = this.data.length;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Failed to fetch pending company requests.'
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onApprove(company: any, event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure you want to approve "${company.company_name}"? This will activate the company and its HR Admin user.`,
      header: 'Approve Company Request',
      icon: 'pi pi-check-circle',
      rejectButtonProps: { label: 'Cancel', severity: 'secondary', outlined: true },
      acceptButtonProps: { label: 'Approve', severity: 'success' },
      accept: () => {
        this.isLoading = true;
        this.userService.approveCompany(company.id).subscribe({
          next: (res: any) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Approved',
              detail: `Company "${company.company_name}" approved successfully!`
            });
            this.loadData();
          },
          error: (err: any) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err?.error?.message || 'Failed to approve company.'
            });
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  onReject(company: any, event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure you want to reject and delete the request for "${company.company_name}"?`,
      header: 'Reject Company Request',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancel', severity: 'secondary', outlined: true },
      acceptButtonProps: { label: 'Reject', severity: 'danger' },
      accept: () => {
        this.isLoading = true;
        this.userService.rejectCompany(company.id).subscribe({
          next: (res: any) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Rejected',
              detail: `Company "${company.company_name}" request rejected successfully.`
            });
            this.loadData();
          },
          error: (err: any) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err?.error?.message || 'Failed to reject company.'
            });
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  onPageChange(newPage: number) {
    this.pageNo = newPage;
  }

  onPageSizeChange(newSize: number) {
    this.pageSize = newSize;
    this.pageNo = 1;
  }

  onSearchChange(search: string) {
    this.searchText = search;
    this.pageNo = 1;
  }
}
