import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { EmployeeManagementService } from '../../../shared/services/employee-management.service';

export interface Employee {
  id: string;
  name: string;
  displayName: string;
  role: string;
  department: string;
}

export interface CalendarDay {
  date: number | null;
  status: string;
  colorClass: string;
}

@Component({
  selector: 'app-emp-monthly-calendar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    ButtonModule,
    ToastModule,
    BreadcrumbModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './emp-monthly-calendar.html',
  styleUrl: './emp-monthly-calendar.scss',
})
export class EmpMonthlyCalendar implements OnInit {
  breadcrumbItems: any[] = [
    { label: 'HR Administration', icon: 'pi pi-home', routerLink: '/hradmin' },
    { label: 'Employee Attendance Calendar', icon: 'pi pi-calendar', routerLink: '/hradmin/employee-calendar' },
  ];
  isLoading = false;

  employees: Employee[] = [];
  selectedEmployee!: Employee;
  currentDate = new Date(2026, 5, 1); // June 2026 as per screenshot
  weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  calendarDays: CalendarDay[] = [];

  constructor(
    private messageService: MessageService,
    private employeeManagementService: EmployeeManagementService
  ) { }

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.employeeManagementService.getEmployees().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.employees = data.map(emp => ({
            id: String(emp.id),
            name: emp.fullName,
            displayName: `${emp.fullName} - ${emp.employeeCode || emp.id}`,
            role: emp.designation || 'Staff',
            department: emp.department || 'Operations'
          }));
          this.selectedEmployee = this.employees[0];
          this.generateCalendar();
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'No Employees',
            detail: 'No employees found for this company. Please add employees first.'
          });
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch employee list from server.'
        });
      }
    });
  }

  onRefresh(): void {
    this.isLoading = true;
    this.employeeManagementService.getEmployees().subscribe({
      next: (data) => {
        this.isLoading = false;
        if (data && data.length > 0) {
          this.employees = data.map(emp => ({
            id: String(emp.id),
            name: emp.fullName,
            displayName: `${emp.fullName} - ${emp.employeeCode || emp.id}`,
            role: emp.designation || 'Staff',
            department: emp.department || 'Operations'
          }));
          // Keep current selected if still exists, else pick first
          const found = this.employees.find(e => e.id === this.selectedEmployee?.id);
          if (found) {
            this.selectedEmployee = found;
          } else {
            this.selectedEmployee = this.employees[0];
          }
          this.generateCalendar();
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Synchronized',
          detail: 'Employee calendar successfully synchronized.'
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to refresh employee list.'
        });
      }
    });
  }

  get monthName(): string {
    return this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  onEmployeeChange(): void {
    this.generateCalendar();
  }

  prevMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday is 0
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Map Sunday=0, Monday=1, ... to Monday=0, Tuesday=1, ... Sunday=6
    const adjustedStart = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const gridDays: CalendarDay[] = [];

    // Empty spaces for previous month's days
    for (let i = 0; i < adjustedStart; i++) {
      gridDays.push({ date: null, status: '', colorClass: '' });
    }

    // Days of current month
    for (let day = 1; day <= totalDays; day++) {
      let status = 'P'; // Default Present
      let colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';

      const dateObj = new Date(year, month, day);
      const isSunday = dateObj.getDay() === 0;
      const isSaturday = dateObj.getDay() === 6;

      if (isSunday) {
        status = 'WO'; // Weekly Off
        colorClass = 'bg-slate-50 text-slate-400 border-slate-200';
      } else if (isSaturday) {
        status = 'WO'; // Alternating or half-day, let's say Weekly Off for simplicity
        colorClass = 'bg-slate-50 text-slate-400 border-slate-200';
      } else {
        // Randomly scatter a few absences, half-days or leaves to make demo realistic
        const val = (day * 17) % 30;
        if (val === 5) {
          status = 'A';
          colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
        } else if (val === 12) {
          status = 'L';
          colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
        } else if (val === 18) {
          status = 'HD';
          colorClass = 'bg-purple-50 text-purple-700 border-purple-200';
        }
      }

      gridDays.push({
        date: day,
        status: status,
        colorClass: colorClass
      });
    }

    this.calendarDays = gridDays;
  }

  // Summary counts for attendance
  getSummaryCount(status: string): number {
    return this.calendarDays.filter(d => d.date !== null && d.status === status).length;
  }
}
