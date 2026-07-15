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
  device_id?: string | null;
  browser_name: string | null;
  os_name: string | null;
  notes: string | null;
  total_work_minutes: number | null;
  swipe_in_address?: string | null;
  swipe_in_latitude?: number | null;
  swipe_in_longitude?: number | null;
  swipe_out_address?: string | null;
  swipe_out_latitude?: number | null;
  swipe_out_longitude?: number | null;
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
    return this.http.get<ApiResponse<AttendanceRecord | null>>(`${this.apiBase}/api/attendance/today`);
  }

  swipeIn(data?: Partial<AttendanceRecord>): Observable<ApiResponse<AttendanceRecord>> {
    return this.http.post<ApiResponse<AttendanceRecord>>(`${this.apiBase}/api/attendance/swipe-in`, data || {});
  }

  swipeOut(data?: { notes?: string }): Observable<ApiResponse<AttendanceRecord>> {
    return this.http.post<ApiResponse<AttendanceRecord>>(`${this.apiBase}/api/attendance/swipe-out`, data || {});
  }

  getHistory(): Observable<ApiResponse<AttendanceRecord[]>> {
    return this.http.get<ApiResponse<AttendanceRecord[]>>(`${this.apiBase}/api/attendance/history`);
  }

  getEmployeeHistory(employeeId: number | string): Observable<ApiResponse<AttendanceRecord[]>> {
    return this.http.get<ApiResponse<AttendanceRecord[]>>(`${this.apiBase}/api/attendance/employee-history/${employeeId}`);
  }

  getDashboardSummary(): Observable<ApiResponse<DashboardSummary>> {
    return this.http.get<ApiResponse<DashboardSummary>>(`${this.apiBase}/api/attendance/dashboard-summary`);
  }

  getAllLogs(): Observable<ApiResponse<SwipeLog[]>> {
    return this.http.get<ApiResponse<SwipeLog[]>>(`${this.apiBase}/api/attendance/logs`);
  }

  getHolidays(page?: number, limit?: number, search?: string): Observable<any> {
    let params = '';
    if (page && limit) {
      params = `?page=${page}&limit=${limit}`;
      if (search) {
        params += `&search=${search}`;
      }
    } else if (search) {
      params = `?search=${search}`;
    }
    return this.http.get<any>(`${this.apiBase}/api/holidays${params}`);
  }

  submitRegularization(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/api/attendance-regularization`, data);
  }

  getMyRegularizations(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/api/attendance-regularization/my-requests`);
  }

  updateRegularization(id: string | number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/api/attendance-regularization/${id}`, data);
  }

  deleteRegularization(id: string | number): Observable<any> {
    return this.http.delete<any>(`${this.apiBase}/api/attendance-regularization/${id}`);
  }

  checkIncompleteAttendance(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiBase}/api/attendance/incomplete-status`);
  }

  getCompanyRegularizations(page: number = 1, limit: number = 10, status: string = 'PENDING', search: string = ''): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/api/attendance-regularization?page=${page}&limit=${limit}&status=${status}&search=${search}`);
  }

  updateRegularizationStatus(requestId: number | string, status: 'Approved' | 'Rejected', hrRemarks?: string): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/api/attendance-regularization/${requestId}/status`, { status, hrRemarks });
  }

  getHRDashboardSummary(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiBase}/api/attendance/hr-dashboard-summary`);
  }

  getHRDashboardDetails(category: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiBase}/api/attendance/hr-dashboard-details?category=${category}`);
  }
  // getEmployeeHistory(employeeId: number | string): Observable<ApiResponse<AttendanceRecord[]>> {
  //   return this.http.get<ApiResponse<AttendanceRecord[]>>(`${this.apiBase}/api/attendance/employee-history/${employeeId}`);
  // }

  getOfficeLocation(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiBase}/api/attendance/office-location`);
  }

  updateDailyAttendance(data: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiBase}/api/attendance/update-daily`, data);
  }
}
