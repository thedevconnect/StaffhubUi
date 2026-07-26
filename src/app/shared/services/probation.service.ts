import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProbationRecord {
  id: number;
  company_id: number;
  employee_id: number;
  employee_name: string;
  designation: string;
  department: string;
  joining_date: string;
  probation_period_months: number;
  probation_end_date: string;
  confirmation_status: 'UNDER_PROBATION' | 'CONFIRMED' | 'EXTENDED' | 'TERMINATED';
  extension_months: number;
  review_rating: string;
  remarks: string;
  employee_code?: string;
  employee_email?: string;
}

export interface ProbationStats {
  total: number;
  underProbation: number;
  confirmed: number;
  extended: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProbationService {
  private apiUrl = `${environment.apiBaseUrl}/probation`;

  constructor(private http: HttpClient) {}

  getProbations(): Observable<{ success: boolean; data: ProbationRecord[]; stats: ProbationStats }> {
    return this.http.get<any>(this.apiUrl);
  }

  createProbation(payload: any): Observable<{ success: boolean; message: string; data: any }> {
    return this.http.post<any>(this.apiUrl, payload);
  }

  updateStatus(id: number, payload: {
    confirmationStatus: string;
    extensionMonths?: number;
    reviewRating?: string;
    remarks?: string;
  }): Observable<{ success: boolean; message: string }> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, payload);
  }
}
