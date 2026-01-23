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
}

export const getStockOuts = () => {
	return request.get("/api/stockout");
};
