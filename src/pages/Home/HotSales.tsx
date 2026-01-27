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
	const endDate = dayjs().subtract(1, "day").toDate();
	const loadData = async () => {
		try {
			// // 2025-06-01&endDate=2026-01-26
			// const startDate = new Date("2025-08-01");
			// const endDate = new Date("2026-01-26");
			const result = await getHotSales({ startDate, endDate });
			setData(
				result.map(item => ({
					type: item.product.name,
					value: item.totalAmount,
				}))
			);
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
			title: `热销商品销售额(近3个月)`,
			subtitle: `${dayjs(startDate).format("YYYY-MM-DD")} 至 ${dayjs(endDate).format("YYYY-MM-DD")}`,
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
