import { useMemo } from "react";
import useSWR from "swr";
import { Drawer, Empty, Spin } from "antd";
import { Line } from "@ant-design/charts";
import dayjs from "dayjs";
import { getProductDetailById, IProductHistoryCostItem } from "../../api/product";

type CostHistoryPoint = { time: string; cost: number };

async function fetchCostHistory(productId: number): Promise<CostHistoryPoint[]> {
	const res = await getProductDetailById(productId);
	if (res.code !== 200) return [];

	const raw = (res.data as unknown as { historyCost?: unknown }).historyCost;
	const arr = Array.isArray(raw) ? raw : [];

	const last10 = arr.slice(-10);
	return last10.map((it, idx) => {
		// 兼容：后端约定 historyCost[].value
		const item = it as Partial<IProductHistoryCostItem> | number;
		const value = typeof item === "number" ? item : Number(item.value);
		const timeRaw =
			typeof item === "object" && item ? (item.createdAt ?? item.updatedAt ?? item.time ?? item.date) : undefined;
		const time = timeRaw ? dayjs(timeRaw).format("YYYY-MM-DD HH:mm") : `#${idx + 1}`;
		return { time, cost: value };
	});
}

export function CostHistoryDrawer({
	open,
	onClose,
	productId,
}: {
	open: boolean;
	onClose: () => void;
	productId?: number;
}) {
	const {
		data: costHistory,
		isLoading: costHistoryLoading,
		error: costHistoryError,
	} = useSWR(open && productId ? ["product-cost-history", productId] : null, () => fetchCostHistory(productId!), {
		revalidateOnFocus: false,
	});

	const lineConfig = useMemo(() => {
		return {
			data: costHistory || [],
			height: 320,
			xField: "time",
			yField: "cost",
			style: { lineWidth: 2 },
			point: { size: 3 },
		};
	}, [costHistory]);

	return (
		<Drawer
			open={open}
			onClose={onClose}
			title="历史成本（最近 10 条）"
			width={720}
			destroyOnClose
		>
			{!productId ? (
				<Empty description="创建产品时暂无历史成本" />
			) : (
				<Spin spinning={costHistoryLoading}>
					{costHistoryError ? (
						<Empty description="历史成本加载失败" />
					) : (costHistory || []).length === 0 ? (
						<Empty description="暂无历史成本数据" />
					) : (
						<Line {...lineConfig} style={{ width: "100%" }} />
					)}
				</Spin>
			)}
		</Drawer>
	);
}

