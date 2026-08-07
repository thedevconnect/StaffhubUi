import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationItem {
  id?: number;
  type?: string;
  date?: string;
  reason?: string;
  message: string;
  targetUrl?: string;
  employeeId?: number;
  employeeName?: string;
}

export interface NotificationResponse {
  success: boolean;
  data: {
    missingSwipes: NotificationItem[];
    pendingRequests: NotificationItem[];
    pendingLeaves: NotificationItem[];
    pendingTickets: NotificationItem[];
    pendingAssets?: NotificationItem[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/api/notifications`;

  getNotifications(portal?: string): Observable<NotificationResponse> {
    const url = portal ? `${this.apiUrl}?portal=${encodeURIComponent(portal)}` : this.apiUrl;
    return this.http.get<NotificationResponse>(url);
  }
}
