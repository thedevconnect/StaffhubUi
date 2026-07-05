import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { AppBreadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-exit-interview',
  standalone: true,
  imports: [
    CommonModule, 
    CardModule, 
    AppBreadcrumb,
    ReactiveFormsModule,
    ToastModule,
    ButtonModule
  ],
  providers: [MessageService],
  templateUrl: './exit-interview.html',
  styleUrl: './exit-interview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExitInterview implements OnInit {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Exit', icon: 'pi pi-sign-out' },
    { label: 'Exit Interview Form', icon: 'pi pi-file-edit', routerLink: '/ess/exit-interview' }
  ];

  exitInterviewForm!: FormGroup;

  constructor(private fb: FormBuilder, private messageService: MessageService) {}

  ngOnInit(): void {
    this.exitInterviewForm = this.fb.group({
      expectations: ['', Validators.required],
      fulfilled: ['', Validators.required],
      attractNewJob: ['', Validators.required],
      comeBackLater: ['', Validators.required],
      whatLiked: ['', Validators.required],
      whatDisliked: ['', Validators.required],
      suggestions: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.exitInterviewForm.invalid) {
      this.exitInterviewForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please answer all required questions.'
      });
      return;
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Your exit interview feedback has been submitted successfully.'
    });
  }
}
