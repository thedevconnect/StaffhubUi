import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfileData {
  userId: number;
  empId: string;
  fullName: string;
  username: string;
  email: string;
  mobile: string;
  role: string;
  companyId: number;
  profilePicture?: string | null;
  oldProfilePictures?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private readonly apiBase = `${environment.apiBaseUrl}/api/user-profile`;

  readonly profilePicture = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  getUserProfile(): Observable<{ success: boolean; message: string; data: UserProfileData }> {
    return this.http.get<{ success: boolean; message: string; data: UserProfileData }>(`${this.apiBase}`).pipe(
      tap((res) => {
        if (res?.success && res?.data) {
          this.profilePicture.set(res.data.profilePicture || null);
        }
      })
    );
  }

  updateUserProfile(payload: {
    fullName: string;
    email: string;
    mobile: string;
    profilePicture?: string | null;
  }): Observable<{ success: boolean; message: string; data: UserProfileData }> {
    return this.http.put<{ success: boolean; message: string; data: UserProfileData }>(`${this.apiBase}`, payload).pipe(
      tap((res) => {
        if (res?.success && res?.data) {
          this.profilePicture.set(res.data.profilePicture || null);
        }
      })
    );
  }

  changePassword(payload: {
    oldPassword?: string;
    old_password?: string;
    newPassword?: string;
    password?: string;
  }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiBase}/change-password`, payload);
  }
}
