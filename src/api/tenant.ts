import { nodejsRequest } from "../request";

export interface ITenant {
	id: number;
	name: string;
	code: string;
	/** logo 访问地址（后端已拼 PUBLIC_BASE_URL 前缀；为空时为 null） */
	logo: string | null;
	status: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface IUpdateTenantParams {
	name?: string;
	/** 相对路径 /uploads/xxx.png；传 null 清除 logo */
	logo?: string | null;
}

/** 获取当前租户信息（仅 superUser） */
export const getTenantProfile = (): Promise<ITenant> => {
	return nodejsRequest.get<ITenant>("/tenant");
};

/** 更新租户名称 / logo（仅 superUser） */
export const updateTenant = (data: IUpdateTenantParams): Promise<ITenant> => {
	return nodejsRequest.put<ITenant>("/tenant", data);
};
