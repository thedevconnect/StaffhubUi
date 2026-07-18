import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ExitInterviewData {
  id?: number;
  company_id?: number;
  employee_id?: number;
  expectations: string;
  fulfilled: string;
  attractNewJob?: string;
  comeBackLater?: string;
  whatLiked?: string;
  whatDisliked?: string;
  attract_new_job?: string;
  come_back_later?: string;
  what_liked?: string;
  what_disliked?: string;
  suggestions: string;
  employee_name?: string;
  employee_code?: string;
  department?: string;
  created_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class ExitInterviewService {
  private http = inject(HttpClient);
  private apiBase = environment.apiBaseUrl;

  submitExitInterview(data: ExitInterviewData): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiBase}/api/exit-interviews`, data);
  }

  getMyExitInterviews(): Observable<ApiResponse<ExitInterviewData[]>> {
    return this.http.get<ApiResponse<ExitInterviewData[]>>(`${this.apiBase}/api/exit-interviews/my-responses`);
  }

  getCompanyExitInterviews(): Observable<ApiResponse<ExitInterviewData[]>> {
    return this.http.get<ApiResponse<ExitInterviewData[]>>(`${this.apiBase}/api/exit-interviews/company-responses`);
  }
}
