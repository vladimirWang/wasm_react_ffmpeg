import { Pie } from "@ant-design/charts";
import { useEffect, useMemo, useState } from "react";
import { getHotSales } from "../../api/statistics";
import { message, theme } from "antd";
import dayjs from "dayjs";
import { buildThemePalette } from "./chartColors";

interface HotSalesData {
	type: string;
	value: number;
}

const HotSales = () => {
	const [data, setData] = useState<HotSalesData[]>([]);
	const { token } = theme.useToken();
	// 饼图为多分类图表，使用由系统主题色派生的分类色板
	const palette = useMemo(
		() => buildThemePalette(token.colorPrimary),
		[token.colorPrimary]
	);

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
		// 各扇区颜色取自系统主题色派生色板（G2 v5 写法）
		scale: {
			color: { range: palette },
		},
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
