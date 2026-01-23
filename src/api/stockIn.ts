import request from "../request";
import { sleep } from "../utils/common";
import { IPaginationResp, IPagination, IResponse } from "./commonDef";

export interface IStockIn {
	totalPrice: number;
	remark?: string;
	readonly id: number;
	productsJoinStock: [];
}
type IStockInsQueryResponse = IResponse<IPaginationResp<IStockIn>>;

// 获取进货记录
export const getStockIns = async (data?: IPagination): Promise<IStockInsQueryResponse> => {
	return request.get<IStockInsQueryResponse>("/api/stockin", { params: data });
};

export interface IProductJoinStockIn {
	cost: number;
	count: number;
	productId: number;
}

export interface IStockInCreateParams {
	productJoinStockIn: IProductJoinStockIn[];
	remark?: string;
}

// 获取进货记录
export const createStockIn = async (
	data?: IStockInCreateParams
): Promise<IStockInsQueryResponse> => {
	return request.post<IStockInsQueryResponse>("/api/stockin/multiple", data);
};

// 进货记录数据类型
export type IStockResponse = IResponse<IStockIn>;

// 获取进货记录
export const getStockInDetailById = async (id: number): Promise<IStockResponse> => {
	return request.get<IStockResponse>("/api/stockin/" + id);
};

// 获取进货记录
export const updateStockIn = async (id: number,
	data?: IStockInCreateParams
): Promise<IStockInsQueryResponse> => {
	return request.put<IStockInsQueryResponse>("/api/stockin/"+id, data);
};

// 文件上传接口
export const uploadStockInFile = async (file: File): Promise<IResponse<any>> => {
	const formData = new FormData();
	formData.append("file", file);

	// 使用 axios 直接上传，因为需要设置 multipart/form-data
	const axios = (await import("axios")).default;
	const token = localStorage.getItem("access_token");
	const baseURL = import.meta.env.VITE_API_BASE_URL || "";

	const response = await axios.post(
		`${baseURL}/api/upload/excel`,
		formData,
		{
			headers: {
				"Content-Type": "multipart/form-data",
				...(token && { Authorization: token }),
			},
		}
	);

	return response.data;
};
