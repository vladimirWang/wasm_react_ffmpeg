import request from "../request";
import { sleep } from "../utils/common";
import { IPaginationResp, IPagination, IResponse } from "./commonDef";
import dayjs from "dayjs";

// 进货单状态
export type StockInStatus = "PENDING" | "COMPLETED";
export interface IStockIn {
	totalPrice: number;
	remark?: string;
	readonly id: number;
	productsJoinStock: [];
	status: StockInStatus;
	createdAt: Date;
	completedAt?: Date;
}

export interface getHotSalesParams {
	startDate: Date;
	endDate: Date;
}

// 热销商品
export const getHotSales = (params: getHotSalesParams) => {
	const startDate = dayjs(params.startDate).format("YYYY-MM-DD");
	const endDate = dayjs(params.endDate).format("YYYY-MM-DD");
	return request.get("/api/statistics/hot-sales", { params: { startDate, endDate } });
};
