import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TaskSubtask {
  id: number;
  task_id: number;
  title: string;
  is_completed: number | boolean;
  assigned_to?: number;
  assignee_name?: string;
  created_at?: string;
}

export interface TaskWorklog {
  id: number;
  task_id: number;
  user_id: number;
  hours_logged: number;
  work_date: string;
  description?: string;
  created_at?: string;
  user_name?: string;
}

export interface TaskItem {
  id: number;
  company_id: number;
  task_code: string;
  title: string;
  description?: string;
  category: string;
  issue_type?: 'TASK' | 'BUG' | 'STORY' | 'FEATURE' | 'EPIC' | 'SUBTASK';
  labels?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigned_to: number;
  created_by: number;
  start_date?: string;
  due_date?: string;
  estimated_hours?: number;
  logged_hours?: number;
  progress?: number;
  created_at?: string;
  updated_at?: string;
  assignee_name?: string;
  assignee_email?: string;
  assignee_emp_id?: string;
  creator_name?: string;
  creator_email?: string;
  comments_count?: number;
  attachments_count?: number;
  subtask_total?: number;
  subtask_completed?: number;
}

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  comment: string;
  created_at: string;
  user_name: string;
  user_email?: string;
}

export interface TaskAttachment {
  id: number;
  task_id: number;
  user_id: number;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: string;
  created_at: string;
  user_name: string;
}

export interface TaskActivityLog {
  id: number;
  task_id: number;
  user_id: number;
  action: string;
  description: string;
  created_at: string;
  user_name: string;
}

export interface TaskDetailResponse extends TaskItem {
  subtasks?: TaskSubtask[];
  worklogs?: TaskWorklog[];
  comments: TaskComment[];
  attachments: TaskAttachment[];
  activityLogs: TaskActivityLog[];
}

export interface TaskStats {
  totalTasks: number;
  todoCount: number;
  inProgressCount: number;
  inReviewCount: number;
  completedCount: number;
  cancelledCount: number;
  overdueCount: number;
  urgentCount: number;
  highCount: number;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/tasks`;

  constructor(private http: HttpClient) {}

  getTasks(params: {
    search?: string;
    status?: string;
    priority?: string;
    category?: string;
    issueType?: string;
    scope?: string;
    page?: number;
    limit?: number;
  }): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      const val = (params as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        httpParams = httpParams.set(key, val);
      }
    });

    return this.http.get<any>(this.apiUrl, { params: httpParams });
  }

  getTaskStats(): Observable<{ success: boolean; data: TaskStats }> {
    return this.http.get<{ success: boolean; data: TaskStats }>(`${this.apiUrl}/dashboard-stats`);
  }

  getTaskById(id: number): Observable<{ success: boolean; data: TaskDetailResponse }> {
    return this.http.get<{ success: boolean; data: TaskDetailResponse }>(`${this.apiUrl}/${id}`);
  }

  createTask(payload: any): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }

  updateTask(id: number, payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, payload);
  }

  updateTaskStatus(id: number, status: string, progress?: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status`, { status, progress });
  }

  deleteTask(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  addSubtask(taskId: number, title: string, assignedTo?: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${taskId}/subtasks`, { title, assigned_to: assignedTo });
  }

  toggleSubtask(subtaskId: number, isCompleted: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/subtasks/${subtaskId}`, { is_completed: isCompleted });
  }

  deleteSubtask(subtaskId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/subtasks/${subtaskId}`);
  }

  logWork(taskId: number, payload: { hours_logged: number; work_date: string; description?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${taskId}/worklogs`, payload);
  }

  getWorklogs(taskId: number): Observable<{ success: boolean; data: TaskWorklog[] }> {
    return this.http.get<{ success: boolean; data: TaskWorklog[] }>(`${this.apiUrl}/${taskId}/worklogs`);
  }

  addComment(taskId: number, comment: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${taskId}/comments`, { comment });
  }

  uploadAttachment(taskId: number, fileData: { fileName: string; fileUrl: string; fileType?: string; fileSize?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${taskId}/attachments`, fileData);
  }

  deleteAttachment(attachmentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/attachments/${attachmentId}`);
  }

  getEmployees(): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/employees/list`);
  }
}
