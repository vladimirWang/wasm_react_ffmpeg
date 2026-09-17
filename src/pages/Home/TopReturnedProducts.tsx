import { Bar } from "@ant-design/charts";

const data = [
	{ product: "无线蓝牙耳机 Pro", returns: 42 },
	{ product: "便携式充电宝 20000mAh", returns: 35 },
	{ product: "4K 高清显示器 27寸", returns: 28 },
	{ product: "降噪头戴耳机", returns: 22 },
	{ product: "游戏手柄 X1", returns: 19 },
	{ product: "机械键盘 87键", returns: 16 },
	{ product: "智能手表 Series 6", returns: 14 },
	{ product: "人体工学鼠标", returns: 12 },
	{ product: "高清摄像头 1080P", returns: 11 },
	{ product: "USB-C 扩展坞", returns: 10 },
];

const TopReturnedProducts = () => {
	const config = {
		data,
		// Bar 为水平条形图（内部转置坐标）：分类放 xField 显示在左侧，数值放 yField
		xField: "product",
		yField: "returns",
		autoFit: true,
		color: "#4096ff",
		title: {
			title: "退货次数前十的产品",
			subtitle: "按退货次数降序排列",
		},
		label: { text: "returns", position: "right" as const },
		legend: false,
	};

	return <Bar {...config} />;
};

export default TopReturnedProducts;
