import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OffboardingService {
  private readonly apiBase = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) { }

  getOffboardings(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/api/offboarding`);
  }

  createOffboarding(payload: {
    employeeId: number | string;
    employmentStatus: string;
    resignationDate: string;
    lastWorkingDate: string;
    reason: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/api/offboarding`, payload);
  }
}
