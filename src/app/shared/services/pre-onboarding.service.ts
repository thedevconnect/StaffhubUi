import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PreOnboardingCandidate {
  id: number;
  company_id: number;
  candidate_code: string;
  full_name: string;
  email: string;
  mobile: string;
  designation: string;
  department: string;
  interview_status: string;
  joining_date?: string;
  offered_ctc?: number;
  access_token: string;
  link_status: 'NOT_SENT' | 'SENT' | 'ACCESSED';
  invitation_sent_at?: string;
  documents_status: 'PENDING_UPLOAD' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  documents?: any[];
  rejection_remarks?: string;
  verified_by?: string;
  verified_at?: string;
  offer_status: 'NOT_ISSUED' | 'OFFER_SENT' | 'ACCEPTED' | 'DECLINED';
  offer_details?: any;
  signature_data?: string;
  accepted_at?: string;
  declined_reason?: string;
  onboarding_completed: number | boolean;
  converted_employee_id?: number;
  notes?: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PreOnboardingService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  /* ================= HR ADMIN ENDPOINTS ================= */

  /** Add new candidate who cleared interview */
  createCandidate(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/pre-onboarding`, data);
  }

  /** List candidates with filtering and pagination */
  getCandidates(params: {
    page?: number;
    limit?: number;
    search?: string;
    documents_status?: string;
    offer_status?: string;
  } = {}): Observable<any> {
    const queryParams: string[] = [];
    if (params.page !== undefined) queryParams.push(`page=${params.page}`);
    if (params.limit !== undefined) queryParams.push(`limit=${params.limit}`);
    if (params.search) queryParams.push(`search=${encodeURIComponent(params.search)}`);
    if (params.documents_status) queryParams.push(`documents_status=${params.documents_status}`);
    if (params.offer_status) queryParams.push(`offer_status=${params.offer_status}`);

    const query = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return this.http.get<any>(`${this.apiUrl}/api/pre-onboarding${query}`);
  }

  /** Get single candidate details */
  getCandidateById(id: number | string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/pre-onboarding/${id}`);
  }

  /** Update candidate details */
  updateCandidate(id: number | string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/pre-onboarding/${id}`, data);
  }

  /** Delete candidate (if not yet converted) */
  deleteCandidate(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/pre-onboarding/${id}`);
  }

  /** Send or re-send document upload link email to candidate */
  sendInvitationLink(id: number | string, customMessage?: string): Observable<any> {
    const baseUrl = window.location.origin;
    return this.http.post<any>(`${this.apiUrl}/api/pre-onboarding/${id}/send-link`, {
      customMessage,
      baseUrl
    });
  }

  /** HR verifies candidate's 8 documents (VERIFIED / REJECTED) */
  verifyDocuments(id: number | string, payload: { status: 'VERIFIED' | 'REJECTED'; rejectionRemarks?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/pre-onboarding/${id}/verify-documents`, payload);
  }

  /** Issue official Offer Letter with CTC breakdown */
  issueOffer(id: number | string, offerData: any): Observable<any> {
    const baseUrl = window.location.origin;
    return this.http.post<any>(`${this.apiUrl}/api/pre-onboarding/${id}/issue-offer`, {
      ...offerData,
      baseUrl
    });
  }

  /** Convert accepted candidate into active Employee & User */
  convertToEmployee(id: number | string, data?: { tempPassword?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/pre-onboarding/${id}/convert-to-employee`, data || {});
  }

  /* ================= CANDIDATE PUBLIC PORTAL ENDPOINTS ================= */

  /** Candidate fetches portal details via magic link token */
  getCandidateByToken(token: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/pre-onboarding/public/${token}`);
  }

  /** Candidate submits the 8 mandatory documents */
  submitDocumentsByToken(token: string, documents: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/pre-onboarding/public/${token}/documents`, { documents });
  }

  /** Candidate responds to offer: Accept with digital signature or Decline */
  respondToOfferByToken(token: string, payload: {
    action: 'ACCEPT' | 'DECLINE';
    signatureData?: string;
    reason?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/pre-onboarding/public/${token}/respond-offer`, payload);
  }
}
