import { Component, inject, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { DialogModule } from 'primeng/dialog';
import { Router } from '@angular/router';

import { ThemeService, AccentColor, ThemeMode } from '../shared/services/theme.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    ButtonModule,
    RippleModule,
    DialogModule
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing implements OnInit, OnDestroy {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  public themeService = inject(ThemeService);

  // Theme configuration states
  isColorMenuOpen = false;
  isThemeMenuOpen = false;
  isRolesMenuOpen = false;

  get selectedColor(): string {
    return this.themeService.accentColor();
  }

  get isDarkMode(): boolean {
    return this.themeService.isDarkModeActive();
  }

  toggleDarkMode() {
    const nextMode: ThemeMode = this.isDarkMode ? 'light' : 'dark';
    this.themeService.setThemeMode(nextMode);
  }

  toggleThemeMenu() {
    this.isThemeMenuOpen = !this.isThemeMenuOpen;
    if (this.isThemeMenuOpen) this.isColorMenuOpen = false;
  }

  selectThemeMode(mode: ThemeMode) {
    this.themeService.setThemeMode(mode);
    this.isThemeMenuOpen = false;
  }

  selectColor(color: string) {
    this.themeService.setAccentColor(color as AccentColor);
    this.isColorMenuOpen = false;
  }

  toggleColorMenu() {
    this.isColorMenuOpen = !this.isColorMenuOpen;
    if (this.isColorMenuOpen) this.isThemeMenuOpen = false;
  }


  isModuleDialogVisible = false;
  selectedModule: any = null;

  shiftProgress: number = 0;
  loggedHoursStr: string = '00h 00m 00s';
  private timer: any;

  ngOnInit() {
    this.updateShiftProgress();
    this.timer = setInterval(() => {
      this.updateShiftProgress();
      this.cdr.detectChanges();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  updateShiftProgress() {
    const now = new Date();
    const start = new Date();
    start.setHours(10, 0, 0, 0); // 10:00 AM
    const end = new Date();
    end.setHours(19, 0, 0, 0); // 07:00 PM

    let progress = 0;
    if (now < start) {
      progress = 0;
      this.loggedHoursStr = '00h 00m 00s';
    } else if (now > end) {
      progress = 100;
      this.loggedHoursStr = '09h 00m 00s';
    } else {
      const elapsedMs = now.getTime() - start.getTime();
      const totalMs = end.getTime() - start.getTime();
      progress = (elapsedMs / totalMs) * 100;

      const totalSeconds = Math.floor(elapsedMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      this.loggedHoursStr = `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    }
    this.shiftProgress = progress;
  }

  moduleDetails: any = {
    'onboarding': {
      title: 'Onboarding & Checklists',
      icon: 'pi pi-user-plus',
      lordIcon: 'https://cdn.lordicon.com/ljvjsnvh.json',
      bgClass: 'bg-indigo-50 dark:bg-indigo-950/20',
      textClass: 'text-indigo-600',
      description: 'Set up checklists for onboarding, training, or offboarding — all within StaffHub without paperwork overload.',
      features: ['One place for materials & documents to sign', 'Bank passbook & qualification marksheet uploads', 'Assign tasks to IT, HR, and Managers', 'Eliminates paper paperwork overload']
    },
    'leave': {
      title: 'Leave Management & Accruals',
      icon: 'pi pi-check-square',
      lordIcon: 'https://cdn.lordicon.com/egiwmiit.json',
      bgClass: 'bg-rose-50 dark:bg-rose-950/20',
      textClass: 'text-rose-600',
      description: 'A leave management process that makes it easy for everyone. Employees access balances and apply through the portal.',
      features: ['Simple & flexible multi-level approvals', 'Upfront or incremental leave accruals (1.0 EL / 0.5 CL)', 'Check leave calendar by location & department', 'Real-time leave balance tracking']
    },
    'regularization': {
      title: 'Attendance Regularization',
      icon: 'pi pi-clock',
      lordIcon: 'https://cdn.lordicon.com/qznlhdss.json',
      bgClass: 'bg-amber-50 dark:bg-amber-950/20',
      textClass: 'text-amber-600',
      description: 'Manage missing swipes or late marks. Verify GPS location coordinates and approve regularization requests.',
      features: ['GPS location & IP verification', 'Late coming & early departure flagging', 'Manager approval workflows', 'Full audit trail logging']
    },
    'calendar': {
      title: 'Monthly Attendance Calendar',
      icon: 'pi pi-calendar',
      lordIcon: 'https://cdn.lordicon.com/bgebyztw.json',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/20',
      textClass: 'text-emerald-600',
      description: 'Employees can view their full month\'s attendance, including daily check-in times and present/absent statuses.',
      features: ['Visual attendance color coding', 'Holiday markings & weekly offs', 'Shift schedule tracking', 'Total worked hours calculation']
    },
    'gps': {
      title: 'Live GPS Swipe & Geofencing',
      icon: 'pi pi-map-marker',
      lordIcon: 'https://cdn.lordicon.com/zzcjjxew.json',
      bgClass: 'bg-blue-50 dark:bg-blue-950/20',
      textClass: 'text-blue-600',
      description: 'Mark attendance securely with real-time GPS location tracking, office geofencing, and auto 4:00 AM swipe-out protection.',
      features: ['Geofencing radius validation', 'Accurate lat/long capturing', 'Device ID & IP address tracking', 'Auto 4:00 AM swipe-out protection']
    },
    'profile': {
      title: 'Employee Records & Directory',
      icon: 'pi pi-id-card',
      lordIcon: 'https://cdn.lordicon.com/bhfjfgqz.json',
      bgClass: 'bg-purple-50 dark:bg-purple-950/20',
      textClass: 'text-purple-600',
      description: 'Our employee management software keeps your team information in one safe, confidential, and secure place.',
      features: ['Employee directory with contact details', 'Confidential storage for records & assets', 'Works across remote & multi-office locations', 'Emergency contact & document library']
    },
    'probation': {
      title: 'Performance Reviews & Goals',
      icon: 'pi pi-user-check',
      bgClass: 'bg-amber-50 dark:bg-amber-950/20',
      textClass: 'text-amber-600',
      description: 'Seamless performance appraisals & goal tracking. Monitor 6-month probation evaluations and confirmation decisions.',
      features: ['Reusable review forms & appraisals', 'Collect feedback from managers & colleagues', 'Probation end-date tracker', 'Confirmation & extension workflows']
    },
    'expense': {
      title: 'Expense Claims & Receipts',
      icon: 'pi pi-receipt',
      bgClass: 'bg-rose-50 dark:bg-rose-950/20',
      textClass: 'text-rose-600',
      description: 'Do your employees need to submit expense claims for travel, meals, mileage, or phone costs? Included with StaffHub.',
      features: ['Easily submit claims with scanned receipts', 'Review & approval for designated managers', 'Custom cost categories for tracking', 'Fullscreen receipt photo viewer']
    },
    'ticket': {
      title: 'Support Ticket Helpdesk',
      icon: 'pi pi-ticket',
      bgClass: 'bg-purple-50 dark:bg-purple-950/20',
      textClass: 'text-purple-600',
      description: 'Raise support tickets for Administration, HR-CRG, and IT Helpdesk. CC team members and post updates.',
      features: ['3 managed support categories', 'CC team members notification', 'Activity comment timeline', 'Status resolution workflow']
    },
    'task': {
      title: 'Task Management & Kanban Boards',
      icon: 'pi pi-briefcase',
      bgClass: 'bg-blue-50 dark:bg-blue-950/20',
      textClass: 'text-blue-600',
      description: 'Assign, track, and collaborate on team tasks across projects with Kanban boards, progress sliders, and table views.',
      features: ['Kanban style task & work tracking', 'Custom status columns & progress sliders', 'Due date reminders & priority tags', 'Activity logs & task checklists']
    },
    'payroll': {
      title: 'Payroll & Other Integrations',
      icon: 'pi pi-calculator',
      bgClass: 'bg-teal-50 dark:bg-teal-950/20',
      textClass: 'text-teal-600',
      description: 'StaffHub integrates verified attendance, leaves, and salary structures to streamline monthly payroll processing.',
      features: ['Automated salary calculation', 'Deduction & allowance rules', 'Downloadable PDF salary slips', 'Payroll summary reporting']
    },
    'exit': {
      title: 'Resignation & Exit Management',
      icon: 'pi pi-file-export',
      bgClass: 'bg-indigo-50 dark:bg-indigo-950/20',
      textClass: 'text-indigo-600',
      description: 'Digital offboarding workflow to manage resignation submissions, notice period countdowns, and exit surveys.',
      features: ['Digital resignation application', 'Notice period countdown tracker', 'Exit interview feedback surveys', 'Offboarding clearance checklist']
    }
  };

  openModuleDetails(moduleKey: string) {
    this.selectedModule = this.moduleDetails[moduleKey];
    this.isModuleDialogVisible = true;
  }

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

  submitContactForm(event: Event) {
    event.preventDefault();
    alert('Thank you for reaching out! Our team will get back to you shortly.');
    (event.target as HTMLFormElement).reset();
  }
}