import { Bar } from "@ant-design/charts";
import { useEffect, useState } from "react";
import { getTopProductsByVolume } from "../../api/statistics";
import { message } from "antd";
import dayjs from "dayjs";

const TopProductsByVolume = () => {
	const [data, setData] = useState<
		{ productName: string; totalCount: number }[]
	>([]);

	const startDate = dayjs().subtract(3, "month").toDate();
	const endDate = dayjs().toDate();

	const loadData = async () => {
		try {
			const result = await getTopProductsByVolume({ startDate, endDate });
			setData(
				result.map((item) => ({
					productName: item.productName,
					totalCount: item.totalCount,
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
		xField: "totalCount",
		yField: "productName",
		seriesField: "productName",
		legend: false,
		title: {
			title: "销量最好的10个产品(近3个月)",
			subtitle: `${dayjs(startDate).format("YYYY-MM-DD")} 至 ${dayjs(endDate).format("YYYY-MM-DD")}`,
		},
		label: {
			text: "totalCount",
			position: "right",
		},
	};

	return <Bar {...config} />;
};

export default TopProductsByVolume;
