import { nodejsRequest } from "../request";

// SKU 分类
export interface ISkuCategory {
	id: number;
	name: string;
}

// SKU（规格值）
export interface ISku {
	id: number;
	name: string;
	skuCategoryId: number;
	skuCategory?: ISkuCategory;
}

// 获取 SKU 分类列表
export const getSkuCategories = (): Promise<{ list: ISkuCategory[] }> => {
	return nodejsRequest.get("/sku/category");
};

// 新增 SKU 分类
export const createSkuCategory = (data: { name: string }): Promise<ISkuCategory> => {
	return nodejsRequest.post("/sku/category", data);
};

// 获取 SKU 列表（可按分类 id 集合过滤）
export const getSkus = (params?: {
	categoryIds?: string;
	skuName?: string;
}): Promise<{ list: ISku[] }> => {
	return nodejsRequest.get("/sku", { params });
};

// 新增 SKU
export const createSku = (data: { name: string; skuCategoryId: number }): Promise<ISku> => {
	return nodejsRequest.post("/sku", data);
};
