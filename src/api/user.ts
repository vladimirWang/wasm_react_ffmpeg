import request from "../request";

// 定义登录响应类型
export interface LoginResponse {
  data: string;
  code: number;
  message?: string;
}

// 定义注册响应类型
export interface RegisterResponse {
  message?: string;
  user?: {
    id: string;
    email: string;
    username?: string;
    createdAt: string;
  };
  code: number;
}

// 定义登录请求参数类型
export interface LoginParams {
  email: string;
  password: string;
}

// 定义注册请求参数类型
export interface RegisterParams {
  email: string;
  password: string;
}

export const userLogin = (data: LoginParams): Promise<LoginResponse> => {
  return request.post<LoginResponse>("/api/user/login", data);
};

export const userRegister = (
  data: RegisterParams
): Promise<RegisterResponse> => {
  return request.post<RegisterResponse>("/api/user/register", data);
};
