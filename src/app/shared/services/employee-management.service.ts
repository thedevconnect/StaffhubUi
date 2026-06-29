import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  CreateEmployeeRequest,
  Employee,
  UpdateEmployeeRequest
} from './models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeManagementService {
  private readonly apiBase = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getEmployees(): Observable<Employee[]> {
    return this.http
      .get<ApiResponse<Employee[]> | Employee[]>(`${this.apiBase}/api/employees`)
      .pipe(map((res) => this.normalizeEmployeeList(res)));
  }

  getEmployeeById(id: number | string): Observable<Employee> {
    return this.http
      .get<ApiResponse<Employee> | Employee>(`${this.apiBase}/api/employees/${id}`)
      .pipe(map((res) => this.normalizeEmployee(this.unwrapData<Employee>(res))));
  }

  createEmployee(payload: CreateEmployeeRequest): Observable<Employee> {
    const apiPayload = this.toApiPayload(payload);
    return this.http
      .post<ApiResponse<Employee> | Employee>(`${this.apiBase}/api/employees`, apiPayload)
      .pipe(map((res) => this.normalizeEmployee(this.unwrapData<Employee>(res))));
  }

  updateEmployee(id: number | string, payload: UpdateEmployeeRequest): Observable<Employee> {
    const apiPayload = this.toApiPayload(payload);
    return this.http
      .put<ApiResponse<Employee> | Employee>(`${this.apiBase}/api/employees/${id}`, apiPayload)
      .pipe(map((res) => this.normalizeEmployee(this.unwrapData<Employee>(res))));
  }

  deleteEmployee(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/api/employees/${id}`);
  }

  private toApiPayload(payload: CreateEmployeeRequest | UpdateEmployeeRequest): any {
    const companyId = this.toNumberOrUndefined(payload.companyId ?? payload.company_id);
    const reportingManagerId = this.toNumberOrNull(payload.reportingManagerId ?? payload.reporting_manager_id);
    const fullName = String(payload.fullName ?? payload.full_name ?? '').trim();
    const officialEmail = String(payload.officialEmail ?? payload.official_email ?? payload.email ?? '').trim();
    const mobileNumber = String(payload.mobileNumber ?? payload.mobile_number ?? payload.mobile ?? '').trim();
    const designation = String(payload.designation ?? '').trim();
    const department = String(payload.department ?? '').trim();
    const reportingManagerName = String(
      payload.reportingManagerName ?? payload.reporting_manager_name ?? payload.reportingManager ?? ''
    )
      .replace(/\s+/g, ' ')
      .trim();
    const workLocation = this.toWorkLocation(payload.workLocation || payload.work_location || 'OFFICE');
    const employmentType = this.toEmploymentType(payload.employmentType || payload.employment_type || 'FULL_TIME');
    const joiningDate = String(payload.joiningDate ?? payload.joining_date ?? '').trim();

    return {
      fullName,
      officialEmail,
      mobileNumber,
      designation,
      department,
      reportingManagerName,
      joiningDate,
      employmentType,
      workLocation,
      ...(companyId ? { companyId } : {}),
      ...(reportingManagerId ? { reportingManagerId } : {})
    };
  }

  private toEmploymentType(value: string): string {
    return String(value || 'FULL_TIME')
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '_');
  }

  private toWorkLocation(value: string): 'OFFICE' | 'REMOTE' | 'HYBRID' {
    const normalized = String(value || '')
      .trim()
      .toUpperCase();

    if (normalized === 'REMOTE' || normalized === 'HYBRID') {
      return normalized;
    }

    return 'OFFICE';
  }

  private toNumberOrUndefined(value: unknown): number | undefined {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
  }

  private toNumberOrNull(value: unknown): number | null {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  }

  private normalizeEmployeeList(response: ApiResponse<Employee[]> | Employee[]): Employee[] {
    const value = this.unwrapData<Employee[]>(response);
    if (!Array.isArray(value)) {
      return [];
    }

    return value.map((item) => this.normalizeEmployee(item));
  }

  private unwrapData<T>(response: ApiResponse<T> | T): T {
    if (
      response !== null &&
      typeof response === 'object' &&
      'data' in (response as ApiResponse<T>)
    ) {
      return (response as ApiResponse<T>).data as T;
    }

    return response as T;
  }

  private normalizeEmployee(employee: any): Employee {
    return {
      id: employee?.id ?? employee?.employeeId ?? employee?.employee_id ?? '',
      employeeCode: employee?.employeeCode ?? employee?.employee_code ?? employee?.code ?? '',
      fullName: employee?.fullName ?? employee?.full_name ?? employee?.name ?? '',
      officialEmail: employee?.officialEmail ?? employee?.email ?? employee?.official_email ?? '',
      mobileNumber: employee?.mobileNumber ?? employee?.mobile ?? employee?.mobile_number ?? '',
      designation: employee?.designation ?? '',
      department: employee?.department ?? '',
      reportingManager: employee?.reportingManager ?? employee?.reporting_manager_name ?? employee?.reporting_manager ?? '',
      joiningDate: employee?.joiningDate ?? employee?.joining_date ?? '',
      employmentType: employee?.employmentType ?? employee?.employment_type ?? '',
      workLocation: employee?.workLocation ?? employee?.work_location ?? '',
      status: employee?.status ?? employee?.employment_status ?? 'ACTIVE'
    };
  }
}
