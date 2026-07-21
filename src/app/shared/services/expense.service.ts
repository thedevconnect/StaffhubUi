import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/api/expenses`;

  getNextRequestNo(): Observable<any> {
    return this.http.get(`${this.apiUrl}/next-request-no`);
  }

  getIndiaLocations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/india-locations`);
  }

  getIndiaStates(): Observable<any> {
    return this.http.get(`${this.apiUrl}/india-states`);
  }

  getCitiesByState(state: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/india-cities-by-state`, { state });
  }

  createClaim(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, payload);
  }

  getClaims(): Observable<any> {
    return this.http.get(`${this.apiUrl}`);
  }

  getClaimById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  updateClaimStatus(id: number, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status`, { status });
  }

  deleteClaim(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
