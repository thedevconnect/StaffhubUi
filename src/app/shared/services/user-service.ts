import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly apiUrl = environment.apiBaseUrl;
  // Sidebar state management using Signals

  constructor(
    private http: HttpClient
  ) { }
  private readonly sidebarState = signal<boolean>(true);

  // Get sidebar state (readonly)
  getSidebarState() {
    return this.sidebarState.asReadonly();
  }
  getQuestionPaper(query: string) {
    return this.http.get(`${this.apiUrl}/api/questionpaper?${query}`);
  }
  getMenuMaster(query: string) {
    return this.http.get(`${this.apiUrl}/api/uspGetMenuMasterDetails|${query}`);
  }

  SubmitPostTypeData(query: string) {
    return this.http.get(`${this.apiUrl}/api/uspGetMenuMasterDetails|${query}`);
  }

  // Menus
  getMenus(page: number = 1, limit: number = 10, search: string = '') {
    return this.http.get(`${this.apiUrl}/api/menus?page=${page}&limit=${limit}&search=${search}`);
  }
  getActiveMenus() {
    return this.http.get(`${this.apiUrl}/api/menus/active`);
  }
  createMenu(data: any) {
    return this.http.post(`${this.apiUrl}/api/menus`, data);
  }
  updateMenu(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/api/menus/${id}`, data);
  }
  deleteMenu(id: number) {
    return this.http.delete(`${this.apiUrl}/api/menus/${id}`);
  }

  // Activities
  getActivities(page: number = 1, limit: number = 10, search: string = '') {
    return this.http.get(`${this.apiUrl}/api/activities?page=${page}&limit=${limit}&search=${search}`);
  }
  createActivity(data: any) {
    return this.http.post(`${this.apiUrl}/api/activities`, data);
  }
  updateActivity(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/api/activities/${id}`, data);
  }
  deleteActivity(id: number) {
    return this.http.delete(`${this.apiUrl}/api/activities/${id}`);
  }

  // Roles
  getRoles(page: number = 1, limit: number = 10, search: string = '') {
    return this.http.get(`${this.apiUrl}/api/roles?page=${page}&limit=${limit}&search=${search}`);
  }
  getActiveRoles() {
    return this.http.get(`${this.apiUrl}/api/roles/active`);
  }
  createRole(data: any) {
    return this.http.post(`${this.apiUrl}/api/roles`, data);
  }
  updateRole(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/api/roles/${id}`, data);
  }
  deleteRole(id: number) {
    return this.http.delete(`${this.apiUrl}/api/roles/${id}`);
  }

  // Permissions
  getPermissions(roleId: number) {
    return this.http.get(`${this.apiUrl}/api/permissions/${roleId}`);
  }
  saveBulkPermissions(data: any) {
    return this.http.post(`${this.apiUrl}/api/permissions/bulk-save`, data);
  }

  // Sidebar
  getUserSidebar(roleId: number | string) {
    return this.http.get(`${this.apiUrl}/api/auth/user-sidebar?roleId=${roleId}`);
  }

  // Toggle sidebar
  toggleSidebar(): void {
    this.sidebarState.update((state) => !state);
  }

  signup(data: any) {
    return this.http.post(`${this.apiUrl}/api/auth/signup`, data);
  }

  registerCompany(data: any) {
    return this.http.post(`${this.apiUrl}/api/companies/register`, data);
  }

  getPendingCompanies() {
    return this.http.get(`${this.apiUrl}/api/companies/pending`);
  }

  getAllCompanies(page: number = 1, limit: number = 10, search: string = '', status: string = 'ALL') {
    return this.http.get(`${this.apiUrl}/api/companies/all?page=${page}&limit=${limit}&search=${search}&status=${status}`);
  }

  getSuperadminDashboardStats() {
    return this.http.get(`${this.apiUrl}/api/companies/dashboard-stats`);
  }


  approveCompany(id: string | number) {
    return this.http.put(`${this.apiUrl}/api/companies/approve/${id}`, {});
  }

  rejectCompany(id: string | number) {
    return this.http.put(`${this.apiUrl}/api/companies/reject/${id}`, {});
  }

  deleteCompany(id: string | number) {
    return this.http.delete(`${this.apiUrl}/api/companies/${id}`);
  }

  updateCompany(id: string | number, data: any) {
    return this.http.put(`${this.apiUrl}/api/companies/${id}`, data);
  }

  getOfficeLocation() {
    return this.http.get(`${this.apiUrl}/api/companies/office-location`);
  }

  updateOfficeLocation(data: any) {
    return this.http.put(`${this.apiUrl}/api/companies/office-location`, data);
  }

  // Time-Bound Anywhere Swipe Exemption Rules API
  getExemptionRules(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/companies/location-exemptions`);
  }

  createExemptionRule(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/companies/location-exemptions`, data);
  }

  updateExemptionRule(id: string | number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/companies/location-exemptions/${id}`, data);
  }

  toggleExemptionRuleStatus(id: string | number, isActive: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/api/companies/location-exemptions/${id}/status`, { isActive });
  }

  deleteExemptionRule(id: string | number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/companies/location-exemptions/${id}`);
  }

  login(username: string, password: string) {
    return this.http.post(`${this.apiUrl}/api/auth/login`, {
      username,
      password
    });
  }

  createUser(data: any) {
    return this.http.post(`${this.apiUrl}/api/users`, data);
  }

  getAllUsers() {
    return this.http.get(`${this.apiUrl}/api/users`);
  }

  getAllAssets() {
    return this.http.get(`${this.apiUrl}/api/employee-assets`);
  }

  createAsset(data: any) {
    return this.http.post(`${this.apiUrl}/api/employee-assets`, data);
  }

  updateAsset(id: string | number, data: any) {
    return this.http.put(`${this.apiUrl}/api/employee-assets/${id}`, data);
  }

  deleteAsset(id: string | number) {
    return this.http.delete(`${this.apiUrl}/api/employee-assets/${id}`);
  }

  approveAsset(id: string | number, data: any = {}) {
    return this.http.put(`${this.apiUrl}/api/employee-assets/approve/${id}`, data);
  }

  withdrawAsset(id: string | number) {
    return this.http.put(`${this.apiUrl}/api/employee-assets/withdraw/${id}`, {});
  }

  returnAsset(id: string | number) {
    return this.http.put(`${this.apiUrl}/api/employee-assets/return/${id}`, {});
  }

  getAssetHistory(id: string | number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/employee-assets/${id}/history`);
  }

  getUserById(id: string | number) {
    return this.http.get(`${this.apiUrl}/api/users/${id}`);
  }

  updateUser(id: string | number, data: any) {
    return this.http.put(`${this.apiUrl}/api/users/${id}`, data);
  }

  deleteUser(id: string | number) {
    return this.http.delete(`${this.apiUrl}/api/users/${id}`);
  }

  // Set sidebar state
  setSidebarState(isOpen: boolean): void {
    this.sidebarState.set(isOpen);
  }

  // Computed value for sidebar width classes
  readonly sidebarWidth = computed(() => {
    return this.sidebarState() ? 'w-64' : 'w-16';
  });
}
