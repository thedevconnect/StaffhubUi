import { ChangeDetectionStrategy, Component, ChangeDetectorRef } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { AppBreadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-final-attendance',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    AppBreadcrumb,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './final-attendance.html',
  styleUrl: './final-attendance.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinalAttendance {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Final Attendance', icon: 'pi pi-check-square', routerLink: '/ess/final-attendance' }
  ];
  records = [
    { month: 'May 2026', totalDays: 31, present: 21, leaves: 1, holidays: 1, weeklyOffs: 8, status: 'Submitted', submitDate: '2026-06-01' },
    { month: 'April 2026', totalDays: 30, present: 20, leaves: 2, holidays: 0, weeklyOffs: 8, status: 'Approved', submitDate: '2026-05-01' }
  ];

  isSubmitted = false;

  constructor(
    private readonly confirmationService: ConfirmationService,
    private readonly messageService: MessageService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  submitCurrentMonth(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to submit the final attendance sheet for June 2026?',
      header: 'Confirm Submission',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      accept: () => {
        const newRecord = {
          month: 'June 2026',
          totalDays: 30,
          present: 22,
          leaves: 0,
          holidays: 0,
          weeklyOffs: 8,
          status: 'Submitted',
          submitDate: new Date().toISOString().split('T')[0]
        };

        this.records = [newRecord, ...this.records];
        this.isSubmitted = true;

        this.messageService.add({
          severity: 'success',
          summary: 'Submitted Successfully',
          detail: 'Your attendance sheet for June 2026 has been submitted for payroll clearance.',
          life: 4000
        });

        this.cdr.markForCheck();
      }
    });
  }
}
