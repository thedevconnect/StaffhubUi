import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AttendanceRecord {
  attendanceId: number;
  id: number;
  company_id: number;
  employee_id: number;
  attendance_date: string;
  swipe_in: string;
  swipe_out: string | null;
  attendance_status: string;
  ip_address: string | null;
  latitude: number | null;
  longitude: number | null;
  location_address: string | null;
  device_name: string | null;
  browser_name: string | null;
  os_name: string | null;
  notes: string | null;
  total_work_minutes: number | null;
}

export interface BreakRecord {
  id: number;
  attendance_id: number;
  break_start: string;
  break_end: string | null;
  break_minutes: number | null;
  reason: string | null;
}

export interface DashboardSummary {
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  totalWorkingMinutes: number;
}

export interface SwipeLog {
  id: number;
  company_id: number;
  employee_id: number;
  attendance_id: number;
  action: string;
  swipe_time: string;
  ip_address: string | null;
  latitude: number | null;
  longitude: number | null;
  location_address: string | null;
  device_name: string | null;
  browser_name: string | null;
  os_name: string | null;
  user_agent: string | null;
  employee_name: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private readonly apiBase = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) { }

  getTodayRecord(): Observable<ApiResponse<AttendanceRecord | null>> {
    return this.http.get<ApiResponse<AttendanceRecord | null>>(`${this.apiBase}/attendance/today`);
  }

  swipeIn(data?: Partial<AttendanceRecord>): Observable<ApiResponse<AttendanceRecord>> {
    return this.http.post<ApiResponse<AttendanceRecord>>(`${this.apiBase}/attendance/swipe-in`, data || {});
  }

  swipeOut(data?: { notes?: string }): Observable<ApiResponse<AttendanceRecord>> {
    return this.http.post<ApiResponse<AttendanceRecord>>(`${this.apiBase}/attendance/swipe-out`, data || {});
  }

  getHistory(): Observable<ApiResponse<AttendanceRecord[]>> {
    return this.http.get<ApiResponse<AttendanceRecord[]>>(`${this.apiBase}/attendance/history`);
  }

  getDashboardSummary(): Observable<ApiResponse<DashboardSummary>> {
    return this.http.get<ApiResponse<DashboardSummary>>(`${this.apiBase}/attendance/dashboard-summary`);
  }

  startBreak(reason?: string): Observable<ApiResponse<BreakRecord>> {
    return this.http.post<ApiResponse<BreakRecord>>(`${this.apiBase}/attendance/break/start`, { reason });
  }

  endBreak(): Observable<ApiResponse<BreakRecord>> {
    return this.http.post<ApiResponse<BreakRecord>>(`${this.apiBase}/attendance/break/end`, {});
  }

  getBreakHistory(): Observable<ApiResponse<BreakRecord[]>> {
    return this.http.get<ApiResponse<BreakRecord[]>>(`${this.apiBase}/attendance/break/history`);
  }

  getAllLogs(): Observable<ApiResponse<SwipeLog[]>> {
    return this.http.get<ApiResponse<SwipeLog[]>>(`${this.apiBase}/attendance/logs`);
  }
}
