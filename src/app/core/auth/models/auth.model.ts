export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponseData {
  id: number;
  username: string;
  employeeName: string;
  role?: string | string[];
  roleId?: number | number[];
  roles?: Array<{ role: string; roleId: number }>;
}

export interface LoginApiResponse {
  success: boolean;
  message: string;
  data: LoginResponseData;
}

export interface RoleOption {
  rolDes: string;
  roleId: string;
}

export interface AuthUser {
  id: number;
  username: string;
  employeeName: string;
  roles: RoleOption[];
}
