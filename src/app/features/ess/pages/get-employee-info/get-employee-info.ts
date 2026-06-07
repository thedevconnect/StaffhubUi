import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-get-employee-info',
  standalone: true,
  imports: [CommonModule, CardModule, InputTextModule, ButtonModule, FormsModule],
  templateUrl: './get-employee-info.html',
  styleUrl: './get-employee-info.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GetEmployeeInfo {
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
