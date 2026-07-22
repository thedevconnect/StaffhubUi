import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskService, TaskStats, TaskItem, TaskDetailResponse } from '../../shared/services/task.service';
import { AuthService } from '../../shared/services/services/auth.service';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem, MessageService, ConfirmationService } from 'primeng/api';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TabsModule } from 'primeng/tabs';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { SliderModule } from 'primeng/slider';
import { TextareaModule } from 'primeng/textarea';

import { TableTemplate, TableColumn, TableAction } from '../../shared/ui/table-template/table-template';

@Component({
  selector: 'app-work-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BreadcrumbModule,
    TableModule,
    TableTemplate,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    ProgressBarModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    TabsModule,
    BadgeModule,
    TooltipModule,
    SliderModule,
    TextareaModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './work-management.html',
  styleUrls: ['./work-management.scss']
})
export class WorkManagementComponent implements OnInit {
  breadcrumbItems: MenuItem[] = [
    { icon: 'pi pi-home', routerLink: '/' },
    { label: 'Work Management' }
  ];

  columns: TableColumn[] = [
    { key: 'task_code', header: 'Task Code', isSortable: true, isCustom: true },
    { key: 'title', header: 'Title & Category', isSortable: true, isCustom: true },
    { key: 'assignee_name', header: 'Assignee', isSortable: true, isCustom: true },
    { key: 'priority', header: 'Priority', isSortable: true, isCustom: true },
    { key: 'status', header: 'Status', isSortable: true, isCustom: true },
    { key: 'progress', header: 'Progress', isCustom: true },
    { key: 'due_date', header: 'Due Date', isSortable: true, isCustom: true }
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
  selectedScope = 'all';
  viewMode: 'table' | 'kanban' = 'table';

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
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' },
    { label: 'Urgent', value: 'URGENT' }
  ];

  categoryOptions = [
    { label: 'All Categories', value: 'ALL' },
    { label: 'General', value: 'GENERAL' },
    { label: 'Development', value: 'DEVELOPMENT' },
    { label: 'HR & Onboarding', value: 'HR' },
    { label: 'Design & UI/UX', value: 'DESIGN' },
    { label: 'Marketing', value: 'MARKETING' },
    { label: 'Payroll & Finance', value: 'PAYROLL' }
  ];

  scopeOptions = [
    { label: 'All Tasks', value: 'all' },
    { label: 'Assigned to Me', value: 'assigned_to_me' },
    { label: 'Created by Me', value: 'created_by_me' }
  ];

  // Create / Edit Modal
  showTaskModal = false;
  isEditMode = false;
  editingTaskId: number | null = null;
  taskForm!: FormGroup;

  // Task Detail Modal
  showDetailModal = false;
  selectedTask: TaskDetailResponse | null = null;
  activeDetailTab = 0;
  newCommentText = '';
  uploadingFile = false;

  currentUserId = 0;
  userRole = '';

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    const user = this.authService.user();
    this.currentUserId = user?.id || 0;
    this.userRole = this.authService.selectedRoleId() || '';

    this.initForm();
    this.loadEmployees();
    this.loadStats();
    this.loadTasks();
  }

  initForm(): void {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      description: [''],
      category: ['GENERAL', Validators.required],
      priority: ['MEDIUM', Validators.required],
      status: ['TODO', Validators.required],
      assigned_to: [this.currentUserId || '', Validators.required],
      due_date: [''],
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
        }
      },
      error: (err) => console.error('Error loading task stats:', err)
    });
  }

  loadTasks(): void {
    this.loading = true;
    this.taskService
      .getTasks({
        search: this.searchQuery,
        status: this.selectedStatus,
        priority: this.selectedPriority,
        category: this.selectedCategory,
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
        },
        error: (err) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'Failed to load tasks'
          });
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

  openCreateTaskModal(): void {
    this.isEditMode = false;
    this.editingTaskId = null;
    this.taskForm.reset({
      title: '',
      description: '',
      category: 'GENERAL',
      priority: 'MEDIUM',
      status: 'TODO',
      assigned_to: this.currentUserId || (this.employees[0]?.value ?? ''),
      due_date: '',
      estimated_hours: 0,
      logged_hours: 0,
      progress: 0
    });
    this.showTaskModal = true;
  }

  openEditTaskModal(task: TaskItem): void {
    this.isEditMode = true;
    this.editingTaskId = task.id;
    this.taskForm.patchValue({
      title: task.title,
      description: task.description || '',
      category: task.category || 'GENERAL',
      priority: task.priority || 'MEDIUM',
      status: task.status || 'TODO',
      assigned_to: task.assigned_to,
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      estimated_hours: task.estimated_hours || 0,
      logged_hours: task.logged_hours || 0,
      progress: task.progress || 0
    });
    this.showTaskModal = true;
  }

  saveTask(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const payload = this.taskForm.value;

    if (this.isEditMode && this.editingTaskId) {
      this.taskService.updateTask(this.editingTaskId, payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Task Updated',
            detail: 'Task has been updated successfully.'
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
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Failed to load task details'
        });
      }
    });
  }

  refreshTaskDetail(): void {
    if (!this.selectedTask) return;
    this.taskService.getTaskById(this.selectedTask.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedTask = res.data;
        }
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
