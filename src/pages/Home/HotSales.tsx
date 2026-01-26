import { Pie } from "@ant-design/charts";
import React, { useEffect, useState } from "react";
import { getHotSales } from "../../api/statistics";
import { message } from "antd";
import dayjs from "dayjs";

interface HotSalesData {
	type: string;
	value: number;
}

const HotSales = () => {
	const [data, setData] = useState<HotSalesData[]>([]);

	const startDate = dayjs().subtract(3, "month").toDate();
	const endDate = dayjs().toDate();
	const loadData = async () => {
		try {
			// // 2025-06-01&endDate=2026-01-26
			// const startDate = new Date("2025-08-01");
			// const endDate = new Date("2026-01-26");
			const result = await getHotSales({ startDate, endDate });
			// 根据 API 返回的数据格式更新状态
			// 假设 API 返回的数据格式为 { type: string, value: number }[]
			if (result?.code === 200) {
				setData(
					result.data.map((item: any) => ({
						type: item.product.name,
						value: item.count * item.price,
					}))
				);
			}
		} catch (e) {
			message.error((e as Error).message);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	const config = {
		data,
		angleField: "value",
		colorField: "type",
		// color: ["#FF6B6B", "#4ECDC4", "#FFD166", "#06D6A0"],
		title: {
			title: `${dayjs(startDate).format("YYYY-MM-DD")} 至 ${dayjs(endDate).format("YYYY-MM-DD")} 热销商品`,
		},
		label: {
			text: "value",
			style: {
				fontWeight: "bold",
			},
		},
		legend: {
			color: {
				title: false,
				position: "right",
				rowPadding: 5,
			},
		},
	};

	return <Pie {...config} />;
};

export default HotSales;
