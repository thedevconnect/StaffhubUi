export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponseData {
  id?: number;
  userId?: number;
  username?: string;
  userName?: string;
  employeeName?: string;
  role?: string | string[];
  roleId?: number | number[] | string | string[];
  roles?: Array<{
    role?: string;
    roleId?: number | string;
    roleCode?: string;
    roleName?: string;
  }>;
  token?: string;
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
  companyId?: number;
  roles: RoleOption[];
}

export interface JwtPayload {
  userId: number;
  companyId: number;
  role: string;
  exp?: number;
  iat?: number;
}
