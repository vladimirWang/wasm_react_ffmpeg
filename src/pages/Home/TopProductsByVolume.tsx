import { Pie } from "@ant-design/charts";
import { useEffect, useState } from "react";
import { getTopProductsByVolume } from "../../api/statistics";
import { message } from "antd";
import dayjs from "dayjs";

interface VolumeData {
	type: string;
	value: number;
}

const TopProductsByVolume = () => {
	const [data, setData] = useState<VolumeData[]>([]);

	const startDate = dayjs().subtract(3, "month").toDate();
	const endDate = dayjs().toDate();

	const loadData = async () => {
		try {
			const result = await getTopProductsByVolume({ startDate, endDate });
			setData(
				result.map((item) => ({
					type: item.productName,
					value: item.totalCount,
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
		angleField: "value",
		colorField: "type",
		title: {
			title: `热销商品销量(近3个月)`,
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

export default TopProductsByVolume;
