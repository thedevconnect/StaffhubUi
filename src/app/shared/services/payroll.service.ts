import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  private apiUrl = `${environment.apiBaseUrl}/api/payroll`;

  constructor(private http: HttpClient) {}

  getEmployeesPayroll(month: number, year: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/employees/${month}/${year}`);
  }

  getEmployeePayrollDetails(employeeId: number, month: number, year: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/employee/${employeeId}/${month}/${year}`);
  }

  savePayroll(employeeId: number, month: number, year: number, base_salary: number, payable_days: number | null = null): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/save`, { employee_id: employeeId, month, year, base_salary, payable_days });
  }

  processPayroll(month: number, year: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/process`, { month, year });
  }

  setBaseSalary(employee_id: number, base_salary: number, effective_from: string | null = null): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/set-base-salary`, { employee_id, base_salary, effective_from });
  }

  recordPayment(data: { payroll_id?: number; employee_id: number; amount: number; payment_mode?: string; reference_number?: string; payment_date?: string; notes?: string; month?: number; year?: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/record-payment`, data);
  }

  getEmployeePayrollLedger(employeeId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/ledger/${employeeId}`);
  }

  getMonthlyComponents(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/monthly-components`);
  }

  createMonthlyComponent(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/monthly-components`, data);
  }

  updateMonthlyComponent(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/monthly-components/${id}`, data);
  }

  deleteMonthlyComponent(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/monthly-components/${id}`);
  }

  getYearlyComponents(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/yearly-components`);
  }

  createYearlyComponent(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/yearly-components`, data);
  }

  updateYearlyComponent(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/yearly-components/${id}`, data);
  }

  deleteYearlyComponent(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/yearly-components/${id}`);
  }

  getDashboardSummary(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard-summary`);
  }
}
