import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Toast } from 'primeng/toast';
import { DrawerModule } from 'primeng/drawer';
import { MessageService, ConfirmationService } from 'primeng/api';
import {
  TableColumn,
  TableTemplate,
  TableAction,
  Tab,
} from '../../../shared/ui/table-template/table-template';
import { UserService } from '../../../shared/services/user-service';
import { Breadcrumb } from 'primeng/breadcrumb';

@Component({
  selector: 'app-company-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    ConfirmDialog,
    Toast,
    DrawerModule,
    TableTemplate,
    Breadcrumb,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './company-management.html',
  styleUrl: './company-management.scss',
})
export class CompanyManagement implements OnInit {
  isLoading = true;
  allData: any[] = [];
  data: any[] = [];

  breadcrumbItems: any[] = [
    { label: 'Super Admin', icon: 'pi pi-user', routerLink: '/superadmin' },
    {
      label: 'Company Management',
      icon: 'pi pi-building',
      routerLink: '/superadmin/company-management',
    },
  ];


  columns: TableColumn[] = [
    { key: 'actions', header: 'Actions', isVisible: true, isSortable: false, isCustom: true },
    { key: 'company_name', header: 'Company Name', isVisible: true, isSortable: true },
    { key: 'short_name', header: 'Short Name', isVisible: true, isSortable: true },
    { key: 'company_email', header: 'Company Email', isVisible: true, isSortable: true },
    { key: 'company_phone', header: 'Company Phone', isVisible: true, isSortable: true },
    { key: 'industry', header: 'Industry', isVisible: true, isSortable: true },
    { key: 'address', header: 'Address', isVisible: true, isSortable: false },
    { key: 'status', header: 'Status', isVisible: true, isSortable: true, format: 'uppercase' },

    {
      key: 'approval_status',
      header: 'Approval Status',
      isVisible: true,
      isSortable: true,
      format: 'uppercase',
    },
    { key: 'admin_username', header: 'Admin Username', isVisible: true, isSortable: true },
    { key: 'admin_name', header: 'Admin Name', isVisible: true, isSortable: true },
    { key: 'admin_email', header: 'Admin Email', isVisible: true, isSortable: true },
    { key: 'admin_mobile', header: 'Admin Mobile', isVisible: true, isSortable: true },
  ];

  rowActions: TableAction[] = [
    { label: 'View', icon: 'pi pi-eye', id: 'view' },
    { label: 'Edit', icon: 'pi pi-pencil', id: 'edit' },
    { label: 'Delete', icon: 'pi pi-trash', id: 'delete' },
    { label: 'Approve', icon: 'pi pi-check', id: 'approve' },
    { label: 'Reject', icon: 'pi pi-times', id: 'reject' },
  ];

  companyTabs: Tab[] = [
    { label: 'All Requests', value: 'ALL', count: 0, icon: 'pi pi-list' },
    { label: 'Pending', value: 'PENDING', count: 0, icon: 'pi pi-clock' },
    { label: 'Approved', value: 'APPROVED', count: 0, icon: 'pi pi-check' },
    { label: 'Rejected', value: 'REJECTED', count: 0, icon: 'pi pi-times' },
  ];

  activeTab = 'ALL';
  pageNo = 1;
  pageSize = 10;
  searchText = '';
  totalCount = 0;

  // Drawer States
  showDrawer = false;
  isEditMode = false;
  isRegisterMode = false;
  selectedCompany: any = null;

