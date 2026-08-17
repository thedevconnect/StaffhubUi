import { Component, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService, TaskStats, TaskItem, TaskDetailResponse } from '../../shared/services/task.service';
import { AuthService } from '../../shared/services/services/auth.service';
import { MenuItem, MessageService, ConfirmationService } from 'primeng/api';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TabsModule } from 'primeng/tabs';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { SliderModule } from 'primeng/slider';
import { TextareaModule } from 'primeng/textarea';
import { Breadcrumb } from 'primeng/breadcrumb';
import { DatePickerModule } from 'primeng/datepicker';

import { TableTemplate, TableColumn, TableAction } from '../../shared/ui/table-template/table-template';

@Component({
  selector: 'app-work-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    Breadcrumb,
    TableModule,
    TableTemplate,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    ProgressBarModule,
    DialogModule,
    DrawerModule,
    ToastModule,
    ConfirmDialogModule,
    TabsModule,
    BadgeModule,
    TooltipModule,
    SliderModule,
    TextareaModule,
    DatePickerModule
  ],

  providers: [MessageService, ConfirmationService],
  templateUrl: './work-management.html',
  styleUrls: ['./work-management.scss']
})
export class WorkManagementComponent implements OnInit {
  breadcrumbItems: any[] = [
    { label: 'Employee Self Service', icon: 'pi pi-home', routerLink: '/ess' },
    { label: 'Task Management', icon: 'pi pi-briefcase', routerLink: '/ess/task-management' }
  ];

  isFormFullscreen = signal(false);

  toggleFormFullscreen(): void {
    this.isFormFullscreen.update(v => !v);
    this.cdr.markForCheck();
  }

  // Section Minimize / Maximize states
  isHeaderSectionMinimized = false;
  isStatsMinimized = false;
  isTableSectionMinimized = false;


  columns: TableColumn[] = [
    { key: 'actions', header: 'Actions', isVisible: true },
    { key: 'issue_type', header: 'Type', isSortable: true, isCustom: true },
    { key: 'task_code', header: 'Task Code', isSortable: true, isCustom: true },
    { key: 'title', header: 'Title & Category', isSortable: true, isCustom: true },
    { key: 'assignee_name', header: 'Assignee', isSortable: true, isCustom: true },
    { key: 'priority', header: 'Priority', isSortable: true, isCustom: true },
    { key: 'status', header: 'Status', isSortable: true, isCustom: true },
    { key: 'progress', header: 'Progress', isCustom: true },
    { key: 'start_date', header: 'Start Date', isSortable: true, isCustom: true },
    { key: 'due_date', header: 'Due Date', isSortable: true, isCustom: true },
    { key: 'hours_logged', header: 'Logged / Est', isCustom: true },
    { key: 'created_at', header: 'Created Date', isSortable: true, isCustom: true }
  ];


  tableActions: TableAction[] = [
    { id: 'view', label: 'View Details', icon: 'pi pi-eye' },
    { id: 'edit', label: 'Edit Task', icon: 'pi pi-pencil' },
    { id: 'complete', label: 'Mark Completed', icon: 'pi pi-check' },
    { id: 'delete', label: 'Delete Task', icon: 'pi pi-trash' }
  ];

  onActionClicked(event: { actionId: string; row: TaskItem }): void {
    if (event.actionId === 'view') {
      this.openTaskDetail(event.row);
    } else if (event.actionId === 'edit') {
      this.openEditTaskModal(event.row);
    } else if (event.actionId === 'complete') {
      this.quickStatusChange(event.row, 'COMPLETED');
    } else if (event.actionId === 'delete') {
      this.deleteTask(event.row);
    }
  }
  tasks: TaskItem[] = [];
  stats: TaskStats = {
    totalTasks: 0,
    todoCount: 0,
    inProgressCount: 0,
    inReviewCount: 0,
    completedCount: 0,
    cancelledCount: 0,
    overdueCount: 0,
    urgentCount: 0,
    highCount: 0
  };

  employees: any[] = [];
  loading = false;
  totalRecords = 0;
  page = 1;
  limit = 10;

  searchQuery = '';
  selectedStatus = 'ALL';
  selectedPriority = 'ALL';
  selectedCategory = 'ALL';
  selectedIssueType = 'ALL';
  selectedScope = 'all';
  viewMode: 'table' | 'kanban' = 'table';

