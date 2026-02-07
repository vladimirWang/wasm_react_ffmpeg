import request from "../request";
import { IPaginationResp, IPagination, IResponse } from "./commonDef";
import { IVendor } from "./vendor";

// 产品类型定义
export interface IProductHistoryCostItem {
	// 后端返回：historyCost[].value
	value: number;
	createdAt?: string | Date;
	updatedAt?: string | Date;
	time?: string | Date;
	date?: string | Date;
}

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
	latestPrice: number;
	latestCost: number;
	productCode?: string;
	historyCost?: IProductHistoryCostItem[];
	stockInPending: number;
	stockOutPending: number;
	shelfPrice: number;
	vendor?: IVendor;
}

// 定义登录响应类型
export type IProductsQueryResponse = IPaginationResp<IProduct>;

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
export type IProductQueryParams = IPagination & {
	productName?: string;
	deletedStart?: string;
	deletedEnd?: string;
	vendorName?: string;
	completedStart?: string;
	completedEnd?: string;
};

// 定义注册请求参数类型
export interface RegisterParams {
	email: string;
	password: string;
}

// 获取产品列表
export const getProducts = async (
	data?: IProductQueryParams | { pagination: false }
): Promise<IProductsQueryResponse> => {
	return request.get<IProductsQueryResponse>("/product", { params: data });
};

// 根据ID获取产品详情
export const getProductDetailById = (id: number): Promise<IProduct> => {
	return request.get<IProduct>("/product/" + id);
};

export type IProductUpdateParams = Partial<
	Omit<IProduct, "id" | "createdAt" | "updatedAt" | "isDel">
>;

// 更新产品详情
export const patchProductById = (
	id: number,
	data: IProductUpdateParams
): Promise<IResponse<IProduct>> => {
	return request.patch<IProduct>("/product/" + id, data);
};

export type IProductCreateParams = Omit<IProduct, "id" | "createdAt" | "updatedAt" | "isDel">;
// 新增产品列表
export const createProduct = async (data: IProductUpdateParams): Promise<IProduct> => {
	return request.post<IProduct>("/product", data);
};

// 根据供应商id查询产品
export const getProductsByVendorId = async (
	vendorId: number,
	params?: IProductQueryParams
): Promise<IProductsQueryResponse> => {
	return request.get<IProductsQueryResponse>("/product/getProductsByVendorId/" + vendorId, {
		params,
	});
};

export interface ILatestShelfPrice {
	shelfPrice: number | null;
}
// 根据产品id获取最近一次的建议零售价
export const getLatestShelfPriceByProductId = (productId: number): Promise<ILatestShelfPrice> => {
	return request.get<ILatestShelfPrice>("/product/getLatestShelfPriceByProductId/" + productId);
};

export const checkProductNameExistedInVendor = (
	vendorId: number,
	params: { productName: string }
) => {
	return request.get<IProduct>("/product/checkProductNameExistedInVendor/" + vendorId, {
		params,
	});
};
