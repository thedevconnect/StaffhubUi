import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
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

  // Theme configuration states
  selectedColor = 'indigo';
  isDarkMode = false;
  isColorMenuOpen = false;

  colorsList = ['indigo', 'emerald', 'violet', 'orange', 'amber', 'rose', 'blue', 'red'];

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

  toggleDarkMode() {
    const hasDark = document.documentElement.classList.contains('dark');
    if (hasDark) {
      document.documentElement.classList.remove('dark');
      this.isDarkMode = false;
    } else {
      document.documentElement.classList.add('dark');
      this.isDarkMode = true;
    }
  }

  selectColor(color: string) {
    this.selectedColor = color;
    this.isColorMenuOpen = false;
  }

  toggleColorMenu() {
    this.isColorMenuOpen = !this.isColorMenuOpen;
  }

  // Get active text color class
  get textColor() {
    const map: any = {
      indigo: 'text-indigo-600',
      emerald: 'text-emerald-600',
      violet: 'text-violet-600',
      orange: 'text-orange-500',
      amber: 'text-amber-500',
      rose: 'text-rose-600',
      blue: 'text-blue-600',
      red: 'text-red-600',
    };
    return map[this.selectedColor] || 'text-indigo-600';
  }

  // Get active bg class
  get bgClass() {
    const map: any = {
      indigo: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500/20',
      emerald: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500/20',
      violet: 'bg-violet-600 hover:bg-violet-700 focus:ring-violet-500/20',
      orange: 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-500/20',
      amber: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500/20',
      rose: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500/20',
      blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/20',
      red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500/20'
    };
    return map[this.selectedColor] || 'bg-indigo-600 hover:bg-indigo-700';
  }

  // Get active border class
  get borderClass() {
    const map: any = {
      indigo: 'border-indigo-600 hover:bg-indigo-50/50 text-indigo-600 dark:hover:bg-indigo-950/20',
      emerald: 'border-emerald-600 hover:bg-emerald-50/50 text-emerald-600 dark:hover:bg-emerald-950/20',
      violet: 'border-violet-600 hover:bg-violet-50/50 text-violet-600 dark:hover:bg-violet-950/20',
      orange: 'border-orange-500 hover:bg-orange-50/50 text-orange-500 dark:hover:bg-orange-950/20',
      amber: 'border-amber-500 hover:bg-amber-50/50 text-amber-500 dark:hover:bg-amber-950/20',
      rose: 'border-rose-600 hover:bg-rose-50/50 text-rose-600 dark:hover:bg-rose-950/20',
      blue: 'border-blue-600 hover:bg-blue-50/50 text-blue-600 dark:hover:bg-blue-950/20',
      red: 'border-red-600 hover:bg-red-50/50 text-red-600 dark:hover:bg-red-950/20'
    };
    return map[this.selectedColor] || 'border-indigo-600 text-indigo-600';
  }

  // Get gradient background class
  get heroGradient() {
    const map: any = {
      indigo: 'from-indigo-600 via-indigo-700 to-emerald-500',
      emerald: 'from-emerald-600 via-emerald-700 to-teal-500',
      violet: 'from-violet-600 via-violet-700 to-pink-500',
      orange: 'from-orange-500 via-orange-600 to-yellow-500',
      amber: 'from-amber-500 via-amber-600 to-orange-500',
      rose: 'from-rose-600 via-rose-700 to-purple-500',
      blue: 'from-blue-600 via-blue-700 to-sky-500',
      red: 'from-red-600 via-red-700 to-orange-600'
    };
    return map[this.selectedColor] || 'from-indigo-600 via-indigo-700 to-emerald-500';
  }

  // Get active outline text class (for subtle details)
  get textTintClass() {
    const map: any = {
      indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300',
      emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300',
      violet: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-300',
      orange: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-300',
      amber: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300',
      rose: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300',
      blue: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300',
      red: 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-300'
    };
    return map[this.selectedColor] || 'text-indigo-600 bg-indigo-50';
  }

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