  issueTypeOptions = [
    { label: 'All Types', value: 'ALL', icon: 'pi pi-filter', color: 'text-slate-500', badgeClass: 'bg-slate-100 text-slate-700' },
    { label: 'Task', value: 'TASK', icon: 'pi pi-check-square', color: 'text-blue-600', badgeClass: 'bg-blue-100 text-blue-700 border-blue-200' },
    { label: 'Bug / Defect', value: 'BUG', icon: 'pi pi-exclamation-circle', color: 'text-rose-600', badgeClass: 'bg-rose-100 text-rose-700 border-rose-200' },
    { label: 'User Story', value: 'STORY', icon: 'pi pi-book', color: 'text-emerald-600', badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { label: 'Feature', value: 'FEATURE', icon: 'pi pi-star', color: 'text-purple-600', badgeClass: 'bg-purple-100 text-purple-700 border-purple-200' },
    { label: 'Epic', value: 'EPIC', icon: 'pi pi-bolt', color: 'text-amber-600', badgeClass: 'bg-amber-100 text-amber-700 border-amber-200' },
    { label: 'Sub-task', value: 'SUBTASK', icon: 'pi pi-paperclip', color: 'text-indigo-600', badgeClass: 'bg-indigo-100 text-indigo-700 border-indigo-200' }
  ];

  statusOptions = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'To Do', value: 'TODO' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'In Review', value: 'IN_REVIEW' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ];

  priorityOptions = [
    { label: 'All Priorities', value: 'ALL' },
    { label: 'Urgent', value: 'URGENT' },
    { label: 'High', value: 'HIGH' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'Low', value: 'LOW' }
  ];

  categoryOptions = [
    { label: 'All Categories', value: 'ALL' },
    { label: 'General', value: 'GENERAL' },
    { label: 'Development', value: 'DEVELOPMENT' },
    { label: 'Design', value: 'DESIGN' },
    { label: 'Testing/QA', value: 'TESTING' },
    { label: 'Documentation', value: 'DOCUMENTATION' },
    { label: 'Bug Fix', value: 'BUG_FIX' },
    { label: 'HR/Admin Task', value: 'HR_TASK' }
  ];

  scopeOptions = [
    { label: 'All Accessible Tasks', value: 'all' },
    { label: 'Assigned to Me', value: 'assigned_me' },
    { label: 'Created by Me', value: 'created_me' }
  ];

  // Create / Edit Modal
  showTaskModal = false;
  isEditMode = false;
  editingTaskId: number | null = null;
  taskForm!: FormGroup;

  // Subtask, Label & Screenshot builder in Create/Edit modal
  newInitialSubtaskInput = '';
  initialSubtasksList: string[] = [];
  formTagInput = '';
  formLabelsList: string[] = [];
  initialScreenshots: Array<{ fileName: string; fileUrl: string; fileType: string; fileSize: string; isImage: boolean }> = [];

  // Task Detail Modal / Drawer Panel
  showDetailModal = false;
  selectedTask: TaskDetailResponse | null = null;
  activeDetailTab = 0;
  newCommentText = '';
  uploadingFile = false;
  newSubtaskInput = '';


  // Worklog Modal
  showWorklogModal = false;
  worklogHours = 1;
  worklogDate = new Date().toISOString().split('T')[0];
  worklogDescription = '';

  currentUserId = 0;
  userRole = '';

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const user = this.authService.user();
    this.currentUserId = user?.id || 0;
    this.userRole = this.authService.selectedRoleId() || '';

