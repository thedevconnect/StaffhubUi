import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './attendance.service';

export interface DeviceStatus {
  employee_id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  laptop_status: string;
  laptop_registered_at: string | null;
  mobile_status: string;
  mobile_registered_at: string | null;
  last_used_at: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private readonly apiBase = environment.apiBaseUrl;
  private readonly http = inject(HttpClient);

  getEmployeesDevices(): Observable<ApiResponse<DeviceStatus[]>> {
    return this.http.get<ApiResponse<DeviceStatus[]>>(`${this.apiBase}/api/devices/employees`);
  }

  resetDevice(employeeId: number, deviceType: 'Laptop' | 'Mobile' | 'Both'): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiBase}/api/devices/reset`, { employeeId, deviceType });
  }
}
