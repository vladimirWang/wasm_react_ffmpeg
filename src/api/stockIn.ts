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
	joinData: IProductJoinStockIn[];
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
