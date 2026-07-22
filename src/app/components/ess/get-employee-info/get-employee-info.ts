import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { AppBreadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';
import { EmployeeManagementService } from '../../../shared/services/employee-management.service';
import { Employee } from '../../../shared/services/models/employee.model';

@Component({
  selector: 'app-get-employee-info',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    TableModule,
    DialogModule,
    TooltipModule,
    AppBreadcrumb
  ],
  templateUrl: './get-employee-info.html',
  styleUrl: './get-employee-info.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GetEmployeeInfo implements OnInit {
  private employeeService = inject(EmployeeManagementService);
  private cdr = inject(ChangeDetectorRef);

  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Get Employee Info', icon: 'pi pi-info-circle', routerLink: '/ess/get-employee-info' }
  ];

  employees: any[] = [];
  filteredEmployees: any[] = [];
  searchQuery = '';
  loading = signal(false);

  selectedEmployee: any = null;
  dialogVisible = false;

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.loading.set(true);
    this.employeeService.getEmployees().subscribe({
      next: (data: Employee[]) => {
        const list = (data || []).map(emp => ({
          ...emp,
          displayName: emp.fullName || emp.full_name || `${(emp as any).first_name || ''} ${(emp as any).last_name || ''}`.trim() || `Emp #${emp.id}`,
          displayEmail: emp.officialEmail || emp.email || 'N/A',
          displayMobile: emp.mobileNumber || emp.mobile || 'N/A',
          displayCode: emp.employeeCode || emp.emp_id || `EMP-${emp.id}`,
          displayStatus: emp.status || 'Active'
        }));
        this.employees = list;
        this.filteredEmployees = [...list];
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading employees for company:', err);
        this.loading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  onSearch(query: string): void {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      this.filteredEmployees = [...this.employees];
    } else {
      this.filteredEmployees = this.employees.filter(emp => {
        const name = ((emp as any).displayName || emp.fullName || emp.full_name || '').toLowerCase();
        const code = ((emp as any).displayCode || emp.employeeCode || emp.emp_id || '').toLowerCase();
        const desig = (emp.designation || '').toLowerCase();
        const dept = (emp.department || '').toLowerCase();
        const email = ((emp as any).displayEmail || emp.officialEmail || emp.email || '').toLowerCase();
        const mobile = ((emp as any).displayMobile || emp.mobileNumber || emp.mobile || '').toLowerCase();

        return (
          name.includes(q) ||
          code.includes(q) ||
          desig.includes(q) ||
          dept.includes(q) ||
          email.includes(q) ||
          mobile.includes(q)
        );
      });
    }
    this.cdr.markForCheck();
  }

  viewEmployeeDetails(employee: Employee): void {
    this.selectedEmployee = employee;
    this.dialogVisible = true;
    this.cdr.markForCheck();
  }

  getInitials(name: string): string {
    if (!name) return 'EM';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}
