import { useMemo } from "react";
import useSWR from "swr";
import { Drawer, Empty, Spin } from "antd";
import { getProductDetailById } from "../api/product";
import { ProductSkuStockTable } from "./ProductSkuStockTable";

interface ProductSkuStockDrawerProps {
	open: boolean;
	onClose: () => void;
	productId?: number;
	/** 产品名称，用于标题展示（加载期间也能立即显示） */
	productName?: string;
}

/**
 * SKU 库存抽屉：点击产品列表「库存数」时打开，拉取产品详情后展示该产品全部 SKU 的库存。
 * 展示部分复用 ProductSkuStockTable，将来独立库存页面可直接复用该表格组件。
 */
export function ProductSkuStockDrawer({
	open,
	onClose,
	productId,
	productName,
}: ProductSkuStockDrawerProps) {
	const { data, isLoading, error } = useSWR(
		open && productId ? ["product-sku-stock", productId] : null,
		() => getProductDetailById(productId!),
		{ revalidateOnFocus: false }
	);

	const attrs = useMemo(() => (data?.productJoinSkus ?? []).map(item => item.attr), [data]);
	const variants = data?.variants ?? [];
	const totalBalance = useMemo(
		() => variants.reduce((sum, variant) => sum + variant.balance, 0),
		[variants]
	);

	return (
		<Drawer
			open={open}
			onClose={onClose}
			size={720}
			title={productName ? `SKU 库存 · ${productName}` : "SKU 库存"}
			destroyOnHidden
		>
			<Spin spinning={isLoading}>
				{error ? (
					<Empty description="SKU 库存加载失败" />
				) : (
					<>
						{!isLoading && (
							<div className="mb-3 text-gray-500">
								共 {variants.length} 个 SKU，总库存 {totalBalance}
							</div>
						)}
						<ProductSkuStockTable variants={variants} attrs={attrs} />
					</>
				)}
			</Spin>
		</Drawer>
	);
}
