import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Breadcrumb } from 'primeng/breadcrumb';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DrawerModule } from 'primeng/drawer';
import { MessageService } from 'primeng/api';
import { ExitInterviewService, ExitInterviewData } from '../../../shared/services/exit-interview.service';

@Component({
  selector: 'app-exit-interviews',
  standalone: true,
  imports: [
    CommonModule,
    Breadcrumb,
    TableModule,
    ButtonModule,
    ToastModule,
    DrawerModule
  ],
  providers: [MessageService],
  templateUrl: './exit-interviews.html',
  styleUrl: './exit-interviews.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExitInterviews implements OnInit {
  breadcrumbItems: any[] = [
    { label: 'HR Admin', icon: 'pi pi-home', routerLink: '/hradmin' },
    { label: 'Offboarding', icon: 'pi pi-user-minus' },
    { label: 'Exit Interviews', icon: 'pi pi-file-edit' }
  ];

  exitInterviews: ExitInterviewData[] = [];
  isLoading = false;

  displayDrawer = false;
  selectedInterview: ExitInterviewData | null = null;

  constructor(
    private exitInterviewService: ExitInterviewService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadExitInterviews();
  }

  loadExitInterviews(): void {
    this.isLoading = true;
    this.exitInterviewService.getCompanyExitInterviews().subscribe({
      next: (res) => {
        if (res && res.success) {
          this.exitInterviews = res.data || [];
        } else {
          this.exitInterviews = [];
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.exitInterviews = [];
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load exit interviews.' });
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  viewDetails(interview: ExitInterviewData): void {
    this.selectedInterview = interview;
    this.displayDrawer = true;
  }
}
