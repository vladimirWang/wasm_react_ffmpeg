import { Button, Table, TableProps } from "antd";
import React from "react";
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
}

export default function StockOperationTable<T extends IProductJoinStockOperation>(
	props: StockOperationTableProps<T>
) {
	const { columnsBase, fields, remove, editable, pageOperation, onAdd, allData, currentValues } =
		props;

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
