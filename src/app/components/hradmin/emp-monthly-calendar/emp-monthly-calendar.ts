import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
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
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './emp-monthly-calendar.html',
  styleUrl: './emp-monthly-calendar.scss',
})
export class EmpMonthlyCalendar implements OnInit {
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

  get monthName(): string {
    return this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  onEmployeeChange(): void {
    this.generateCalendar();
    this.messageService.add({
      severity: 'info',
      summary: 'Calendar Loaded',
      detail: `Monthly attendance loaded for ${this.selectedEmployee.name}`
    });
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

    const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday=0, Monday=1, ...
    // Since our columns start on Monday:
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const gridDays: CalendarDay[] = [];

    // Empty slots for padding
    for (let i = 0; i < startOffset; i++) {
      gridDays.push({ date: null, status: '', colorClass: '' });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const isSunday = dateObj.getDay() === 0;

      let status = 'P';
      let colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';

      if (isSunday) {
        status = 'WO';
        colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
      } else {
        // Generate pseudo-random realistic values per employee/day
        const seed = this.selectedEmployee ? this.selectedEmployee.id : 'N005';
        const rawHash = day * 17 + seed.charCodeAt(0) * 11 + month * 7;
        const val = rawHash % 30;

        if (val === 4) {
          status = 'A';
          colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
        } else if (val === 9) {
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
