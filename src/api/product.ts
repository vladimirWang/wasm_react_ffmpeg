import { nodejsRequest } from "../request";
import { IPaginationResp, IPagination, IResponse } from "./commonDef";
import { IVendor } from "./vendor";
import type { IAttr } from "./attr";

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
	salePrice: number;
	vendor?: IVendor;
	desc?: string;
	productJoinSkus?: { attr: IAttr }[];
	// 产品变体（真实 SKU = 完整规格组合）及各组合库存；组合 = productVariantJoinAttrs 的 attrId 集合
	variants?: {
		id: number;
		balance: number;
		productVariantJoinAttrs: { attrId: number; attrCategoryId: number }[];
	}[];
}

/**
 * 产品 + 属性 扁平化项：将 IProduct 按 productJoinSkus 展开后每项附加 attrId。
 * 用于按 productId + attrId 组合进行去重/过滤的场景（如 useDistinctProducts）。
 */
export type IProductAttrItem = IProduct & { attrId: number };

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
	isDeleted: "1" | "0";
};

// 定义注册请求参数类型
export interface RegisterParams {
	email: string;
	password: string;
}

// 获取产品列表
export const getProducts = async (
	data?: IProductQueryParams | { pagination: 0 | 1 }
): Promise<IProductsQueryResponse> => {
	return nodejsRequest.get<IProductsQueryResponse>("/product", { params: data });
};

// 根据ID获取产品详情
export const getProductDetailById = (id: number): Promise<IProduct> => {
	return nodejsRequest.get<IProduct>("/product/" + id);
};

export type IProductUpdateParams = Partial<
	Omit<IProduct, "id" | "createdAt" | "updatedAt" | "isDel" | "productJoinSkus">
> & {
	// 产品关联的属性 id 集合（表单提交用）
	attrIds?: number[];
	// 表单内的属性分类筛选值（不提交后端，仅用于过滤属性选项）
	attrCategoryIds?: number[];
};

// 更新产品详情
export const patchProductById = (id: number, data: IProductUpdateParams): Promise<IProduct> => {
	return nodejsRequest.patch<IProduct>("/product/" + id, data);
};

export type IProductCreateParams = Omit<IProduct, "id" | "createdAt" | "updatedAt" | "isDel">;
// 新增产品列表
export const createProduct = async (data: IProductUpdateParams): Promise<IProduct> => {
	return nodejsRequest.post<IProduct>("/product", data);
};

// 根据供应商id查询产品
export const getProductsByVendorId = async (
	vendorId: number,
	params?: IProductQueryParams
): Promise<IProductsQueryResponse> => {
	return nodejsRequest.get<IProductsQueryResponse>("/product/getProductsByVendorId/" + vendorId, {
		params,
	});
};

export interface ILatestShelfPrice {
	shelfPrice: number | null;
}
// 根据产品id获取最近一次的建议零售价
export const getLatestShelfPriceByProductId = (productId: number): Promise<ILatestShelfPrice> => {
	return nodejsRequest.get<ILatestShelfPrice>(
		"/product/getLatestShelfPriceByProductId/" + productId
	);
};

export const checkProductNameExistedInVendor = (
	vendorId: number,
	params: { productName: string }
) => {
	return nodejsRequest.get<IProduct>("/product/checkProductNameExistedInVendor/" + vendorId, {
		params,
	});
};

interface ProductAmountQuery {
	amount: number;
	moreThan: boolean;
	desc?: boolean;
}

export const getProductsByAmount = async (params: ProductAmountQuery) => {
	return nodejsRequest.get<IProductsQueryResponse>("/product/getProductsByAmount", { params });
};
