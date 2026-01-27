import request from "../request";
import { sleep } from "../utils/common";
import { IPaginationResp, IPagination, IResponse } from "./commonDef";
import { StockInStatus } from "./stockIn";

export interface IStockOut {
	readonly id: number;
	createdAt: Date;
	updatedAt: Date;
	completedAt?: Date;
	deletedAt?: Date;
	totalPrice: number;
	remark?: string;
	status: StockInStatus;
	productsJoinStock: [];
}

export interface IProductJoinStockOut {
	price: number;
	count: number;
	productId: number;
}

interface IStockOutRecord {
	productId: number;
	count: number;
	price: number;
}

export interface ICreateStockOutParams {
	remark?: string;
	productJoinStockOut: IProductJoinStockOut[];
}

type IStockOutsQueryResponse = IPaginationResp<IStockOut>;
// type IStockOutResponse = IResponse<IStockOut>;

export const getStockOuts = (): Promise<IStockOutsQueryResponse> => {
	return request.get<IStockOutsQueryResponse>("/api/stockout");
};

// 获取出货详情
export const getStockOutDetailById = async (id: number): Promise<IStockOut> => {
	return request.get<IStockOut>("/api/stockout/" + id);
};

// 更新出货记录
export const updateStockOut = async (
	id: number,
	data?: ICreateStockOutParams
): Promise<IStockOutsQueryResponse> => {
	return request.put<IStockOut>("/api/stockout/" + id, data);
};

// 新建出货
export const createStockOut = (data: ICreateStockOutParams) => {
	return request.post("/api/stockout/multiple", data);
};

export const confirmStockOutCompleted = (id: number) => {
	return request.patch("/api/stockout/confirmCompleted/" + id);
};
