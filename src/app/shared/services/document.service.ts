import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/api/documents`;

  getDocuments(employeeId?: number): Observable<any> {
    const url = employeeId ? `${this.apiUrl}?employeeId=${employeeId}` : this.apiUrl;
    return this.http.get(url);
  }

  getDocumentById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  uploadDocument(payload: any): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }

  deleteDocument(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
