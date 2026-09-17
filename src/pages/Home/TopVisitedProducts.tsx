import { Bar } from "@ant-design/charts";

const data = [
	{ product: "高清摄像头 1080P", visits: 3450 },
	{ product: "人体工学鼠标", visits: 2990 },
	{ product: "USB-C 扩展坞", visits: 2760 },
	{ product: "机械键盘 87键", visits: 2340 },
	{ product: "智能手表 Series 6", visits: 2100 },
	{ product: "降噪头戴耳机", visits: 1860 },
	{ product: "游戏手柄 X1", visits: 1620 },
	{ product: "便携式充电宝 20000mAh", visits: 1450 },
	{ product: "无线蓝牙耳机 Pro", visits: 1320 },
	{ product: "4K 高清显示器 27寸", visits: 1180 },
];

const TopVisitedProducts = () => {
	const config = {
		data,
		// Bar 为水平条形图（内部转置坐标）：分类放 xField 显示在左侧，数值放 yField
		xField: "product",
		yField: "visits",
		autoFit: true,
		color: "#4096ff",
		title: {
			title: "访问量前十的商品",
			subtitle: "按最近一个月访问次数降序排列",
		},
		label: { text: "visits", position: "right" as const },
		legend: false,
	};

	return <Bar {...config} />;
};

export default TopVisitedProducts;
