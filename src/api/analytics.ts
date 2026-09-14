import { nodejsRequest } from "../request";
import dayjs from "dayjs";

export interface AnalyticsQueryParams {
	startDate?: Date;
	endDate?: Date;
}

export interface Overview {
	pv: number;
	uv: number;
}

export interface DailyTrendItem {
	day: string;
	pv: number;
	uv: number;
}

export interface TopPathItem {
	path: string;
	pv: number;
	avgDuration: number;
}

const fmt = (d: Date) => dayjs(d).format("YYYY-MM-DD");

export const getAnalyticsOverview = (
	params: AnalyticsQueryParams,
): Promise<Overview> => {
	return nodejsRequest.get<Overview>("/analytics/overview", {
		params: {
			...(params.startDate ? { startDate: fmt(params.startDate) } : {}),
			...(params.endDate ? { endDate: fmt(params.endDate) } : {}),
		},
	});
};

export const getAnalyticsDailyTrend = (
	params: AnalyticsQueryParams,
): Promise<DailyTrendItem[]> => {
	return nodejsRequest.get<DailyTrendItem[]>("/analytics/daily-trend", {
		params: {
			...(params.startDate ? { startDate: fmt(params.startDate) } : {}),
			...(params.endDate ? { endDate: fmt(params.endDate) } : {}),
		},
	});
};

export const getAnalyticsTopPaths = (
	params: AnalyticsQueryParams,
): Promise<TopPathItem[]> => {
	return nodejsRequest.get<TopPathItem[]>("/analytics/top-paths", {
		params: {
			...(params.startDate ? { startDate: fmt(params.startDate) } : {}),
			...(params.endDate ? { endDate: fmt(params.endDate) } : {}),
		},
	});
};
