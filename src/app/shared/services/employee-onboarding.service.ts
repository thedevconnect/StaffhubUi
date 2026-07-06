import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeOnboardingService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getOnboardingByEmployeeId(employeeId: string | number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/employee-onboarding/${employeeId}`);
  }

  createOnboarding(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/employee-onboarding`, data);
  }

  updateOnboarding(employeeId: string | number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/employee-onboarding/${employeeId}`, data);
  }

  listOnboarding(params: { page?: number; limit?: number; search?: string; profile_status?: string } = {}): Observable<any> {
    let query = '';
    const queryParams: string[] = [];
    if (params.page !== undefined) queryParams.push(`page=${params.page}`);
    if (params.limit !== undefined) queryParams.push(`limit=${params.limit}`);
    if (params.search) queryParams.push(`search=${encodeURIComponent(params.search)}`);
    if (params.profile_status) queryParams.push(`profile_status=${params.profile_status}`);
    
    if (queryParams.length > 0) {
      query = `?${queryParams.join('&')}`;
    }
    return this.http.get<any>(`${this.apiUrl}/api/employee-onboarding${query}`);
  }

  deleteOnboarding(employeeId: string | number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/employee-onboarding/${employeeId}`);
  }
}
