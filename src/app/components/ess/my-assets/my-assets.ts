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

  activeTab: string = 'All';

  get tabs(): any[] {
    if (this.isHRAdmin) {
      return [
        { label: 'Company Inventory', value: 'Inventory', icon: 'pi pi-box' },
        { label: 'Assigned Assets', value: 'Assigned', icon: 'pi pi-users' },
        { label: 'Pending Requests', value: 'Pending', icon: 'pi pi-clock' },
        { label: 'All', value: 'All', icon: 'pi pi-list' }
      ];
    } else {
      return [
        { label: 'My Assigned Assets', value: 'Assigned', icon: 'pi pi-briefcase' },
        { label: 'My Requests', value: 'Pending', icon: 'pi pi-clock' },
        { label: 'All', value: 'All', icon: 'pi pi-list' }
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
      actions.push({ label: 'Delete', icon: 'pi pi-trash', id: 'delete' });
      actions.push({ label: 'Approve', icon: 'pi pi-check', id: 'approve' });
    } else {
      actions.push({ label: 'Withdraw', icon: 'pi pi-times-circle', id: 'withdraw' });
      actions.push({ label: 'Return', icon: 'pi pi-undo', id: 'return' });
    }
    return actions;
  }

  disableActionCondition = (actionId: string, row: any): boolean => {
    const status = (row.approval_status || '').toUpperCase();
    if (this.isHRAdmin) {
      if (status === 'APPROVED' && actionId === 'approve') return true;
    } else {
      if (actionId === 'withdraw' && status !== 'PENDING') return true;
      if (actionId === 'return' && status !== 'APPROVED') return true;
    }
    return false;
  }

  constructor(
    private assetsService: UserService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  employees: any[] = []

  get isHRAdmin(): boolean {
    return this.router.url.includes('hradmin');
  }

  categories: any[] = []

  ngOnInit(): void {
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
      serial_number: [''],
      assigned_date: ['', Validators.required],
      employee_remarks: ['']
    })
  }

  getAllData(showLoader: boolean = true): void {
    if (showLoader) this.isLoading = true

    this.assetsService.getAllAssets().subscribe({
      next: (res: any) => {
        const dataArray = res?.table || res?.data || []
        this.assets = dataArray.map((item: any) => this.mapAsset(item))
        this.isLoading = false
        this.cdr.markForCheck()
      },
      error: err => {
        console.log(err)
        this.assets = []
        this.isLoading = false
        this.cdr.markForCheck()
      }
    })
  }

  mapAsset(item: any): any {
    return {
      ...item,
      employee_name: item.employee_name || item.EmployeeName || item.employeeName || (item.employee_id ? `Employee #${item.employee_id}` : '-'),
      assigned_date: item.assigned_date ? item.assigned_date.split('T')[0] : null
    }
  }

  openAddDrawer(): void {
    this.isEditMode = false
    this.selectedAsset = null
    this.assetForm.reset()
    this.showAssetDrawer = true
  }

  openEditDrawer(row: any): void {
    this.isEditMode = true
    this.selectedAsset = row

    this.assetForm.patchValue({
      employee_id: row.employee_id,
      asset_name: row.asset_name,
      asset_type: row.asset_type,
      asset_code: row.asset_code || '',
      serial_number: row.serial_number || '',
      assigned_date: row.assigned_date || '',
      employee_remarks: row.employee_remarks || ''
    })

    this.showAssetDrawer = true
  }

  saveAsset(): void {
    if (this.assetForm.invalid) {
      this.assetForm.markAllAsTouched()
      return
    }

    const payload = this.assetForm.value

    if (this.isEditMode && this.selectedAsset?.id) {
      this.assetsService.updateAsset(this.selectedAsset.id, payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: 'Asset updated successfully'
          })
          this.showAssetDrawer = false
          this.getAllData(false)
        },
        error: err => {
          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: err.error?.message || 'Unable to update asset'
          })
        }
      })
      return
    }

    this.assetsService.createAsset(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Created',
          detail: 'Asset created successfully'
        })
        this.showAssetDrawer = false
        this.getAllData(false)
      },
      error: err => {
        this.messageService.add({
          severity: 'error',
          summary: 'Create Failed',
          detail: err.error?.message || 'Unable to create asset'
        })
      }
    })
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
      error: err => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: err.error?.message || 'Unable to delete asset'
        })
      }
    })
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
      this.approveAsset(event.row)
    }

    if (event.actionId === 'withdraw') {
      this.withdrawAsset(event.row)
    }

    if (event.actionId === 'return') {
      this.returnAsset(event.row)
    }

    if (event.actionId === 'history') {
      this.viewHistory(event.row)
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
          error: err => {
            this.messageService.add({ severity: 'error', summary: 'Failed', detail: err.error?.message || 'Unable to approve asset' })
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
          error: err => {
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
          error: err => {
            this.messageService.add({ severity: 'error', summary: 'Failed', detail: err.error?.message || 'Unable to return asset' })
          }
        })
      }
    })
  }
}
