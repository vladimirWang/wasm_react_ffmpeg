import { Bar } from "@ant-design/charts";
import { useEffect, useState } from "react";
import { getTopProductsByRevenue } from "../../api/statistics";
import { message } from "antd";
import dayjs from "dayjs";

const TopProductsByRevenue = () => {
	const [data, setData] = useState<
		{ productName: string; totalRevenue: number }[]
	>([]);

	const startDate = dayjs().subtract(3, "month").toDate();
	const endDate = dayjs().toDate();

	const loadData = async () => {
		try {
			const result = await getTopProductsByRevenue({ startDate, endDate });
			setData(
				result.map((item) => ({
					productName: item.productName,
					totalRevenue: item.totalRevenue,
				})),
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
		xField: "totalRevenue",
		yField: "productName",
		seriesField: "productName",
		legend: false,
		title: {
			title: "销售额最高的10个产品(近3个月)",
			subtitle: `${dayjs(startDate).format("YYYY-MM-DD")} 至 ${dayjs(endDate).format("YYYY-MM-DD")}`,
		},
		label: {
			text: "totalRevenue",
			position: "right",
		},
	};

	return <Bar {...config} />;
};

export default TopProductsByRevenue;
