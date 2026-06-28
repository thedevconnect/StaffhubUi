
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  imports: [
    CommonModule,
    ButtonModule,
    RippleModule
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {
  private router = inject(Router);



  features = [
    {
      icon: 'pi pi-users',
      title: 'Employee Management',
      description:
        'Maintain employee records, profiles, departments, and documents from one place.'
    },
    {
      icon: 'pi pi-calendar',
      title: 'Attendance Management',
      description:
        'Track employee attendance, shifts, overtime, and working hours.'
    },
    {
      icon: 'pi pi-wallet',
      title: 'Payroll',
      description:
        'Generate salaries with automatic calculations and deductions.'
    },
    {
      icon: 'pi pi-briefcase',
      title: 'Recruitment',
      description:
        'Manage hiring, interviews, onboarding, and candidate tracking.'
    },
    {
      icon: 'pi pi-chart-line',
      title: 'Reports & Analytics',
      description:
        'Generate insightful HR reports and analytics for better decisions.'
    },
    {
      icon: 'pi pi-shield',
      title: 'Role Based Access',
      description:
        'Secure access for Admin, HR, Manager, and Employees.'
    }
  ];

  login(): void {
    this.router.navigate(['/login']);
  }

  registerCompany(): void {
    this.router.navigate(['/register-company']);
  }

  scrollTo(id: string): void {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }

  exploreFeatures(): void {
    this.scrollTo('features');
  }
}