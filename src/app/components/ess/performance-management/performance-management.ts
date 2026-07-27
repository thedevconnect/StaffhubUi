import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { RatingModule } from 'primeng/rating';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MessageService, MenuItem } from 'primeng/api';

export interface CompetencyRating {
  id: string;
  category: string;
  title: string;
  description: string;
  selfRating: number;
  managerRating?: number;
  comments: string;
}

export interface PerformanceGoal {
  id: number;
  title: string;
  category: string;
  targetDate: string;
  progress: number;
  weightage: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'DELAYED';
  keyResults: string;
}

export interface ReviewHistory {
  cycle: string;
  year: string;
  period: string;
  overallRating: number;
  managerRating: number;
  selfRating: number;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'COMPLETED' | 'DRAFT';
  reviewedBy: string;
  comments: string;
}

export interface FeedbackItem {
  id: number;
  giverName: string;
  giverRole: string;
  avatarBg: string;
  rating: number;
  relationship: 'Manager' | 'Peer' | 'Subordinate';
  date: string;
  comment: string;
  badge: string;
}

@Component({
  selector: 'app-performance-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    RatingModule,
    ProgressBarModule,
    TagModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    ToastModule,
    BreadcrumbModule,
  ],
  templateUrl: './performance-management.html',
  styleUrl: './performance-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService],
})
export class PerformanceManagement implements OnInit {
  breadcrumbItems: MenuItem[] = [
    { label: 'ESS', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Performance Management', icon: 'pi pi-chart-line' },
  ];

  activeTab = signal<'OVERVIEW' | 'COMPETENCIES' | 'GOALS' | 'REVIEWS' | 'FEEDBACK'>('OVERVIEW');

  // Overall summary metrics
  overallRating = signal<number>(4.4);
  selfAverageRating = signal<number>(4.5);
  managerAverageRating = signal<number>(4.3);
  completedGoalsCount = signal<number>(6);
  totalGoalsCount = signal<number>(8);
  currentCycleName = signal<string>('Q2 2026 Annual Performance Review');
  currentCycleStatus = signal<string>('IN_PROGRESS');

  // Competency Ratings
  competencies = signal<CompetencyRating[]>([
    {
      id: 'comp_1',
      category: 'TECHNICAL',
      title: 'Technical Mastery & Code Quality',
      description: 'Demonstrates deep domain knowledge, writes clean maintainable code, and follows best practices.',
      selfRating: 5,
      managerRating: 4,
      comments: 'Consistently delivers high quality features with excellent code standards.',
    },
    {
      id: 'comp_2',
      category: 'PROBLEM_SOLVING',
      title: 'Problem Solving & Critical Thinking',
      description: 'Analyzes complex requirements, troubleshoots system issues efficiently, and proposes optimal architectures.',
      selfRating: 4,
      managerRating: 4,
      comments: 'Strong analytical skills in resolving production edge cases quickly.',
    },
    {
      id: 'comp_3',
      category: 'COLLABORATION',
      title: 'Team Collaboration & Communication',
      description: 'Communicates clearly with cross-functional teams, mentors junior engineers, and fosters teamwork.',
      selfRating: 5,
      managerRating: 5,
      comments: 'Proactive team player with effective communication across departments.',
    },
    {
      id: 'comp_4',
      category: 'TIMELINESS',
      title: 'Execution & Timely Delivery',
      description: 'Meets project milestones consistently, manages sprint commitments, and respects project timelines.',
      selfRating: 4,
      managerRating: 4,
      comments: 'Reliable execution with on-time sprint completions.',
    },
    {
      id: 'comp_5',
      category: 'LEADERSHIP',
      title: 'Ownership & Initiative',
      description: 'Takes ownership of key modules, drives innovation, and identifies areas for process improvements.',
      selfRating: 4,
      managerRating: 4,
      comments: 'Takes end-to-end accountability for assigned modules.',
    },
  ]);

  // OKRs / Goals
  goals = signal<PerformanceGoal[]>([
    {
      id: 1,
      title: 'Implement Database-Driven Enterprise RBAC System',
      category: 'Architecture',
      targetDate: '2026-08-15',
      progress: 95,
      weightage: 30,
      status: 'IN_PROGRESS',
      keyResults: 'Full dynamic menu tree, permission engine, role switching, and 200+ Swagger API specs.',
    },
    {
      id: 2,
      title: 'Optimize Front-End Load Time & Bundle Size',
      category: 'Performance',
      targetDate: '2026-08-30',
      progress: 100,
      weightage: 25,
      status: 'COMPLETED',
      keyResults: 'Achieved lazy loading, PrimeNG theme optimizations, and sub-second component renders.',
    },
    {
      id: 3,
      title: 'Automate Attendance & Payroll Monthly Reconciliations',
      category: 'Automation',
      targetDate: '2026-09-10',
      progress: 60,
      weightage: 25,
      status: 'IN_PROGRESS',
      keyResults: 'Integrated cron schedules for auto-swipe out and automated leave credits.',
    },
    {
      id: 4,
      title: 'Enhance Code Documentation & Unit Test Coverage',
      category: 'Quality',
      targetDate: '2026-09-30',
      progress: 40,
      weightage: 20,
      status: 'IN_PROGRESS',
      keyResults: 'Write comprehensive specs and OpenAPI documentation across all modules.',
    },
  ]);

  // Review Cycles History
  reviewHistory = signal<ReviewHistory[]>([
    {
      cycle: 'Q1 2026 Performance Review',
      year: '2026',
      period: 'Jan 2026 - Mar 2026',
      overallRating: 4.6,
      managerRating: 4.5,
      selfRating: 4.7,
      status: 'COMPLETED',
      reviewedBy: 'HR Operations / Tech Lead',
      comments: 'Exceeded expectations in lead delivery and component modularization.',
    },
    {
      cycle: 'Annual Appraisal 2025',
      year: '2025',
      period: 'Jan 2025 - Dec 2025',
      overallRating: 4.5,
      managerRating: 4.4,
      selfRating: 4.6,
      status: 'COMPLETED',
      reviewedBy: 'Engineering Manager',
      comments: 'Outstanding contributions to core HRMS infrastructure.',
    },
  ]);

  // 360 Feedback
  feedbacks = signal<FeedbackItem[]>([
    {
      id: 1,
      giverName: 'Rajesh Sharma',
      giverRole: 'Engineering Manager',
      avatarBg: 'bg-indigo-600',
      rating: 5,
      relationship: 'Manager',
      date: '15 Jul 2026',
      comment: 'Demonstrates outstanding ownership in architecting core backend features. Consistently dependable under tight deadlines.',
      badge: 'Exceeds Expectations',
    },
    {
      id: 2,
      giverName: 'Priya Verma',
      giverRole: 'Lead UI/UX Designer',
      avatarBg: 'bg-emerald-600',
      rating: 4,
      relationship: 'Peer',
      date: '10 Jul 2026',
      comment: 'Great collaboration during the UI refactoring phase. Very responsive to design feedback and detail-oriented.',
      badge: 'Great Collaborator',
    },
    {
      id: 3,
      giverName: 'Amit Patel',
      giverRole: 'Senior QA Engineer',
      avatarBg: 'bg-amber-600',
      rating: 5,
      relationship: 'Peer',
      date: '02 Jul 2026',
      comment: 'Clean API integration and minimal bug regression during feature handoffs. Excellent developer testing.',
      badge: 'Quality Champion',
    },
  ]);

  // Modals state
  showGoalModal = false;
  showSelfAppraisalModal = false;
  goalForm!: FormGroup;

  categoryOptions = [
    { label: 'Architecture & Technical', value: 'Architecture' },
    { label: 'Performance & Optimization', value: 'Performance' },
    { label: 'Automation & Productivity', value: 'Automation' },
    { label: 'Quality & Process', value: 'Quality' },
    { label: 'Leadership & Teamwork', value: 'Leadership' },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.goalForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      category: ['Architecture', Validators.required],
      targetDate: ['', Validators.required],
      weightage: [20, [Validators.required, Validators.min(5), Validators.max(100)]],
      keyResults: ['', Validators.required],
    });
  }

  setTab(tab: 'OVERVIEW' | 'COMPETENCIES' | 'GOALS' | 'REVIEWS' | 'FEEDBACK'): void {
    this.activeTab.set(tab);
  }

  onSelfRatingChange(comp: CompetencyRating, newRating: number): void {
    const updated = this.competencies().map((c) =>
      c.id === comp.id ? { ...c, selfRating: newRating } : c
    );
    this.competencies.set(updated);
    this.recalculateSelfAverage();
    this.messageService.add({
      severity: 'info',
      summary: 'Rating Updated',
      detail: `Updated self-rating for ${comp.title} to ${newRating} stars.`,
      life: 2500,
    });
  }

  private recalculateSelfAverage(): void {
    const list = this.competencies();
    if (!list.length) return;
    const sum = list.reduce((acc, curr) => acc + curr.selfRating, 0);
    const avg = Number((sum / list.length).toFixed(1));
    this.selfAverageRating.set(avg);
  }

  openAddGoalModal(): void {
    this.goalForm.reset({
      category: 'Architecture',
      weightage: 20,
      targetDate: new Date().toISOString().split('T')[0],
    });
    this.showGoalModal = true;
  }

  saveGoal(): void {
    if (this.goalForm.invalid) {
      this.goalForm.markAllAsTouched();
      return;
    }

    const val = this.goalForm.value;
    const newGoal: PerformanceGoal = {
      id: Date.now(),
      title: val.title,
      category: val.category,
      targetDate: val.targetDate,
      progress: 0,
      weightage: Number(val.weightage),
      status: 'IN_PROGRESS',
      keyResults: val.keyResults,
    };

    this.goals.update((current) => [newGoal, ...current]);
    this.totalGoalsCount.update((cnt) => cnt + 1);

    this.messageService.add({
      severity: 'success',
      summary: 'Goal Created',
      detail: 'New performance goal added successfully.',
    });

    this.showGoalModal = false;
  }

  submitSelfAppraisal(): void {
    this.currentCycleStatus.set('SUBMITTED');
    this.messageService.add({
      severity: 'success',
      summary: 'Self Appraisal Submitted',
      detail: 'Your performance evaluation has been submitted to your manager for review.',
      life: 4000,
    });
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
      case 'UNDER_REVIEW':
      case 'SUBMITTED':
        return 'info';
      case 'ON_HOLD':
      case 'DRAFT':
        return 'warn';
      case 'DELAYED':
        return 'danger';
      default:
        return 'secondary';
    }
  }
}
