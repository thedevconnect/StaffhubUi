export interface Employee {
  id: number | string;
  employeeCode: string;
  fullName: string;
  officialEmail: string;
  mobileNumber: string;
  designation: string;
  department: string;
  reportingManager: string;
  joiningDate: string;
  employmentType: string;
  workLocation: string;
  status: string;
}

export interface CreateEmployeeRequest {
  fullName: string;
  officialEmail: string;
  email?: string;
  mobileNumber: string;
  mobile?: string;
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

export interface UpdateEmployeeRequest extends CreateEmployeeRequest {}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
}
