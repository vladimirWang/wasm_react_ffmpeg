import { nodejsRequest } from "../request";
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
	stockOutCode: string;
}

export interface IProductJoinStockOut extends IProductJoinStockOperation {
	price: number;
}

// Excel 解析后的数据格式（如需复用可在页面/组件中引入）
export interface StockOutRecord extends StockOperationRecord {
	price: number;
	clientId: number;
	platformId: number;
	platformOrderNo: string;
}

export interface IStockOutCreateParams {
	remark?: string;
	productJoinStockOut: IProductJoinStockOut[];
	createdAt?: string;
	platformId: number;
	platformOrderNo: string;
	clientId: number;
}

type IStockOutsQueryResponse = IPaginationResp<IStockOut>;
// type IStockOutResponse = IResponse<IStockOut>;

export const getStockOuts = (params: IProductQueryParams): Promise<IStockOutsQueryResponse> => {
	return nodejsRequest.get<IStockOutsQueryResponse>("/stockout", { params });
};

// 获取出货详情
export const getStockOutDetailById = async (id: number): Promise<IStockOut> => {
	return nodejsRequest.get<IStockOut>("/stockout/" + id);
};

// 更新出货记录
export const updateStockOut = async (
	id: number,
	data?: IStockOutCreateParams
): Promise<IStockOutsQueryResponse> => {
	return nodejsRequest.put<IStockOut>("/stockout/" + id, data);
};

// 新建出货
export const createStockOut = async (
	data: IStockOutCreateParams,
	options?: { showSuccessMessage?: boolean }
) => {
	// await sleep(3000)
	return nodejsRequest.post("/stockout/multiple", data, {
		showSuccessMessage: options?.showSuccessMessage ?? true,
	});
};

export const confirmStockOutCompleted = (id: number) => {
	return nodejsRequest.patch("/stockout/confirmCompleted/" + id);
};

export const batchDeleteStockOut = async (ids: number[]): Promise<IStockIn[]> => {
	const p = ids.reduce((a, c) => {
		a.append("id", c);
		return a;
	}, new URLSearchParams());
	return nodejsRequest.delete<IStockIn[]>("/stockout/batchDelete", { params: p });
};
