import { Bar } from "@ant-design/charts";

const data = [
	{ product: "4K 高清显示器 27寸", repairs: 38 },
	{ product: "便携式充电宝 20000mAh", repairs: 31 },
	{ product: "降噪头戴耳机", repairs: 27 },
	{ product: "无线蓝牙耳机 Pro", repairs: 24 },
	{ product: "机械键盘 87键", repairs: 21 },
	{ product: "智能手表 Series 6", repairs: 18 },
	{ product: "游戏手柄 X1", repairs: 15 },
	{ product: "USB-C 扩展坞", repairs: 13 },
	{ product: "人体工学鼠标", repairs: 11 },
	{ product: "高清摄像头 1080P", repairs: 9 },
];

const TopRepairedProducts = () => {
	const config = {
		data,
		// Bar 为水平条形图（内部转置坐标）：分类放 xField 显示在左侧，数值放 yField
		xField: "product",
		yField: "repairs",
		autoFit: true,
		color: "#4096ff",
		title: {
			title: "返修次数前十的产品",
			subtitle: "按返修次数降序排列",
		},
		label: { text: "repairs", position: "right" as const },
		legend: false,
	};

	return <Bar {...config} />;
};

export default TopRepairedProducts;
