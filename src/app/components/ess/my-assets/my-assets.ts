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
  isEditMode = false
  selectedAsset: any = null

  activeTab: string = 'All';
  tabs: any[] = [
    { label: 'Pending', value: 'Pending', icon: 'pi pi-clock' },
    { label: 'Processed', value: 'Processed', icon: 'pi pi-check-circle' },
    { label: 'All', value: 'All', icon: 'pi pi-list' }
  ];

  onTabChange(tab: string) {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  get filteredAssets(): any[] {
    return this.assets.filter(asset => {
      if (this.activeTab === 'All') return true;
      if (this.activeTab === 'Pending') {
        return asset.approval_status === 'Pending' || asset.approval_status === 'PENDING';
      } else {
        return asset.approval_status !== 'Pending' && asset.approval_status !== 'PENDING';
      }
    });
  }

  assetForm!: FormGroup

  columns: TableColumn[] = [
    { key: 'actions', header: 'Actions', isVisible: true },
    { key: 'EmployeeName', header: 'Employee', isVisible: true, isSortable: true },
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
      { label: 'Edit', icon: 'pi pi-pencil', id: 'edit' },
      { label: 'Delete', icon: 'pi pi-trash', id: 'delete' }
    ];
    if (this.isHRAdmin) {
      actions.push({ label: 'Approve', icon: 'pi pi-check', id: 'approve' });
    }
    return actions;
  }

  disableActionCondition = (actionId: string, row: any): boolean => {
    if (row.approval_status === 'APPROVED' && (actionId === 'edit' || actionId === 'delete' || actionId === 'approve')) {
      return true;
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
      employee_id: ['', Validators.required],
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

}
