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

  setBaseSalary(employee_id: number, base_salary: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/set-base-salary`, { employee_id, base_salary });
  }

  getEmployeePayrollLedger(employeeId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/ledger/${employeeId}`);
  }
}
