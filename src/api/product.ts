import request from "../request";
import { IPagination, IResponse } from "./commonDef";

// 产品类型定义
export interface IProduct {
	readonly id: number;
	name: string;
	img?: string;
	vendorId: number;
	remark?: string;
	balance: number;
	isDel: number;
	createdAt: Date;
	updatedAt: Date;
	price: number;
	cost: number;
}

// 定义登录响应类型
export type IProductsQueryResponse = IResponse<IPagination<IProduct>>;

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
export interface IProductQueryParams {
	limit: number;
	page: number;
	name?: string;
}

// 定义注册请求参数类型
export interface RegisterParams {
	email: string;
	password: string;
}

// 获取产品列表
export const getProducts = async (data: IProductQueryParams): Promise<IProductsQueryResponse> => {
	return request.get<IProductsQueryResponse>("/api/product", { params: data });
};

// 根据ID获取产品详情
export const getProductDetailById = (id: number): Promise<IResponse<IProduct>> => {
	return request.get<IResponse<IProduct>>("/api/product/" + id);
};

export type IProductUpdateParams = Partial<
	Omit<IProduct, "id" | "createdAt" | "updatedAt" | "isDel">
>;

// 更新产品详情
export const updateProductById = (
	id: number,
	data: IProductUpdateParams
): Promise<IResponse<IProduct>> => {
	return request.patch<IResponse<IProduct>>("/api/product/" + id, data);
};

export type IProductCreateParams = Omit<IProduct, "id" | "createdAt" | "updatedAt" | "isDel">;
// 新增产品列表
export const createProduct = async (data: IProductUpdateParams): Promise<IResponse<IProduct>> => {
	return request.post<IResponse<IProduct>>("/api/product", data);
};
