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
  companyLogo?: string | null;
  company_logo?: string | null;
  profilePicture?: string | null;
  oldProfilePictures?: string[];
  date_of_joining?: string | Date | null;
  joining_date?: string | Date | null;
  doj?: string | Date | null;
  created_at?: string | Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private readonly apiBase = `${environment.apiBaseUrl}/api/user-profile`;

  readonly profilePicture = signal<string | null>(null);
  readonly companyLogo = signal<string | null>(localStorage.getItem('companyLogo') || null);

  constructor(private http: HttpClient) {}

  getUserProfile(): Observable<{ success: boolean; message: string; data: UserProfileData }> {
    return this.http.get<{ success: boolean; message: string; data: UserProfileData }>(`${this.apiBase}`).pipe(
      tap((res) => {
        if (res?.success && res?.data) {
          this.profilePicture.set(res.data.profilePicture || null);
          const logo = res.data.companyLogo || res.data.company_logo || null;
          if (logo) {
            this.companyLogo.set(logo);
            localStorage.setItem('companyLogo', logo);
          }
          const joining = res.data.joining_date || res.data.date_of_joining || res.data.doj || res.data.created_at || null;
          if (joining) {
            try {
              const joiningStr = new Date(joining).toISOString().split('T')[0];
              localStorage.setItem('joiningDate', joiningStr);
            } catch (e) { }
          }
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
          const logo = res.data.companyLogo || res.data.company_logo || null;
          if (logo) {
            this.companyLogo.set(logo);
            localStorage.setItem('companyLogo', logo);
          }
          const joining = res.data.joining_date || res.data.date_of_joining || res.data.doj || res.data.created_at || null;
          if (joining) {
            try {
              const joiningStr = new Date(joining).toISOString().split('T')[0];
              localStorage.setItem('joiningDate', joiningStr);
            } catch (e) { }
          }
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
