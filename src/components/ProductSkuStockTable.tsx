import { useMemo } from "react";
import { Table } from "antd";
import type { TableProps } from "antd";
import type { IAttr } from "../api/attr";

/** SKU（变体）：组合 = productVariantJoinAttrs 的 attrId 集合 */
export interface ISkuStockVariant {
	id: number;
	balance: number;
	productVariantJoinAttrs?: { attrId: number; attrCategoryId: number }[];
}

interface SkuRow {
	key: number;
	balance: number;
	/** attrCategoryId -> 该 SKU 在此分类下选中的属性名 */
	cells: Record<number, string>;
}

interface ProductSkuStockTableProps {
	/** 产品的变体（SKU）库存列表 */
	variants?: ISkuStockVariant[];
	/** 产品关联的属性（含分类），用于把属性 id 映射为名称 */
	attrs?: IAttr[];
	loading?: boolean;
}

/**
 * SKU 库存展示表格（纯展示组件，自身不发数据请求）。
 *
 * 规格分类作为动态列，每个 SKU 一行，库存低于 10 标红。
 * 抽屉（ProductSkuStockDrawer）与将来的独立库存页面都可直接复用本组件：
 * 只需传入变体列表与该产品关联的属性列表。
 */
export function ProductSkuStockTable({
	variants = [],
	attrs = [],
	loading,
}: ProductSkuStockTableProps) {
	// 属性 id -> 属性
	const attrMap = useMemo(() => new Map(attrs.map(attr => [attr.id, attr])), [attrs]);
	// 分类 id -> 分类名
	const categoryNameMap = useMemo(() => {
		const map = new Map<number, string>();
		for (const attr of attrs) {
			if (attr.attrCategory) map.set(attr.attrCategory.id, attr.attrCategory.name);
		}
		return map;
	}, [attrs]);

	// 出现过的规格分类（作为列），按 id 升序
	const categoryIds = useMemo(() => {
		const set = new Set<number>();
		for (const variant of variants) {
			for (const join of variant.productVariantJoinAttrs ?? []) {
				set.add(join.attrCategoryId);
			}
		}
		return [...set].sort((a, b) => a - b);
	}, [variants]);

	const dataSource = useMemo<SkuRow[]>(
		() =>
			variants.map(variant => {
				const cells: Record<number, string> = {};
				for (const join of variant.productVariantJoinAttrs ?? []) {
					cells[join.attrCategoryId] = attrMap.get(join.attrId)?.name ?? `#${join.attrId}`;
				}
				return { key: variant.id, balance: variant.balance, cells };
			}),
		[variants, attrMap]
	);

	const columns = useMemo<TableProps<SkuRow>["columns"]>(() => {
		const cols: TableProps<SkuRow>["columns"] = [
			{
				title: "#",
				key: "index",
				width: 50,
				render: (_v, _r, index) => index + 1,
			},
		];
		if (categoryIds.length === 0) {
			// 无规格商品：只有一个空组合
			cols.push({ title: "规格", key: "spec", render: () => "默认" });
		}
		for (const categoryId of categoryIds) {
			cols.push({
				title: categoryNameMap.get(categoryId) ?? `分类#${categoryId}`,
				key: `cat_${categoryId}`,
				render: (_v, row) => row.cells[categoryId] ?? "-",
			});
		}
		cols.push({
			title: "库存数",
			dataIndex: "balance",
			key: "balance",
			render: (value: number) =>
				value < 10 ? <span className="text-red-500">{value}</span> : value,
		});
		return cols;
	}, [categoryIds, categoryNameMap]);

	return (
		<Table<SkuRow>
			size="small"
			rowKey="key"
			columns={columns}
			dataSource={dataSource}
			loading={loading}
			pagination={false}
			locale={{ emptyText: "暂无 SKU 库存数据" }}
		/>
	);
}
