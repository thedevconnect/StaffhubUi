import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TicketItem {
  id: number;
  company_id: number;
  ticket_code: string;
  category: 'ADMINISTRATION' | 'HUMAN RESOURCE - CRG' | 'IT HELPDESK';
  subject: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'UNDER_PROCESS' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED' | 'REJECTED';
  created_by: number;
  remark: string;
  created_at: string;
  updated_at?: string;
  creator_name?: string;
  creator_emp_id?: string;
  cc_employee_names?: string;
  comments_count?: number;
  cc_employees?: { employee_id: number; full_name: string; emp_id: string }[];
  comments?: TicketComment[];
}

export interface TicketComment {
  id: number;
  ticket_id: number;
  user_id: number;
  comment: string;
  created_at: string;
  user_name: string;
}

export interface TicketStats {
  totalTickets: number;
  underProcessCount: number;
  inReviewCount: number;
  resolvedCount: number;
  closedCount: number;
  rejectedCount: number;
  adminCount: number;
  hrCount: number;
  itCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiUrl = `${environment.apiBaseUrl}/tickets`;

  constructor(private http: HttpClient) {}

  getTickets(params?: {
    search?: string;
    status?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Observable<{
    success: boolean;
    data: TicketItem[];
    pagination: { totalItems: number; currentPage: number; totalPages: number; limit: number };
  }> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.category) httpParams = httpParams.set('category', params.category);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get<any>(this.apiUrl, { params: httpParams });
  }

  getTicketStats(): Observable<{ success: boolean; data: TicketStats }> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }

  getTicketById(id: number): Observable<{ success: boolean; data: TicketItem }> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createTicket(payload: {
    category: string;
    subject: string;
    priority?: string;
    cc_employees?: number[];
    remark: string;
  }): Observable<{ success: boolean; data: TicketItem; message: string }> {
    return this.http.post<any>(this.apiUrl, payload);
  }

  updateTicketStatus(id: number, status: string): Observable<{ success: boolean; data: TicketItem }> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, { status });
  }

  addComment(ticketId: number, comment: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<any>(`${this.apiUrl}/${ticketId}/comments`, { comment });
  }

  getEmployees(): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<any>(`${this.apiUrl}/employees/list`);
  }
}
