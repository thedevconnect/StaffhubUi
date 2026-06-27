import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { AppBreadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableTemplate, TableColumn, TableAction } from '../../../shared/ui/table-template/table-template';

@Component({
  selector: 'app-attendance-regularization',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    AppBreadcrumb,
    ButtonModule,
    ReactiveFormsModule,
    FormsModule,
    DrawerModule,
    DatePickerModule,
    TextareaModule,
    ToastModule,
    ConfirmDialogModule,
    TableTemplate
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './attendance-regularization.html',
  styleUrl: './attendance-regularization.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceRegularization implements OnInit {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Attendance Regularization', icon: 'pi pi-calendar-plus', routerLink: '/ess/attendance-regularization' }
  ];

  requests = [
    { id: 1, date: new Date('2026-05-18'), reason: 'Forgot to check-in (Card lost)', requestedIn: new Date('2026-05-18T09:00:00'), requestedOut: new Date('2026-05-18T18:00:00'), status: 'Approved', approver: 'Sam Tyagi' },
    { id: 2, date: new Date('2026-05-24'), reason: 'Client location visit', requestedIn: new Date('2026-05-24T09:30:00'), requestedOut: new Date('2026-05-24T18:30:00'), status: 'Pending', approver: 'Sam Tyagi' }
  ];

  visible: boolean = false;
  header: string = '';
  headerIcon: string = '';
  postType: string = '';
  regForm!: FormGroup;
  currentEditId: number | null = null;
  isLoading: boolean = false;

  tableColumns: TableColumn[] = [
    { key: 'actions', header: 'Action' },
    { key: 'date', header: 'Log Date', format: 'date' },
    { key: 'requestedIn', header: 'Requested In', format: 'time' },
    { key: 'requestedOut', header: 'Requested Out', format: 'time' },
    { key: 'reason', header: 'Reason' },
    { key: 'approver', header: 'Approver' },
    { key: 'status', header: 'Status', format: 'status' }
  ];

  tableActions: TableAction[] = [
    { label: 'View', icon: 'pi pi-eye', id: 'view' },
    { label: 'Edit', icon: 'pi pi-pencil', id: 'edit' },
    { label: 'Delete', icon: 'pi pi-trash', id: 'delete' }
  ];

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.regForm = this.fb.group({
      date: [null, Validators.required],
      requestedIn: [null, Validators.required],
      requestedOut: [null, Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]]
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.regForm.get(controlName);
    return !!(control?.invalid && (control?.touched || control?.dirty));
  }

  showDialog(type: string, data: any = null) {
    this.visible = true;
    this.postType = type;
    this.headerIcon = type === 'add' ? 'pi pi-plus' : (type === 'edit' ? 'pi pi-pencil' : 'pi pi-eye');
    this.header = type === 'add' ? 'New Regularization' : (type === 'edit' ? 'Edit Regularization' : 'View Regularization');

    if (type === 'edit' || type === 'view') {
      this.currentEditId = data.id;
      this.regForm.patchValue({
        date: data.date,
        requestedIn: data.requestedIn,
        requestedOut: data.requestedOut,
        reason: data.reason
      });
      if (type === 'view') {
        this.regForm.disable();
      } else {
        this.regForm.enable();
      }
    } else {
      this.currentEditId = null;
      this.regForm.reset();
      this.regForm.enable();
    }
  }

  onDrawerHide() {
    this.visible = false;
    this.regForm.reset();
  }

  onSubmit() {
    if (this.regForm.invalid) {
      this.regForm.markAllAsTouched();
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill all required fields correctly.' });
      return;
    }

    this.isLoading = true;
    setTimeout(() => {
      const formValue = this.regForm.getRawValue();
      if (this.postType === 'add') {
        this.requests = [{
          id: Date.now(),
          date: formValue.date,
          requestedIn: formValue.requestedIn,
          requestedOut: formValue.requestedOut,
          reason: formValue.reason,
          status: 'Pending',
          approver: 'Sam Tyagi'
        }, ...this.requests];
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Regularization request added successfully!' });
      } else if (this.postType === 'edit') {
        this.requests = this.requests.map(req => {
          if (req.id === this.currentEditId) {
            return {
              ...req,
              date: formValue.date,
              requestedIn: formValue.requestedIn,
              requestedOut: formValue.requestedOut,
              reason: formValue.reason
            };
          }
          return req;
        });
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Regularization request updated successfully!' });
      }

      this.visible = false;
      this.isLoading = false;
      this.requests = [...this.requests]; // ensure change detection
    }, 500);
  }

  onDelete(id: number) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this regularization request?',
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.requests = this.requests.filter(req => req.id !== id);
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Request deleted successfully!' });
      }
    });
  }

  disableAction = (actionId: string, row: any): boolean => {
    if (actionId === 'edit' || actionId === 'delete') {
      return row.status === 'Approved';
    }
    return false;
  };

  onActionClicked(event: { actionId: string, row: any }) {
    switch (event.actionId) {
      case 'view': this.showDialog('view', event.row); break;
      case 'edit': this.showDialog('edit', event.row); break;
      case 'delete': this.onDelete(event.row.id); break;
    }
  }

  onRefresh() {
    this.messageService.add({ severity: 'info', summary: 'Refreshing', detail: 'Refreshing regularization requests...' });
    // Simulate refresh
    this.isLoading = true;
    setTimeout(() => {
      this.requests = [...this.requests];
      this.isLoading = false;
    }, 500);
  }
}
