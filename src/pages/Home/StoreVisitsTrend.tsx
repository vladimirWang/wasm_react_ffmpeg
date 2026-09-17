import { Line } from "@ant-design/charts";
import dayjs from "dayjs";

const generateDates = () => {
	const dates: string[] = [];
	for (let i = 9; i >= 0; i--) {
		dates.push(dayjs().subtract(i, "day").format("MM-DD"));
	}
	return dates;
};

const mockVisits = [1820, 1950, 2100, 1880, 2300, 2450, 2200, 2080, 2350, 1980];

const data = generateDates().map((date, i) => ({
	date,
	visits: mockVisits[i],
}));

const StoreVisitsTrend = () => {
	const config = {
		data,
		xField: "date",
		yField: "visits",
		autoFit: true,
		color: "#4096ff",
		title: {
			title: "过去十天店铺访问量",
			subtitle: "按日期展示每日店铺访问次数",
		},
		axis: {
			x: { title: "日期" },
			y: { title: "访问量" },
		},
		point: { shape: "circle", size: 4 },
	};

	return <Line {...config} />;
};

export default StoreVisitsTrend;