    this.updateBreadcrumbs();
    this.initForm();
    this.loadEmployees();
    this.loadStats();
    this.loadTasks();
  }

  updateBreadcrumbs(): void {
    const currentUrl = this.router.url || '';
    const rawRoleId = (this.userRole || '').toLowerCase();
    let rootPath = '/ess';
    let rootLabel = 'Employee Self Service';

    if (currentUrl.includes('/superadmin') || rawRoleId === 'super_admin' || rawRoleId === 'superadmin') {
      rootPath = '/superadmin';
      rootLabel = 'Super Admin';
    } else if (currentUrl.includes('/hradmin') || rawRoleId === 'hr_admin' || rawRoleId === 'hradmin') {
      rootPath = '/hradmin';
      rootLabel = 'HR Admin';
    } else if (currentUrl.includes('/developer') || rawRoleId === 'developer') {
      rootPath = '/developer';
      rootLabel = 'Developer';
    }

    this.breadcrumbItems = [
      { label: rootLabel, icon: rootLabel === 'Super Admin' ? 'pi pi-user' : 'pi pi-home', routerLink: rootPath },
      { label: 'Task Management', icon: 'pi pi-briefcase', routerLink: `${rootPath}/task-management` }
    ];
    this.cdr.markForCheck();
  }

  getTodayDateString(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  formatDateForBackend(val: any): string | null {
    if (!val) return null;
    if (val instanceof Date) {
      const yyyy = val.getFullYear();
      const mm = String(val.getMonth() + 1).padStart(2, '0');
      const dd = String(val.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    if (typeof val === 'string') {
      return val.split('T')[0];
    }
    return null;
  }

  initForm(): void {
    const today = this.getTodayDateString();
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      description: [''],
      category: ['GENERAL', Validators.required],
      issue_type: ['TASK', Validators.required],
      priority: ['MEDIUM', Validators.required],
      status: ['TODO', Validators.required],
      assigned_to: [this.currentUserId || '', Validators.required],
      start_date: [today],
      due_date: [today],
      estimated_hours: [0],
      logged_hours: [0],
      progress: [0]
    });
  }


  loadEmployees(): void {
    this.taskService.getEmployees().subscribe({
      next: (res) => {
        if (res.success) {
          this.employees = res.data.map((emp: any) => ({
            label: `${emp.full_name} (${emp.emp_id || 'Emp'})`,
            value: emp.id
          }));
          this.cdr.markForCheck();
        }
      },
      error: (err) => console.error('Error loading employees:', err)
    });
  }

  loadStats(): void {
    this.taskService.getTaskStats().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.stats = res.data;
          this.cdr.markForCheck();
        }
      },
      error: (err) => console.error('Error loading task stats:', err)
    });
  }

  loadTasks(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.taskService
      .getTasks({
        search: this.searchQuery,
        status: this.selectedStatus,
        priority: this.selectedPriority,
        category: this.selectedCategory,
        issueType: this.selectedIssueType,
        scope: this.selectedScope,
        page: this.page,
        limit: this.limit
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          if (res.success) {
            this.tasks = res.data || [];
            this.totalRecords = res.pagination?.totalItems || 0;
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'Failed to load tasks'
          });
          this.cdr.markForCheck();
        }
      });
  }

  onSearch(): void {
    this.page = 1;
    this.loadTasks();
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadTasks();
  }

  onPageChange(event: any): void {
    this.page = Math.floor(event.first / event.rows) + 1;
    this.limit = event.rows;
    this.loadTasks();
  }

  // Full Image Preview Modal Dialog
  previewImageUrl: string | null = null;
  previewImageTitle: string | null = null;
  showImagePreviewModal = false;

  openImagePreview(url: string, title?: string): void {
    this.previewImageUrl = url;
    this.previewImageTitle = title || 'Screenshot Preview';
    this.showImagePreviewModal = true;
    this.cdr.markForCheck();
  }

  openCreateTaskModal(): void {
    this.isEditMode = false;
    this.editingTaskId = null;
    this.initialSubtasksList = [];
    this.newInitialSubtaskInput = '';
    this.formLabelsList = [];
    this.formTagInput = '';
    this.initialScreenshots = [];
    const today = this.getTodayDateString();
    this.taskForm.reset({
      title: '',
      description: '',
      category: 'GENERAL',
      issue_type: 'TASK',
      priority: 'MEDIUM',
      status: 'TODO',
      assigned_to: this.currentUserId || (this.employees[0]?.value ?? ''),
      start_date: today,
      due_date: today,
      estimated_hours: 0,
      logged_hours: 0,
      progress: 0
    });
    this.showTaskModal = true;
  }

  openEditTaskModal(task: TaskItem): void {
    this.isEditMode = true;
    this.editingTaskId = task.id;
    this.initialSubtasksList = [];
    this.newInitialSubtaskInput = '';
    this.formLabelsList = this.getLabelsArray(task.labels);
    this.formTagInput = '';
    this.initialScreenshots = [];
    this.taskForm.patchValue({
      title: task.title,
      description: task.description || '',
      category: task.category || 'GENERAL',
      issue_type: task.issue_type || 'TASK',
      priority: task.priority || 'MEDIUM',
      status: task.status || 'TODO',
      assigned_to: task.assigned_to,
      start_date: task.start_date ? task.start_date.split('T')[0] : '',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      estimated_hours: task.estimated_hours || 0,
      logged_hours: task.logged_hours || 0,
      progress: task.progress || 0
    });
    this.showTaskModal = true;
  }

  // Screenshots & Attachments in Task Creator
  onFormScreenshotsSelected(event: any): void {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const fileUrl = e.target.result;
        const fileSizeStr = this.formatFileSize(file.size);
        const isImage = file.type.startsWith('image/');

        this.initialScreenshots.push({
          fileName: file.name,
          fileUrl,
          fileType: file.type,
          fileSize: fileSizeStr,
          isImage
        });
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  }

  removeInitialScreenshot(index: number): void {
    this.initialScreenshots.splice(index, 1);
    this.cdr.markForCheck();
  }

  onPasteScreenshot(event: ClipboardEvent): void {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            const fileName = `Screenshot_${new Date().getTime()}.png`;
            this.initialScreenshots.push({
              fileName,
              fileUrl: e.target.result,
              fileType: file.type,
              fileSize: this.formatFileSize(file.size),
              isImage: true
            });
            this.messageService.add({ severity: 'info', summary: 'Screenshot Pasted', detail: `${fileName} attached from clipboard` });
            this.cdr.markForCheck();
          };
          reader.readAsDataURL(file);
        }
      }
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Tag / Label Helpers
  addFormTag(): void {
    const tag = this.formTagInput.trim().replace(/^#/, '');
    if (tag && !this.formLabelsList.includes(tag)) {
      this.formLabelsList.push(tag);
    }
    this.formTagInput = '';
  }

  removeFormTag(index: number): void {
    this.formLabelsList.splice(index, 1);
  }

  // Initial Subtask Helpers in Create modal
  addInitialSubtask(): void {
    const title = this.newInitialSubtaskInput.trim();
    if (title) {
      this.initialSubtasksList.push(title);
      this.newInitialSubtaskInput = '';
    }
  }

  removeInitialSubtask(index: number): void {
    this.initialSubtasksList.splice(index, 1);
  }

  saveTask(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const formVal = this.taskForm.value;
    const payload = {
      ...formVal,
      start_date: this.formatDateForBackend(formVal.start_date),
      due_date: this.formatDateForBackend(formVal.due_date),
      labels: this.formLabelsList.join(','),
      initialSubtasks: this.initialSubtasksList,
      screenshots: this.initialScreenshots
    };



    if (this.isEditMode && this.editingTaskId) {
      this.taskService.updateTask(this.editingTaskId, payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Task Updated',
            detail: 'Task updated successfully.'
          });
          this.showTaskModal = false;
          this.loadStats();
          this.loadTasks();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'Failed to update task'
          });
        }
      });
    } else {
      this.taskService.createTask(payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Task Created',
            detail: 'New task created successfully.'
          });
          this.showTaskModal = false;
          this.loadStats();
          this.loadTasks();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'Failed to create task'
          });
        }
      });
    }
  }

  quickStatusChange(task: TaskItem, newStatus: string): void {
    const progress = newStatus === 'COMPLETED' ? 100 : task.progress || 0;
    this.taskService.updateTaskStatus(task.id, newStatus, progress).subscribe({
      next: () => {
        task.status = newStatus as any;
        task.progress = progress;
        this.messageService.add({
          severity: 'success',
          summary: 'Status Updated',
          detail: `Task marked as ${newStatus}`
        });
        this.loadStats();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Failed to update status'
        });
      }
    });
  }

  deleteTask(task: TaskItem): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete task "${task.task_code}: ${task.title}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.taskService.deleteTask(task.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Task Deleted',
              detail: 'Task removed successfully.'
            });
            this.loadStats();
            this.loadTasks();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err?.error?.message || 'Failed to delete task'
            });
          }
        });
      }
    });
  }

  openTaskDetail(task: TaskItem): void {
    this.taskService.getTaskById(task.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedTask = res.data;
          this.activeDetailTab = 0;
          this.showDetailModal = true;
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Failed to load task details'
        });
        this.cdr.markForCheck();
      }
    });
  }

  refreshTaskDetail(): void {
    if (!this.selectedTask) return;
    this.taskService.getTaskById(this.selectedTask.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedTask = res.data;
          this.cdr.markForCheck();
        }
      }
    });
  }

  // Interactive Subtasks in Drawer
  addSubtaskToSelectedTask(): void {
    if (!this.selectedTask || !this.newSubtaskInput.trim()) return;
    const title = this.newSubtaskInput.trim();
    this.taskService.addSubtask(this.selectedTask.id, title, this.selectedTask.assigned_to).subscribe({
      next: () => {
        this.newSubtaskInput = '';
        this.messageService.add({
          severity: 'success',
          summary: 'Subtask Added',
          detail: 'New subtask created.'
        });
        this.refreshTaskDetail();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Failed to add subtask'
        });
      }
    });
  }

  toggleSubtaskStatus(subtask: any): void {
    const nextState = !subtask.is_completed;
    this.taskService.toggleSubtask(subtask.id, nextState).subscribe({
      next: () => {
        subtask.is_completed = nextState;
        this.refreshTaskDetail();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Failed to update subtask'
        });
      }
    });
  }

  deleteSubtask(subtask: any): void {
    this.taskService.deleteSubtask(subtask.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Subtask Deleted',
          detail: 'Subtask removed.'
        });
        this.refreshTaskDetail();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Failed to delete subtask'
        });
      }
    });
  }

  // Worklog Modal Actions
  openWorklogModal(): void {
    this.worklogHours = 1;
    this.worklogDate = new Date().toISOString().split('T')[0];
    this.worklogDescription = '';
    this.showWorklogModal = true;
  }

  saveWorklog(): void {
    if (!this.selectedTask || !this.worklogHours || this.worklogHours <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Input',
        detail: 'Please enter valid work hours.'
      });
      return;
    }

    this.taskService
      .logWork(this.selectedTask.id, {
        hours_logged: this.worklogHours,
        work_date: this.worklogDate,
        description: this.worklogDescription
      })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Work Logged',
            detail: `Logged ${this.worklogHours} hours on task.`
          });
          this.showWorklogModal = false;
          this.refreshTaskDetail();
          this.loadTasks();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'Failed to log work'
          });
        }
      });
  }

  postComment(): void {
    if (!this.selectedTask || !this.newCommentText.trim()) return;

    this.taskService.addComment(this.selectedTask.id, this.newCommentText.trim()).subscribe({
      next: () => {
        this.newCommentText = '';
        this.messageService.add({
          severity: 'success',
          summary: 'Comment Posted',
          detail: 'Your comment was added.'
        });
        this.refreshTaskDetail();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Failed to add comment'
        });
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0 || !this.selectedTask) return;

    const file = input.files[0];
    const reader = new FileReader();

    this.uploadingFile = true;
    reader.onload = () => {
      const fileUrl = reader.result as string;
      const fileSize = (file.size / 1024).toFixed(1) + ' KB';

      this.taskService
        .uploadAttachment(this.selectedTask!.id, {
          fileName: file.name,
          fileUrl,
          fileType: file.type || 'file',
          fileSize
        })
        .subscribe({
          next: () => {
            this.uploadingFile = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Attachment Uploaded',
              detail: `${file.name} uploaded successfully.`
            });
            input.value = '';
            this.refreshTaskDetail();
          },
          error: (err) => {
            this.uploadingFile = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Upload Failed',
              detail: err?.error?.message || 'Failed to upload attachment'
            });
          }
        });
    };
    reader.readAsDataURL(file);
  }

  deleteAttachment(attachmentId: number): void {
    this.taskService.deleteAttachment(attachmentId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Attachment Removed',
          detail: 'File attachment deleted.'
        });
        this.refreshTaskDetail();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Failed to delete attachment'
        });
      }
    });
  }

  // Issue Type & Tag Helpers
  getIssueTypeDetails(typeStr?: string) {
    const found = this.issueTypeOptions.find((opt) => opt.value === typeStr);
    if (found && found.value !== 'ALL') return found;
    return {
      label: 'Task',
      value: 'TASK',
      icon: 'pi pi-check-square',
      color: 'text-blue-600',
      badgeClass: 'bg-blue-100 text-blue-700 border-blue-200'
    };
  }

  getLabelsArray(labelsStr?: string): string[] {
    if (!labelsStr) return [];
    return labelsStr
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  getSubtaskProgressPercent(subtasks?: any[]): number {
    if (!subtasks || subtasks.length === 0) return 0;
    const done = subtasks.filter((st) => st.is_completed).length;
    return Math.round((done / subtasks.length) * 100);
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'info';
      case 'IN_REVIEW':
        return 'warn';
      case 'CANCELLED':
        return 'danger';
      case 'TODO':
      default:
        return 'secondary';
    }
  }

  getPrioritySeverity(priority: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (priority) {
      case 'URGENT':
        return 'danger';
      case 'HIGH':
        return 'warn';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
      default:
        return 'secondary';
    }
  }

  getKanbanTasksByStatus(status: string): TaskItem[] {
    return this.tasks.filter((t) => t.status === status);
  }
}
