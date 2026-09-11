import { Pie } from "@ant-design/charts";
import { useEffect, useState } from "react";
import { getTopVendorsByRevenue } from "../../api/statistics";
import { message } from "antd";
import dayjs from "dayjs";

const TopVendorsByRevenue = () => {
	const [data, setData] = useState<
		{ vendorName: string; totalRevenue: number }[]
	>([]);

	const startDate = dayjs().subtract(3, "month").toDate();
	const endDate = dayjs().toDate();

	const loadData = async () => {
		try {
			const result = await getTopVendorsByRevenue({ startDate, endDate });
			setData(
				result.map((item) => ({
					vendorName: item.vendorName,
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
		angleField: "totalRevenue",
		colorField: "vendorName",
		title: {
			title: "销售额最高的品牌(近3个月)",
			subtitle: `${dayjs(startDate).format("YYYY-MM-DD")} 至 ${dayjs(endDate).format("YYYY-MM-DD")}`,
		},
		label: {
			text: "totalRevenue",
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

export default TopVendorsByRevenue;
