import { useMemo } from "react";

// 获取剩下未选中过的商品
export const useDistinctProducts = <T extends { id: number }>(
	allProducts: T[],
	selectedProducts: { productId: number }[]
): T[] => {
	// 剩下未选中过的商品
	const restProducts = useMemo(() => {
		if (!Array.isArray(selectedProducts) || selectedProducts.length === 0) {
			return allProducts;
		}
		return allProducts.filter(item => {
			return !selectedProducts.some(p => p.productId === item.id);
		});
	}, [selectedProducts]);

	return restProducts;
};
