// 待分页结构的泛型接口
export interface IPaginationResp<T> {
	total: number;
	list: T[];
}

export interface IResponse<T> {
	data: T;
	code: number;
	message?: string;
}

export type Undefinedify<T> = Partial<Record<keyof T, undefined>>;

// 定义登录请求参数类型
export interface IPagination {
	limit?: number;
	page?: number;
}

export type IPaginationOptional =
	| (AtLeastOne<IPagination> & Undefinedify<{ pagination: boolean }>)
	| { pagination: false };

// 至少包含其中一个属性
export type AtLeastOne<T> = {
	[K in keyof T]-?: Pick<T, K> & Partial<Omit<T, K>>;
}[keyof T];
