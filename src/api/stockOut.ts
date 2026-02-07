import request from "../request";
import { sleep } from "../utils/common";
import {
	IPaginationResp,
	IPagination,
	IResponse,
	StockOperationRecord,
	IProductJoinStockOperation,
} from "./commonDef";
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

export interface IProductJoinStockOut extends IProductJoinStockOperation {
	price: number;
}

// Excel 解析后的数据格式（如需复用可在页面/组件中引入）
export interface StockOutRecord extends StockOperationRecord {
	price: number;
}

export interface ICreateStockOutParams {
	remark?: string;
	productJoinStockOut: IProductJoinStockOut[];
	createdAt: string;
}

type IStockOutsQueryResponse = IPaginationResp<IStockOut>;
// type IStockOutResponse = IResponse<IStockOut>;

export const getStockOuts = (params: IProductQueryParams): Promise<IStockOutsQueryResponse> => {
	return request.get<IStockOutsQueryResponse>("/stockout", { params });
};

// 获取出货详情
export const getStockOutDetailById = async (id: number): Promise<IStockOut> => {
	return request.get<IStockOut>("/stockout/" + id);
};

// 更新出货记录
export const updateStockOut = async (
	id: number,
	data?: ICreateStockOutParams
): Promise<IStockOutsQueryResponse> => {
	return request.put<IStockOut>("/stockout/" + id, data);
};

// 新建出货
export const createStockOut = (data: ICreateStockOutParams) => {
	return request.post("/stockout/multiple", data);
};

export const confirmStockOutCompleted = (id: number) => {
	return request.patch("/stockout/confirmCompleted/" + id);
};
