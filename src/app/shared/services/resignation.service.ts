import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Resignation {
  id: number;
  company_id: number;
  employee_id: number;
  reason: string;
  join_again: string;
  refer_us: string;
  lwd_policy: string;
  lwd_employee: string;
  status: string;
  remarks: string;
  hr_remarks: string;
  created_at: string;
  updated_at: string;
  employee_name?: string;
  employee_code?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class ResignationService {
  private http = inject(HttpClient);
  private apiBase = environment.apiBaseUrl;

  submitResignation(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiBase}/api/resignations`, data);
  }

  getMyResignations(): Observable<ApiResponse<Resignation[]>> {
    return this.http.get<ApiResponse<Resignation[]>>(`${this.apiBase}/api/resignations/my-requests`);
  }

  withdrawResignation(id: number | string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiBase}/api/resignations/${id}/withdraw`, {});
  }

  getCompanyResignations(): Observable<ApiResponse<Resignation[]>> {
    return this.http.get<ApiResponse<Resignation[]>>(`${this.apiBase}/api/resignations/company-requests`);
  }

  updateStatus(id: number | string, status: 'APPROVED' | 'REJECTED', hr_remarks?: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiBase}/api/resignations/${id}/status`, { status, hr_remarks });
  }
}
