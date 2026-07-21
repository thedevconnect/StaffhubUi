export interface Employee {
  id: number | string;
  employeeCode: string;
  emp_id?: string;
  fullName: string;
  full_name?: string;
  officialEmail: string;
  email?: string;
  mobileNumber: string;
  mobile?: string;
  designation: string;
  department: string;
  reportingManager: string;
  reportingManagerName?: string;
  reporting_manager_name?: string;
  joiningDate: string;
  joining_date?: string;
  employmentType: string;
  employment_type?: string;
  workLocation: string;
  work_location?: string;
  status: string;
  role?: string;
  username?: string;
  created_at?: string;
  company_name?: string;
  companyName?: string;
  employeeId?: number | string;
  onboardingStatus?: string;
  custom_location_allowed?: number;
  custom_latitude?: string;
  custom_longitude?: string;
  custom_radius?: number;
  last_working_day?: string | Date;
  lastWorkingDay?: string | Date;
}

export interface CreateEmployeeRequest {
  fullName: string;
  officialEmail: string;
  email?: string;
  mobileNumber: string;
  mobile?: string;
  username?: string;
  designation: string;
  department: string;
  reportingManager: string;
  reportingManagerName?: string;
  reporting_manager_name?: string;
  reportingManagerId?: number | null;
  reporting_manager_id?: number | null;
  joiningDate: string;
  employmentType: string;
  workLocation: string;
  companyId?: number;
  company_id?: number;
  full_name?: string;
  official_email?: string;
  mobile_number?: string;
  joining_date?: string;
  employment_type?: string;
  work_location?: string;
  password?: string;
  defaultPassword?: string;
  role?: string;
  status?: string;
}

export interface UpdateEmployeeRequest extends CreateEmployeeRequest { }

export interface ApiResponse<T> {
  data?: T;
  message?: string;
}
