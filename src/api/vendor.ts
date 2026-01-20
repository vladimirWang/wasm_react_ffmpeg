import request from "../request";
import { sleep } from "../utils/common";
import { IPaginationResp, IResponse } from "./commonDef";

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
export type IVendorsQueryResponse = IResponse<IPaginationResp<IVendor>>;

export interface IVendor {
	readonly id: number;
	name: string;
	isDel: number;
	remark?: string;
	createdAt: Date;
	updatedAt: Date;
}
// 定义注册响应类型
export type VendorDetailResponse = IResponse<IVendor>;

// 定义登录请求参数类型
export interface IVendorQueryParams {
	limit?: number;
	page?: number;
	name?: string;
	pagination?: boolean;
}

// 定义注册请求参数类型
export interface RegisterParams {
	email: string;
	password: string;
}

// 获取供应商列表
export const getVendors = async (data?: IVendorQueryParams): Promise<IVendorsQueryResponse> => {
	return request.get<IVendorsQueryResponse>("/api/vendor", { params: data });
};

// 根据ID获取供应商详情
export const getVendorDetailById = async (id: number): Promise<VendorDetailResponse> => {
	return request.get<VendorDetailResponse>("/api/vendor/" + id);
};

// 供应商更新参数类型
export type IVendorUpdateParams = Partial<
	Omit<IVendor, "id" | "createdAt" | "updatedAt" | "isDel">
>;
// 更新供应商详情
export const updateVendorDetailById = (
	id: number,
	data: IVendorUpdateParams
): Promise<VendorDetailResponse> => {
	return request.put<VendorDetailResponse>("/api/vendor/" + id, data);
};

export type IVendorCreateParams = Omit<IVendor, "id" | "createdAt" | "updatedAt" | "isDel">;
// 创建供应商
export const createVendor = async (data: IVendorUpdateParams): Promise<VendorDetailResponse> => {
	return request.post<VendorDetailResponse>("/api/vendor/", data);
};
