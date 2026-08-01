import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/api/performance`;

  getMonthlyRatings(employeeId?: number, year?: number): Observable<any> {
    let url = `${this.apiUrl}?`;
    if (employeeId) url += `employeeId=${employeeId}&`;
    if (year) url += `year=${year}&`;
    return this.http.get(url);
  }

  submitSelfRating(payload: any): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }

  reviewMonthlyRating(ratingId: number, payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${ratingId}/review`, payload);
  }

  deleteRating(ratingId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${ratingId}`);
  }
}
