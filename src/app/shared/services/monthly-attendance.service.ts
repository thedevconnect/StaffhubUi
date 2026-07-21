import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MonthlyAttendanceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/api/attendance-monthly`;

  createMonthlyAttendance(month: number, year: number, employee_id?: number): Observable<any> {
    const payload: any = { month, year };
    if (employee_id) {
      payload.employee_id = employee_id;
    }
    return this.http.post(`${this.apiUrl}/generate`, payload);
  }

  getMonthlyAttendance(employeeId: number, month: number, year: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${employeeId}/${month}/${year}`);
  }

  getMonthlyAttendanceById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/record/${id}`);
  }

  saveDraft(id: number, details: any[], month?: number, year?: number, employee_id?: number): Observable<any> {
    const payload: any = { id, details };
    if (month) payload.month = month;
    if (year) payload.year = year;
    if (employee_id) payload.employee_id = employee_id;
    return this.http.put(`${this.apiUrl}/save`, payload);
  }

  submitAttendance(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/submit`, { id });
  }

  getPendingList(filters: any): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params = params.set(key, filters[key]);
      }
    });
    return this.http.get(`${this.apiUrl}/pending`, { params });
  }

  approveAttendance(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/approve/${id}`, {});
  }

  rejectAttendance(id: number, hr_remarks: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/reject/${id}`, { hr_remarks });
  }
}
