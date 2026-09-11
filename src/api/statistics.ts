import { nodejsRequest } from "../request";
import dayjs from "dayjs";

export interface getStatisticsParams {
	startDate: Date;
	endDate: Date;
}

// —— 老的 HotSales 兼容接口（HotSales.tsx 在用）—— //

export interface getHotSalesParams {
	startDate: Date;
	endDate: Date;
}

type HotSalesItem = {
	product: any;
	totalAmount: number;
	productId: number;
};

export const getHotSales = (
	params: getHotSalesParams,
): Promise<HotSalesItem[]> => {
	const startDate = dayjs(params.startDate).format("YYYY-MM-DD");
	const endDate = dayjs(params.endDate).format("YYYY-MM-DD");
	return nodejsRequest.get<HotSalesItem[]>("/statistics/hot-sales", {
		params: { startDate, endDate },
	});
};

// —— 新增 3 个统计接口 —— //

export interface TopProductByRevenue {
	productId: number;
	productName: string;
	totalRevenue: number;
}

export interface TopProductByVolume {
	productId: number;
	productName: string;
	totalCount: number;
}

export interface TopVendorByRevenue {
	vendorId: number;
	vendorName: string;
	totalRevenue: number;
}

const formatDate = (date: Date) => dayjs(date).format("YYYY-MM-DD");

// 销售额最高的10个产品
export const getTopProductsByRevenue = (
	params: getStatisticsParams,
): Promise<TopProductByRevenue[]> => {
	return nodejsRequest.get<TopProductByRevenue[]>(
		"/statistics/top-products-by-revenue",
		{
			params: {
				startDate: formatDate(params.startDate),
				endDate: formatDate(params.endDate),
			},
		},
	);
};

// 销量最好的10个产品
export const getTopProductsByVolume = (
	params: getStatisticsParams,
): Promise<TopProductByVolume[]> => {
	return nodejsRequest.get<TopProductByVolume[]>(
		"/statistics/top-products-by-volume",
		{
			params: {
				startDate: formatDate(params.startDate),
				endDate: formatDate(params.endDate),
			},
		},
	);
};

// 销售额最高的品牌
export const getTopVendorsByRevenue = (
	params: getStatisticsParams,
): Promise<TopVendorByRevenue[]> => {
	return nodejsRequest.get<TopVendorByRevenue[]>(
		"/statistics/top-vendors-by-revenue",
		{
			params: {
				startDate: formatDate(params.startDate),
				endDate: formatDate(params.endDate),
			},
		},
	);
};
