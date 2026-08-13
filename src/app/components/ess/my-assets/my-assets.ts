import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core'
import { CommonModule, DatePipe } from '@angular/common'
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators
} from '@angular/forms'
import { BreadcrumbModule } from 'primeng/breadcrumb'
import { AppBreadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb'
import { ButtonModule } from 'primeng/button'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import { ToastModule } from 'primeng/toast'
import { DrawerModule } from 'primeng/drawer'
import { SelectModule } from 'primeng/select'
import { InputTextModule } from 'primeng/inputtext'
import { TextareaModule } from 'primeng/textarea'
import { DialogModule } from 'primeng/dialog'
import { ConfirmationService, MessageService } from 'primeng/api'
import { FloatLabelModule } from 'primeng/floatlabel'

import { UserService } from '../../../shared/services/user-service'
import { AuthService } from '../../../shared/services/services/auth.service'
import { TableColumn, TableTemplate } from '../../../shared/ui/table-template/table-template'
import { Router } from '@angular/router'

@Component({
  selector: 'app-my-assets',
  standalone: true,
  imports: [
    CommonModule,
    TableTemplate,
    BreadcrumbModule,
    ButtonModule,
    ConfirmDialogModule,
    ToastModule,
    ReactiveFormsModule,
    FormsModule,
    DrawerModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    DialogModule,
    FloatLabelModule
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
  templateUrl: './my-assets.html',
  styleUrl: './my-assets.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyAssets implements OnInit {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'My Assets', icon: 'pi pi-briefcase', routerLink: '/ess/my-assets' }
  ]

  assets: any[] = []
  isLoading = false
  showAssetDrawer = false
  showViewDrawer = false
  showHistoryDrawer = false
  isEditMode = false
  selectedAsset: any = null
  assetHistory: any[] = []

  activeTab: string = 'Pending';

  get tabs(): any[] {
    if (this.isHRAdmin) {
      return [
        { label: 'Pending Requests', value: 'Pending', icon: 'pi pi-clock' },
        { label: 'Assigned Assets', value: 'Assigned', icon: 'pi pi-users' },
        { label: 'Company Inventory', value: 'Inventory', icon: 'pi pi-box' },
        { label: 'All', value: 'All', icon: 'pi pi-list' }
      ];
    } else {
      return [
        { label: 'My Assigned Assets', value: 'Assigned', icon: 'pi pi-briefcase' },
        { label: 'Pending Requests', value: 'Pending', icon: 'pi pi-clock' },
        { label: 'Rejected Requests', value: 'Rejected', icon: 'pi pi-times-circle' },
        { label: 'All My Assets', value: 'All', icon: 'pi pi-list' }
      ];
    }
  }

  onTabChange(tab: string) {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  get filteredAssets(): any[] {
    return this.assets.filter(asset => {
      if (this.activeTab === 'All') return true;
      const status = (asset.approval_status || '').toUpperCase();

      if (this.isHRAdmin) {
        if (this.activeTab === 'Inventory') return !asset.employee_id;
        if (this.activeTab === 'Assigned') return asset.employee_id && status === 'APPROVED';
        if (this.activeTab === 'Pending') return status === 'PENDING';
      } else {
        if (this.activeTab === 'Assigned') return status === 'APPROVED';
        if (this.activeTab === 'Pending') return status === 'PENDING';
        if (this.activeTab === 'Rejected') return status === 'REJECTED';
      }
      return true;
    });
  }

  assetForm!: FormGroup

  columns: TableColumn[] = [
    { key: 'actions', header: 'Actions', isVisible: true },
    { key: 'employee_name', header: 'Employee', isVisible: true, isSortable: true },
    { key: 'asset_name', header: 'Asset Name', isVisible: true, isSortable: true },
    { key: 'asset_type', header: 'Asset Type', isVisible: true, isSortable: true },
    { key: 'asset_code', header: 'Asset Code', isVisible: true, isSortable: true },
    { key: 'serial_number', header: 'Serial Number', isVisible: true, isSortable: true },
    { key: 'assigned_date', header: 'Assigned Date', isVisible: true, format: 'date', isSortable: true },
    { key: 'approval_status', header: 'Status', isVisible: true, isSortable: true }
  ]

  get rowActions() {
    const actions = [
      { label: 'View', icon: 'pi pi-eye', id: 'view' },
      { label: 'History', icon: 'pi pi-history', id: 'history' }
    ];
    if (this.isHRAdmin) {
      actions.push({ label: 'Edit', icon: 'pi pi-pencil', id: 'edit' });
      actions.push({ label: 'Approve', icon: 'pi pi-check', id: 'approve' });
      actions.push({ label: 'Reject', icon: 'pi pi-times', id: 'reject' });
      actions.push({ label: 'Delete', icon: 'pi pi-trash', id: 'delete' });
    } else {
      actions.push({ label: 'Withdraw', icon: 'pi pi-times-circle', id: 'withdraw' });
      actions.push({ label: 'Return', icon: 'pi pi-undo', id: 'return' });
    }
    return actions;
  }

  constructor(
    private assetsService: UserService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private authService: AuthService
  ) { }

  employees: any[] = []

  get isHRAdmin(): boolean {
    if (this.router.url.includes('hradmin')) return true;
    const user = this.authService.user();
    if (!user) return false;
    const roleStr = user.role || '';
    const roles = roleStr.split(',').map((r: string) => r.trim().toUpperCase());
    const roleObjs = (user.roles || []).map(r => (r.roleId || r.rolDes || '').toUpperCase());
    const privileged = ['HR_ADMIN', 'ADMIN', 'SUPER_ADMIN', 'SUPERADMIN', 'DEVELOPER', 'HRADMIN'];
    return roles.some((r: string) => privileged.includes(r)) || roleObjs.some((r: string) => privileged.includes(r));
  }

  categories: any[] = []

  ngOnInit(): void {
    this.activeTab = 'Pending';
    this.initForm()
    this.loadEmployees()
    this.getAllData(true)
  }

  loadEmployees(): void {
    this.assetsService.getAllUsers().subscribe({
      next: (res: any) => {
        this.employees = res?.data || []
        this.cdr.markForCheck()
      }
    })
  }

  initForm(): void {
    this.assetForm = this.fb.group({
      employee_id: [''],
      asset_name: ['', Validators.required],
      asset_type: ['', Validators.required],
      asset_code: [''],
      serial_number: ['', Validators.required],
      assigned_date: ['', Validators.required],
      employee_remarks: ['', Validators.required]
    })
  }

  getAllData(showLoading = true): void {
    if (showLoading) this.isLoading = true
    this.assetsService.getAllAssets().subscribe({
      next: (res: any) => {
        const raw = res?.data || []
        this.assets = raw.map((item: any) => ({
          ...item,
          approval_status: item.approval_status || item.status || 'PENDING'
        }))
        this.isLoading = false
        this.cdr.markForCheck()
      },
      error: (err: any) => {
        this.isLoading = false
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to fetch asset data'
        })
        this.cdr.markForCheck()
      }
    })
  }

  openAddDrawer(): void {
    this.isEditMode = false
    this.selectedAsset = null
    this.assetForm.reset({
      employee_id: '',
      asset_name: '',
      asset_type: '',
      asset_code: '',
      serial_number: '',
      assigned_date: new Date().toISOString().substring(0, 10),
      employee_remarks: ''
    })
    this.showAssetDrawer = true
  }

  openEditDrawer(row: any): void {
    this.isEditMode = true
    this.selectedAsset = row
    this.assetForm.patchValue({
      employee_id: row.employee_id || '',
      asset_name: row.asset_name,
      asset_type: row.asset_type,
      asset_code: row.asset_code,
      serial_number: row.serial_number,
      assigned_date: row.assigned_date ? new Date(row.assigned_date).toISOString().substring(0, 10) : '',
      employee_remarks: row.employee_remarks || ''
    })
    this.showAssetDrawer = true
  }

  closeDrawer(): void {
    this.showAssetDrawer = false
  }

  saveAsset(): void {
    if (this.assetForm.invalid) {
      this.assetForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'All Fields are Mandatory',
        detail: 'All fields are mandatory. Please fill in all required fields.'
      });
      return;
    }

    const val = this.assetForm.value
    const payload = {
      ...val,
      assigned_date: val.assigned_date ? new Date(val.assigned_date).toISOString().substring(0, 10) : null
    }

    if (this.isEditMode && this.selectedAsset) {
      this.assetsService.updateAsset(this.selectedAsset.id, payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: 'Asset updated successfully'
          })
          this.closeDrawer()
          this.getAllData(false)
        },
        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: err.error?.message || 'Unable to update asset'
          })
        }
      })
    } else {
      this.assetsService.createAsset(payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Created',
            detail: 'Asset created successfully'
          })
          this.closeDrawer()
          this.getAllData(false)
        },
        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Creation Failed',
            detail: err.error?.message || 'Unable to create asset'
          })
        }
      })
    }
  }

  confirmDelete(row: any): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${row.asset_name}?`,
      header: 'Delete Asset',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteAsset(row)
    })
  }

  deleteAsset(row: any): void {
    this.assetsService.deleteAsset(row.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Asset deleted successfully'
        })
        this.getAllData(false)
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: err.error?.message || 'Unable to delete asset'
        })
      }
    })
  }

  showActionReasonDialog = false;
  actionType: 'approve' | 'reject' | 'withdraw' | 'return' = 'approve';
  actionRemarks = '';
  targetRow: any = null;

  disableActionCondition = (actionId: string, row: any): boolean => {
    const status = (row.approval_status || '').toUpperCase();
    if (this.isHRAdmin) {
      if (['APPROVED', 'REJECTED', 'WITHDRAWN', 'RETURNED'].includes(status) && (actionId === 'approve' || actionId === 'reject')) return true;
    } else {
      if (actionId === 'withdraw' && status !== 'PENDING') return true;
      if (actionId === 'return' && status !== 'APPROVED') return true;
    }
    return false;
  }

  onActionClicked(event: { actionId: string; row: any }): void {
    if (event.actionId === 'view') {
      this.selectedAsset = event.row
      this.showViewDrawer = true
    }

    if (event.actionId === 'edit') {
      if (event.row.approval_status === 'APPROVED') {
        this.messageService.add({ severity: 'error', summary: 'Restricted', detail: 'Approved assets cannot be modified.' });
        return;
      }
      this.openEditDrawer(event.row)
    }

    if (event.actionId === 'delete') {
      if (event.row.approval_status === 'APPROVED') {
        this.messageService.add({ severity: 'error', summary: 'Restricted', detail: 'Approved assets cannot be deleted.' });
        return;
      }
      this.confirmDelete(event.row)
    }

    if (event.actionId === 'approve') {
      this.openActionReasonModal(event.row, 'approve');
    }

    if (event.actionId === 'reject') {
      this.openActionReasonModal(event.row, 'reject');
    }

    if (event.actionId === 'withdraw') {
      this.openActionReasonModal(event.row, 'withdraw');
    }

    if (event.actionId === 'return') {
      this.openActionReasonModal(event.row, 'return');
    }

    if (event.actionId === 'history') {
      this.viewHistory(event.row)
    }
  }

  openActionReasonModal(row: any, type: 'approve' | 'reject' | 'withdraw' | 'return') {
    this.targetRow = row;
    this.actionType = type;
    this.actionRemarks = '';
    this.showActionReasonDialog = true;
    this.cdr.markForCheck();
  }

  submitActionReason() {
    if (!this.targetRow) return;

    const row = this.targetRow;
    const type = this.actionType;
    const remarks = this.actionRemarks.trim() || (type === 'approve' ? 'Approved' : (type === 'reject' ? 'Rejected' : (type === 'withdraw' ? 'Withdrawal requested' : 'Return requested')));

    this.showActionReasonDialog = false;

    if (type === 'approve') {
      this.assetsService.approveAsset(row.id, { hr_remarks: remarks }).subscribe({
        next: (res: any) => {
          this.messageService.add({ severity: 'success', summary: 'Approved', detail: res.message || 'Asset action approved successfully' });
          this.getAllData(false);
        },
        error: (err: any) => {
          this.messageService.add({ severity: 'error', summary: 'Failed', detail: err.error?.message || 'Unable to approve action' });
        }
      });
    } else if (type === 'reject') {
      this.assetsService.rejectAsset(row.id, { hr_remarks: remarks }).subscribe({
        next: (res: any) => {
          this.messageService.add({ severity: 'success', summary: 'Rejected', detail: res.message || 'Asset action rejected' });
          this.getAllData(false);
        },
        error: (err: any) => {
          this.messageService.add({ severity: 'error', summary: 'Failed', detail: err.error?.message || 'Unable to reject action' });
        }
      });
    } else if (type === 'withdraw') {
      this.assetsService.withdrawAsset(row.id, { remarks }).subscribe({
        next: (res: any) => {
          this.messageService.add({ severity: 'success', summary: 'Withdraw Requested', detail: res.message || 'Withdrawal request submitted for HR approval' });
          this.getAllData(false);
        },
        error: (err: any) => {
          this.messageService.add({ severity: 'error', summary: 'Failed', detail: err.error?.message || 'Unable to submit withdrawal request' });
        }
      });
    } else if (type === 'return') {
      this.assetsService.returnAsset(row.id, { remarks }).subscribe({
        next: (res: any) => {
          this.messageService.add({ severity: 'success', summary: 'Return Requested', detail: res.message || 'Return request submitted for HR approval' });
          this.getAllData(false);
        },
        error: (err: any) => {
          this.messageService.add({ severity: 'error', summary: 'Failed', detail: err.error?.message || 'Unable to submit return request' });
        }
      });
    }
  }

  viewHistory(row: any): void {
    this.selectedAsset = row;
    this.showHistoryDrawer = true;
    this.assetHistory = [];
    this.assetsService.getAssetHistory(row.id).subscribe({
      next: (res: any) => {
        this.assetHistory = res.data || [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Unable to fetch history' });
      }
    });
  }

  approveAsset(row: any): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to approve ${row.asset_name}?`,
      header: 'Approve Asset',
      icon: 'pi pi-check-circle',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => {
        this.assetsService.approveAsset(row.id, { hr_remarks: 'Approved by HR' }).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Approved', detail: 'Asset approved successfully' })
            this.getAllData(false)
          },
          error: (err: any) => {
            this.messageService.add({ severity: 'error', summary: 'Failed', detail: err.error?.message || 'Unable to approve asset' })
          }
        })
      }
    })
  }

  rejectAsset(row: any): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to reject ${row.asset_name}?`,
      header: 'Reject Asset Request',
      icon: 'pi pi-times-circle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.assetsService.rejectAsset(row.id, { hr_remarks: 'Rejected by HR' }).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Rejected', detail: 'Asset request rejected successfully' })
            this.getAllData(false)
          },
          error: (err: any) => {
            this.messageService.add({ severity: 'error', summary: 'Failed', detail: err.error?.message || 'Unable to reject asset request' })
          }
        })
      }
    })
  }

  withdrawAsset(row: any): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to withdraw the request for ${row.asset_name}?`,
      header: 'Withdraw Request',
      icon: 'pi pi-times-circle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.assetsService.withdrawAsset(row.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Withdrawn', detail: 'Asset request withdrawn successfully' })
            this.getAllData(false)
          },
          error: (err: any) => {
            this.messageService.add({ severity: 'error', summary: 'Failed', detail: err.error?.message || 'Unable to withdraw request' })
          }
        })
      }
    })
  }

  returnAsset(row: any): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to return ${row.asset_name}?`,
      header: 'Return Asset',
      icon: 'pi pi-undo',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.assetsService.returnAsset(row.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Returned', detail: 'Asset returned successfully' })
            this.getAllData(false)
          },
          error: (err: any) => {
            this.messageService.add({ severity: 'error', summary: 'Failed', detail: err.error?.message || 'Unable to return asset' })
          }
        })
      }
    })
  }
}
