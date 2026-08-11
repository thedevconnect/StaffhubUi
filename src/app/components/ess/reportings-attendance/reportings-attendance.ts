import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { TableColumn, TableTemplate } from '../../../shared/ui/table-template/table-template';
import { AttendanceService } from '../../../shared/services/attendance.service';

@Component({
  selector: 'app-reportings-attendance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    BreadcrumbModule,
    ButtonModule,
    DatePickerModule,
    TableTemplate
  ],
  providers: [MessageService],
  templateUrl: './reportings-attendance.html',
  styleUrl: './reportings-attendance.scss',
})
export class ReportingsAttendance implements OnInit {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', routerLink: '/ess' },
    { label: 'Reportings Attendance' }
  ];

  attendanceService = inject(AttendanceService);
  messageService = inject(MessageService);
  cdr = inject(ChangeDetectorRef);
  Math = Math;

  isLoading = false;
  selectedDate: Date = new Date();
  formattedSelectedDate: string = this.formatDate(new Date());

  get isTodaySelected(): boolean {
    return this.formattedSelectedDate === this.formatDate(new Date());
  }

  formatDate(d: Date): string {
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  rawTeamAttendance: any[] = [];
  filteredTeamAttendance: any[] = [];

  metrics = {
    total: 0,
    present: 0,
    notSwiped: 0,
    onLeave: 0,
    lateComing: 0
  };

  activeTab: string = 'All';
  statusTabs = [
    { label: 'All Reportees', value: 'All', icon: 'pi pi-users' },
    { label: 'Present', value: 'PRESENT', icon: 'pi pi-check-circle' },
    { label: 'Not Swiped', value: 'NOT_SWIPED', icon: 'pi pi-exclamation-circle' },
    { label: 'On Leave', value: 'ON_LEAVE', icon: 'pi pi-calendar' },
    { label: 'Late Coming', value: 'LATE', icon: 'pi pi-clock' }
  ];

  columns: TableColumn[] = [
    { key: 'employee_code', header: 'Emp Code', isSortable: true },
    { key: 'employee_name', header: 'Employee Name', isSortable: true },
    { key: 'department', header: 'Department', isSortable: true },
    { key: 'designation', header: 'Designation' },
    { key: 'swipe_in', header: 'Swipe In', pipe: 'date', pipeArgs: 'hh:mm:ss a', isSortable: true },
    { key: 'swipe_out', header: 'Swipe Out', pipe: 'date', pipeArgs: 'hh:mm:ss a', isSortable: true },
    { key: 'total_time', header: 'Total Work Time' },
    { key: 'swipe_in_address', header: 'Location / Device' },
    { key: 'attendance_status', header: 'Status' }
  ];

  ngOnInit(): void {
    this.loadTeamAttendance();
  }

  onDateChange(): void {
    if (!this.selectedDate) {
      this.selectedDate = new Date();
    }
    this.formattedSelectedDate = this.formatDate(new Date(this.selectedDate));
    this.loadTeamAttendance();
  }

  resetToToday(): void {
    this.selectedDate = new Date();
    this.formattedSelectedDate = this.formatDate(this.selectedDate);
    this.loadTeamAttendance();
  }

  onTabChange(tabValue: string): void {
    this.activeTab = tabValue;
    this.applyTabFilter();
  }

  loadTeamAttendance(): void {
    this.isLoading = true;
    this.attendanceService.getTeamReportingsAttendance(this.formattedSelectedDate).subscribe({
      next: (res: any) => {
        this.rawTeamAttendance = res.data || [];
        this.calculateMetrics();
        this.applyTabFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error fetching team attendance:', err);
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load team reportings attendance' });
        this.cdr.detectChanges();
      }
    });
  }

  calculateMetrics(): void {
    let present = 0;
    let notSwiped = 0;
    let onLeave = 0;
    let late = 0;

    this.rawTeamAttendance.forEach(item => {
      const st = (item.attendance_status || '').toUpperCase();
      if (st === 'PRESENT' || st === 'HALF_DAY') {
        present++;
      } else if (st === 'ON_LEAVE' || st === 'SHORT_LEAVE') {
        onLeave++;
      } else {
        notSwiped++;
      }

      if (item.late_coming === 'Yes') {
        late++;
      }
    });

    this.metrics = {
      total: this.rawTeamAttendance.length,
      present,
      notSwiped,
      onLeave,
      lateComing: late
    };
  }

  applyTabFilter(): void {
    if (this.activeTab === 'All') {
      this.filteredTeamAttendance = [...this.rawTeamAttendance];
    } else if (this.activeTab === 'PRESENT') {
      this.filteredTeamAttendance = this.rawTeamAttendance.filter(i => (i.attendance_status || '').toUpperCase() === 'PRESENT' || (i.attendance_status || '').toUpperCase() === 'HALF_DAY');
    } else if (this.activeTab === 'NOT_SWIPED') {
      this.filteredTeamAttendance = this.rawTeamAttendance.filter(i => (i.attendance_status || '').toUpperCase() === 'NOT_SWIPED' || (i.attendance_status || '').toUpperCase() === 'ABSENT');
    } else if (this.activeTab === 'ON_LEAVE') {
      this.filteredTeamAttendance = this.rawTeamAttendance.filter(i => (i.attendance_status || '').toUpperCase() === 'ON_LEAVE' || (i.attendance_status || '').toUpperCase() === 'SHORT_LEAVE');
    } else if (this.activeTab === 'LATE') {
      this.filteredTeamAttendance = this.rawTeamAttendance.filter(i => i.late_coming === 'Yes');
    }
  }

  onRefresh(): void {
    this.loadTeamAttendance();
    this.messageService.add({ severity: 'success', summary: 'Refreshed', detail: 'Team attendance synchronized' });
  }
}