  constructor(
    private userService: UserService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.userService.getAllCompanies(this.pageNo, this.pageSize, this.searchText, this.activeTab).subscribe({
      next: (res: any) => {
        this.data = res.data || [];
        this.totalCount = res.pagination?.totalItems || 0;

        if (res.tabCounts) {
          this.companyTabs[0].count = res.tabCounts.ALL;
          this.companyTabs[1].count = res.tabCounts.PENDING;
          this.companyTabs[2].count = res.tabCounts.APPROVED;
          this.companyTabs[3].count = res.tabCounts.REJECTED;
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Failed to fetch company requests.',
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onTabChange(tabValue: string) {
    this.activeTab = tabValue;
    this.pageNo = 1;
    this.loadData();
  }

  disableActionCondition = (actionId: string, row: any): boolean => {
    if (actionId === 'approve' || actionId === 'reject') {
      return row.approval_status !== 'PENDING';
    }
    return false;
  };

  openAddDrawer() {
    this.isRegisterMode = true;
    this.isEditMode = false;
    this.selectedCompany = {
      companyName: '',
      shortName: '',
      address: '',
      companyEmail: '',
      companyPhone: '',
      industry: '',
      fullName: '',
      username: '',
      email: '',
      mobile: '',
      password: '',
      empId: '',
    };
    this.showDrawer = true;
    this.cdr.detectChanges();
  }

  registerNewCompany() {
    const payload = this.selectedCompany;
    if (
      !payload.companyName ||
      !payload.shortName ||
      !payload.address ||
      !payload.companyEmail ||
      !payload.companyPhone ||
      !payload.fullName ||
      !payload.username ||
      !payload.email ||
      !payload.mobile ||
      !payload.password ||
      !payload.empId
    ) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill all required fields.',
      });
      return;
    }

    this.isLoading = true;
    this.userService.registerCompany(payload).subscribe({
      next: (res: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Company registered successfully!',
        });
        this.showDrawer = false;
        this.loadData();
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Registration Failed',
          detail: err?.error?.message || 'Failed to register company.',
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onActionClicked(event: { actionId: string; row: any }) {
    const item = event.row;
    switch (event.actionId) {
      case 'view':
        this.isRegisterMode = false;
        this.selectedCompany = { ...item };
        this.isEditMode = false;
        this.showDrawer = true;
        this.cdr.detectChanges();
        break;
      case 'edit':
        this.isRegisterMode = false;
        this.selectedCompany = { ...item };
        this.isEditMode = true;
        this.showDrawer = true;
        this.cdr.detectChanges();
        break;
      case 'delete':
        this.confirmSimulatedDelete(item);
        break;
      case 'approve':
        this.onApprove(item, { target: document.body } as any);
        break;
      case 'reject':
        this.onReject(item, { target: document.body } as any);
        break;
    }
  }

  onApprove(company: any, event: Event) {
    this.confirmationService.confirm({
      target: (event?.target || document.body) as EventTarget,
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
              detail: `Company "${company.company_name}" approved successfully!`,
            });
            this.loadData();
          },
          error: (err: any) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err?.error?.message || 'Failed to approve company.',
            });
            this.isLoading = false;
            this.cdr.detectChanges();
          },
        });
      },
    });
  }

  onReject(company: any, event: Event) {
    this.confirmationService.confirm({
      target: (event?.target || document.body) as EventTarget,
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
              detail: `Company "${company.company_name}" request rejected successfully.`,
            });
            this.loadData();
          },
          error: (err: any) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err?.error?.message || 'Failed to reject company.',
            });
            this.isLoading = false;
            this.cdr.detectChanges();
          },
        });
      },
    });
  }

  confirmSimulatedDelete(company: any) {
    this.confirmationService.confirm({
      target: document.body,
      message: `Are you sure you want to delete the registration request for "${company.company_name}"?`,
      header: 'Delete Company Request',
      icon: 'pi pi-trash',
      rejectButtonProps: { label: 'Cancel', severity: 'secondary', outlined: true },
      acceptButtonProps: { label: 'Delete', severity: 'danger' },
      accept: () => {
        this.isLoading = true;
        this.userService.deleteCompany(company.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: `Company "${company.company_name}" and all associated records deleted successfully!`,
            });
            this.loadData();
          },
          error: (err: any) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Delete Failed',
              detail: err?.error?.message || 'Failed to delete company.',
            });
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      },
    });
  }

  saveSimulatedEdit() {
    if (!this.selectedCompany.company_name || !this.selectedCompany.short_name) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Company Name and Short Name are required.',
      });
      return;
    }

    // Update the local list
    this.data = this.data.map((item) => {
      if (item.id === this.selectedCompany.id) {
        return { ...this.selectedCompany };
      }
      return item;
    });

    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Company details updated successfully (Simulation).',
    });
    this.showDrawer = false;
    this.cdr.detectChanges();
  }

  onDrawerHide() {
    this.showDrawer = false;
    this.selectedCompany = null;
    this.isRegisterMode = false;
  }

  onPageChange(newPage: number) {
    this.pageNo = newPage;
    this.loadData();
  }

  onPageSizeChange(newSize: number) {
    this.pageSize = newSize;
    this.pageNo = 1;
    this.loadData();
  }

  onSearchChange(search: string) {
    this.searchText = search;
    this.pageNo = 1;
    this.loadData();
  }
}
