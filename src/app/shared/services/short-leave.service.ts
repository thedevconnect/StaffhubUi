import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ShortLeaveRequest {
  id: number;
  company_id?: number;
  employee_id?: number;
  leave_date?: string;
  from_date?: string;
  date?: string;
  session: string;
  reason: string;
  to_mail?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  employee_name?: string;
  employee_code?: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShortLeaveService {
  private readonly apiBase = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getShortLeaves(employeeId?: number | string): Observable<{ success: boolean; data: ShortLeaveRequest[] }> {
    const url = employeeId
      ? `${this.apiBase}/api/short-leaves?employeeId=${employeeId}`
      : `${this.apiBase}/api/short-leaves`;
    return this.http.get<{ success: boolean; data: ShortLeaveRequest[] }>(url);
  }

  createShortLeave(data: { leave_date: string; session: string; reason: string; to_mail?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/api/short-leaves`, data);
  }

  updateShortLeave(id: number | string, data: { leave_date: string; session: string; reason: string; to_mail?: string }): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/api/short-leaves/${id}`, data);
  }

  deleteShortLeave(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/api/short-leaves/${id}`);
  }

  updateStatus(id: number | string, status: string, remarks?: string): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/api/short-leaves/${id}/status`, { status, remarks });
  }

  withdrawShortLeave(id: number | string): Observable<any> {
    return this.updateStatus(id, 'WITHDRAWN', 'Withdrawn by employee');
  }
}
