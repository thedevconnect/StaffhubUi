import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationResponse {
  success: boolean;
  data: {
    missingSwipes: Array<{
      date: string;
      message: string;
    }>;
    pendingRequests: Array<{
      id: number;
      employeeId: number;
      employeeName: string;
      date: string;
      message: string;
    }>;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/api/notifications`;

  getNotifications(): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(this.apiUrl);
  }
}
