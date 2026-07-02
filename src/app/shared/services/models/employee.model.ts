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
}

export interface UpdateEmployeeRequest extends CreateEmployeeRequest { }

export interface ApiResponse<T> {
  data?: T;
  message?: string;
}
