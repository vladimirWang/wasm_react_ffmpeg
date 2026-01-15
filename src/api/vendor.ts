import request from "../request";
import { IPagination, IResponse } from "./commonDef";

// 产品类型定义
export interface IVendor {
  readonly id: number;
  name: string;
  img?: string;
  remark?: string;
  isDel: number;
  createdAt: Date;
  updatedAt: Date;
}

// 定义登录响应类型
export type IVendorsQueryResponse = IResponse<IPagination<IProduct>>;

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
export interface IVendorQueryParams {
  limit: number;
  page: number;
  name?: string;
}

// 定义注册请求参数类型
export interface RegisterParams {
  email: string;
  password: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 获取供应商列表
export const getVendors = async (data: IVendorQueryParams): Promise<IVendorsQueryResponse> => {
  return request.get<IVendorsQueryResponse>("/api/vendor", { params: data });
};

// export const userRegister = (
//   data: RegisterParams
// ): Promise<RegisterResponse> => {
//   return request.post<RegisterResponse>("/api/user/register", data);
// };
