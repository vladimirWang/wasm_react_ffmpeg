import { Button, Form, Select, Table, TableProps } from "antd";
import React, { useEffect, useState } from "react";
import { PageOperation } from "../enum";
import { PlusSquareOutlined } from "@ant-design/icons";
import { IProductJoinStockOperation } from "../api/commonDef";
import { useDistinctProducts } from "../hooks/useDistinctProducts";
import { IProduct } from "../api/product";

export type JoinFieldRow = { key: number; name: number };

interface StockOperationTableProps<T> {
	columnsBase: TableProps<JoinFieldRow>["columns"];
	fields: JoinFieldRow[];
	remove: (name: number) => void;
	onAdd: () => void;
	editable: boolean;
	pageOperation: PageOperation;
	allData: IProduct[];
	currentValues: T[];
	onUpdateProductVendorMap: (map: Partial<Record<number, number>>) => void;
	onSelectProduct?: (productId: number, row: JoinFieldRow) => void;
}

export default function StockOperationTable<T extends IProductJoinStockOperation>(
	props: StockOperationTableProps<T>
) {
	const { columnsBase, fields, remove, editable, pageOperation, onAdd, allData, currentValues } =
		props;

	// 产品id与供应商id的映射
	const productVendorMap: Partial<Record<number, number>> = {};

	// 根据其他航的选项，加载本行产品数据
	const getProductOptionsForRow = (rowIndex: number) => {
		const usedByOtherRows = new Set<number>();
		(currentValues || []).forEach((p, idx) => {
			// 只排除“其它行”已选的商品；本行当前值必须保留，才能在编辑态正常显示 label
			if (idx === rowIndex) return;
			if (!p || typeof p.productId !== "number") return;
			usedByOtherRows.add(p.productId);
		});
		return props.allData
			.filter(item => !usedByOtherRows.has(item.id))
			.map(item => {
				const vendorInfo = item.vendor;
				if (!vendorInfo) {
					return { value: item.id, label: item.name };
				}
				const withVendorName =
					vendorInfo.name.length > 5 ? vendorInfo.name.slice(0, 5) + "..." : vendorInfo.name;
				return { value: item.id, label: withVendorName + "/" + item.name };
			});
	};

	// 缓存产品id和供应商的映射关系
	const makeCacheProductVendorMap = async (val: number) => {
		if (productVendorMap[val]) {
			return;
		}
		const productFound = props.allData.find(item => {
			return item.id === val;
		});
		if (!productFound || !productFound.vendor) {
			return;
		}
		productVendorMap[val] = productFound.vendor.id;
		props.onUpdateProductVendorMap(productVendorMap);
	};

	const commonColumns: TableProps<JoinFieldRow>["columns"] = [
		{
			title: "#",
			width: 30,
			align: "center",
			// render: () => {
			// 	return <span>123</span>;
			// },
			render: (_v, _r, idx) => {
				return <span style={{ fontWeight: 500 }}>{idx + 1}</span>;
			},
		},
		{
			title: "商品名称",
			key: "productId",
			width: 200,
			render: (_v, row) => {
				return (
					<Form.Item
						name={[row.name, "productId"]}
						style={{ marginBottom: 0 }}
						rules={[{ required: true, message: "请选择商品" }]}
					>
						<Select
							disabled={!editable}
							allowClear={true}
							style={{ width: "100%" }}
							placeholder="请选择商品"
							options={getProductOptionsForRow(row.name)}
							onSelect={async val => {
								// 缓存产品id和供应商的映射关系
								makeCacheProductVendorMap(val);
								// 选择商品，触发回调
								props.onSelectProduct?.(val, row);
							}}
						/>
					</Form.Item>
				);
			},
		},
	];

	// 非新建状态下，初始化产品供应商映射关系
	useEffect(() => {
		if (!Array.isArray(props.currentValues) || props.currentValues.length === 0) {
			return;
		}
		if (props.allData.length === 0) {
			return;
		}
		props.currentValues.forEach(item => {
			makeCacheProductVendorMap(item.productId);
		});
	}, [props.currentValues, props.allData]);

	// 剩下未选中过的商品
	const restProducts = useDistinctProducts<IProduct>(allData, currentValues);
	return (
		<>
			{props.pageOperation !== "view" && (
				<div style={{ marginBottom: 16, textAlign: "right" }}>
					<Button
						type="primary"
						icon={<PlusSquareOutlined />}
						onClick={() => {
							onAdd();
						}}
						disabled={!editable || restProducts.length === 0}
					>
						新增商品(可选商品数: {restProducts.length > 99 ? "99+" : restProducts.length})
					</Button>
				</div>
			)}
			<Table
				size="middle"
				rowKey="key"
				dataSource={fields.map(f => ({ key: f.key, name: f.name }))}
				columns={[
					...commonColumns,
					...(columnsBase || []),
					...(pageOperation !== "view"
						? [
								{
									title: "操作",
									key: "action",
									width: 100,
									align: "center" as const,
									fixed: "right" as const,
									render: (_v: unknown, row: JoinFieldRow) => (
										<Button
											disabled={!editable}
											type="link"
											danger
											onClick={() => remove(row.name)}
										>
											删除
										</Button>
									),
								},
							]
						: []),
				]}
				pagination={false}
				locale={{
					emptyText: "暂无商品，请点击上方按钮添加",
				}}
				style={{
					background: "#fff",
				}}
			/>
		</>
	);
}
