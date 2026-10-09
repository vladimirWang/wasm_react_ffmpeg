import { nodejsRequest } from "../request";

// 属性分类
export interface IAttrCategory {
	id: number;
	name: string;
}

// 属性（规格值）
export interface IAttr {
	id: number;
	name: string;
	attrCategoryId: number;
	attrCategory?: IAttrCategory;
}

// 获取属性分类列表
export const getAttrCategories = (): Promise<{ list: IAttrCategory[] }> => {
	return nodejsRequest.get("/attr/category");
};

// 新增属性分类
export const createAttrCategory = (data: { name: string }): Promise<IAttrCategory> => {
	return nodejsRequest.post("/attr/category", data);
};

// 获取属性列表（可按分类 id 集合过滤）
export const getAttrs = (params?: {
	categoryIds?: string;
	attrName?: string;
}): Promise<{ list: IAttr[] }> => {
	return nodejsRequest.get("/attr", { params });
};

// 新增属性
export const createAttr = (data: { name: string; attrCategoryId: number }): Promise<IAttr> => {
	return nodejsRequest.post("/attr", data);
};
