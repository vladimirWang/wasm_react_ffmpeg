import request from "../request";
import { IResponse } from "./commonDef";

// 定义登录响应类型
export type LoginResponse = IResponse<string>;

export type IUser = {
	id: string;
	email: string;
	username?: string;
	createdAt: string;
}
// 定义注册响应类型
export type RegisterResponse = IResponse<IUser>;

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


export const getCurrentUser = (): Promise<RegisterResponse> => {
  return request.get<RegisterResponse>("/api/user/current");
};
