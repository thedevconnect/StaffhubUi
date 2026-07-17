import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LeaveRequest {
  id: number;
  company_id: number;
  employee_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  employee_name?: string;
  employee_code?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  private readonly apiBase = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) { }

  getLeaves(): Observable<{ success: boolean; data: LeaveRequest[] }> {
    return this.http.get<{ success: boolean; data: LeaveRequest[] }>(`${this.apiBase}/api/leaves`);
  }

  getLeaveById(id: number | string): Observable<{ success: boolean; data: LeaveRequest }> {
    return this.http.get<{ success: boolean; data: LeaveRequest }>(`${this.apiBase}/api/leaves/${id}`);
  }

  updateLeave(id: number | string, data: { leaveType: string; startDate: string; endDate: string; reason: string; status: string; remarks?: string }): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/api/leaves/${id}`, data);
  }

  createLeave(data: { leaveType: string; startDate: string; endDate: string; reason: string; }): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/api/leaves`, data);
  }

  deleteLeave(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/api/leaves/${id}`);
  }

  getLeaveHistory(id: number | string): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/api/leaves/${id}/history`);
  }
}
