import { nodejsRequest } from "../request";
import { sleep } from "../utils/common";
import {
	IPaginationResp,
	IPagination,
	IResponse,
	StockOperationRecord,
	IProductJoinStockOperation,
} from "./commonDef";

// 进货单状态
export type StockInStatus = "PENDING" | "COMPLETED";
export interface IStockIn {
	stockInCode: string;
	totalCost: number;
	remark?: string;
	readonly id: number;
	productJoinStockIn: IProductJoinStockIn[];
	status: StockInStatus;
	createdAt: Date;
	completedAt?: Date;
	deletedAt?: Date;
}

export interface IStockInWithProducts {
	totalCost: number;
	remark?: string;
	readonly id: number;
	products: IProduct[];
	status: StockInStatus;
	createdAt: Date;
	completedAt?: Date;
	deletedAt?: Date;
}
export type IStockInsQueryResponse = IPaginationResp<IStockInWithProducts>;

// 获取进货记录
export const getStockIns = async (
	data?: {
		productName?: string;
		deletedStart?: string;
		deletedEnd?: string;
		vendorName?: string;
		completedStart?: string;
		completedEnd?: string;
	} & IPagination
): Promise<IStockInsQueryResponse> => {
	return nodejsRequest.get<IStockInsQueryResponse>("/stockin", { params: data });
};

export interface IProductJoinStockIn extends IProductJoinStockOperation {
	cost: number;
	// shelfPrice: number;
}

// Excel 解析后的数据格式
export interface StockInRecord extends StockOperationRecord {
	cost: number;
	// shelfPrice?: number;
}

export interface IStockInCreateParams {
	createdAt?: string;
	productJoinStockIn: IProductJoinStockIn[];
	remark?: string;
}

// 获取进货记录
export const createStockIn = async (
	data?: IStockInCreateParams,
	config?: { showSuccessMessage: boolean; showErrorMessage?: boolean }
): Promise<IStockIn> => {
	// await sleep((Math.random() + 3) * 1000 + 1000);
	const res = await nodejsRequest.post<IStockIn>("/stockin/multiple", data, {
		showSuccessMessage: config?.showSuccessMessage ?? false, // 登录成功默认显示提示
	});
	// await sleep(2000);
	return res;
};

// // 进货记录数据类型
// export type IStockResponse = IResponse<IStockIn>;

// 获取进货记录
export const getStockInDetailById = async (id: number): Promise<IStockIn> => {
	return nodejsRequest.get<IStockIn>("/stockin/" + id);
};

// 获取进货记录
export const updateStockIn = async (
	id: number,
	data?: IStockInCreateParams
): Promise<IStockInsQueryResponse> => {
	return nodejsRequest.put<IStockInsQueryResponse>("/stockin/" + id, data);
};

// 文件上传接口
export const uploadStockInFile = async (file: File): Promise<IResponse<any>> => {
	const formData = new FormData();
	formData.append("file", file);

	// 使用 axios 直接上传，因为需要设置 multipart/form-data
	const axios = (await import("axios")).default;
	const token = localStorage.getItem("access_token");
	const baseURL = import.meta.env.VITE_API_BASE_URL || "";

	const response = await axios.post(`${baseURL}/upload/excel`, formData, {
		headers: {
			// "Content-Type": "multipart/form-data",
			...(token && { Authorization: token }),
		},
	});

	return response.data;
};

// 进货单确认完成
export const confirmStockInCompleted = async (id: number): Promise<IStockIn> => {
	return nodejsRequest.patch<IStockIn>("/stockin/confirmCompleted/" + id);
};

// 进货单批量删除
export const batchDeleteStockIn = async (ids: number[]): Promise<IStockIn[]> => {
	const p = ids.reduce((a, c) => {
		a.append("id", c);
		return a;
	}, new URLSearchParams());
	return nodejsRequest.delete<IStockIn[]>("/stockin/batchDelete", { params: p });
};
