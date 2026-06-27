import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { AppBreadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';

@Component({
  selector: 'app-service-file',
  standalone: true,
  imports: [CommonModule, CardModule, TableModule, AppBreadcrumb],
  templateUrl: './service-file.html',
  styleUrl: './service-file.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceFile {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Service File', icon: 'pi pi-file', routerLink: '/ess/service-file' }
  ];
  documents = [
    { title: 'Offer Letter', type: 'PDF', size: '1.2 MB', uploadDate: '2026-01-10', category: 'Onboarding' },
    { title: 'Appraisal Letter 2026', type: 'PDF', size: '840 KB', uploadDate: '2026-04-01', category: 'Appraisal' },
    { title: 'Form 16 (FY 2025-26)', type: 'PDF', size: '2.1 MB', uploadDate: '2026-06-15', category: 'Taxation' }
  ];
}
