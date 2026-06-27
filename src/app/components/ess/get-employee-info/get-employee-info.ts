import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppBreadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';

@Component({
  selector: 'app-get-employee-info',
  standalone: true,
  imports: [CommonModule, CardModule, InputTextModule, ButtonModule, FormsModule, AppBreadcrumb],
  templateUrl: './get-employee-info.html',
  styleUrl: './get-employee-info.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GetEmployeeInfo {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Get Employee Info', icon: 'pi pi-info-circle', routerLink: '/ess/get-employee-info' }
  ];
  searchId = '';
  employeeData: any = null;

  searchEmployee(): void {
    if (!this.searchId.trim()) return;

    // Static mock data for now
    this.employeeData = {
      empId: this.searchId.toUpperCase(),
      name: 'Premanshu Dwivedi',
      designation: 'Senior Software Developer',
      department: 'Business Applications',
      email: 'premanshu.d@oblo.com',
      mobile: '+91 98215 30215',
      location: 'Delhi NCR',
      status: 'Active'
    };
  }
}
