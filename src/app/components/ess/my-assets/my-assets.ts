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

  assetForm!: FormGroup

  columns: TableColumn[] = [

    { key: 'actions', header: 'Actions', isVisible: true },
    { key: 'AssetTransactionId', header: 'Asset ID', isVisible: true, isSortable: true },
    { key: 'Department', header: 'Department', isVisible: true, isSortable: true },
    { key: 'AssetType', header: 'Asset Type', isVisible: true, isSortable: true },
    { key: 'AssetName', header: 'Asset Name', isVisible: true, isSortable: true },
    { key: 'AssignedDate', header: 'Assigned Date', isVisible: true, format: 'date', isSortable: true },
    { key: 'OfficeLocation', header: 'Location', isVisible: true },
    { key: 'Status', header: 'Status', isVisible: true, format: 'status' },
    { key: 'DeptRemarks', header: 'Dept Remarks', isVisible: true },
    { key: 'EmployeeRemarks', header: 'Employee Remarks', isVisible: true },
  ]

  rowActions = [
    { label: 'View', icon: 'pi pi-eye', id: 'view' },
    { label: 'Edit', icon: 'pi pi-pencil', id: 'edit' },
    { label: 'Delete', icon: 'pi pi-trash', id: 'delete' }
  ]

  constructor(
    private assetsService: UserService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initForm()
    this.getAllData(true)
  }

  initForm(): void {
    this.assetForm = this.fb.group({
      EmployeeId: ['', Validators.required],
      Department: ['', Validators.required],
      AssetType: ['', Validators.required],
      AssetName: ['', Validators.required],
      AssignedDate: ['', Validators.required],
      DeptRemarks: [''],
      EmployeeRemarks: [''],
      OfficeLocation: [''],
      OfficeLocationId: [''],
      Status: ['Pending'],
      IsAccessory: [false]
    })
  }

  getAllData(showLoader: boolean = true): void {
    if (showLoader) this.isLoading = true

    this.assetsService.getAllAssets().subscribe({
      next: (res: any) => {
        this.assets = (res?.data || []).map((item: any) => this.mapAsset(item))
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
      IsAccessory: this.bitToBoolean(item.IsAccessory),
      IsActive: this.bitToBoolean(item.IsActive),
      IsDeleted: this.bitToBoolean(item.IsDeleted),
      AssignedDate: item.AssignedDate ? item.AssignedDate.split('T')[0] : null
    }
  }

  bitToBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value
    if (value?.data?.length) return value.data[0] === 1
    return value === 1 || value === '1'
  }

  openAddDrawer(): void {
    this.isEditMode = false
    this.selectedAsset = null
    this.assetForm.reset({
      Status: 'Pending',
      IsAccessory: false
    })
    this.showAssetDrawer = true
  }

  openEditDrawer(row: any): void {
    this.isEditMode = true
    this.selectedAsset = row

    this.assetForm.patchValue({
      EmployeeId: row.EmployeeId,
      Department: row.Department,
      AssetType: row.AssetType,
      AssetName: row.AssetName,
      AssignedDate: row.AssignedDate,
      DeptRemarks: row.DeptRemarks,
      EmployeeRemarks: row.EmployeeRemarks,
      OfficeLocation: row.OfficeLocation,
      OfficeLocationId: row.OfficeLocationId,
      Status: row.Status,
      IsAccessory: row.IsAccessory
    })

    this.showAssetDrawer = true
  }

  saveAsset(): void {
    if (this.assetForm.invalid) {
      this.assetForm.markAllAsTouched()
      return
    }

    const payload = this.assetForm.value

    if (this.isEditMode && this.selectedAsset?.AssetTransactionId) {
      this.assetsService.getAllAssets().subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: 'Asset updated successfully'
          })
          this.showAssetDrawer = false
          this.getAllData(false)
        },
        // error: err => {
        //   this.messageService.add({
        //     severity: 'error',
        //     summary: 'Update Failed',
        //     detail: err.error?.message || 'Unable to update asset'
        //   })
        // }
      })
      return
    }

    this.assetsService.getAllAssets().subscribe({
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
      message: `Are you sure you want to delete ${row.AssetName}?`,
      header: 'Delete Asset',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteAsset(row)
    })
  }

  deleteAsset(row: any): void {
    this.assetsService.getAllAssets().subscribe({
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
      this.openEditDrawer(event.row)
    }

    if (event.actionId === 'delete') {
      this.confirmDelete(event.row)
    }
  }

}
