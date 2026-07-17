import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { Breadcrumb } from 'primeng/breadcrumb';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { ResignationService, Resignation } from '../../../shared/services/resignation.service';

@Component({
  selector: 'app-resignation-approvals',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    Breadcrumb,
    TableModule,
    ButtonModule,
    ConfirmDialogModule,
    ToastModule,
    DialogModule,
    FormsModule,
    TextareaModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './resignation-approvals.html',
  styleUrl: './resignation-approvals.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResignationApprovals implements OnInit {
  breadcrumbItems: any[] = [
    { label: 'HR Admin', icon: 'pi pi-home', routerLink: '/hradmin' },
    { label: 'Offboarding', icon: 'pi pi-user-minus' },
    { label: 'Resignation Requests', icon: 'pi pi-check-square' }
  ];

  resignations: Resignation[] = [];
  isLoading = false;

  displayDialog = false;
  selectedResignation: Resignation | null = null;
  actionType: 'APPROVED' | 'REJECTED' | null = null;
  hrRemarks = '';

  constructor(
    private resignationService: ResignationService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadResignations();
  }

  loadResignations(): void {
    this.isLoading = true;
    this.resignationService.getCompanyResignations().subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.resignations = res.data;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load requests' });
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openActionDialog(resignation: Resignation, type: 'APPROVED' | 'REJECTED'): void {
    this.selectedResignation = resignation;
    this.actionType = type;
    this.hrRemarks = '';
    this.displayDialog = true;
  }

  confirmAction(): void {
    if (!this.selectedResignation || !this.actionType) return;

    this.resignationService.updateStatus(this.selectedResignation.id, this.actionType, this.hrRemarks).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Resignation has been ${this.actionType!.toLowerCase()}.`
        });
        this.displayDialog = false;
        this.loadResignations();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update status' });
      }
    });
  }
}
