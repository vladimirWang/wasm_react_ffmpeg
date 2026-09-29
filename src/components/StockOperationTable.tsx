import { Button, Form, Modal, Select, Table, TableProps, Tag } from "antd";
import React, { useEffect, useState } from "react";
import { PageOperation } from "../enum";
import { PlusSquareOutlined } from "@ant-design/icons";
import { IProductJoinStockOperation } from "../api/commonDef";
import { getProductDetailById, IProduct } from "../api/product";
import type { ISku } from "../api/sku";

export type JoinFieldRow = { key: number; name: number };

/**
 * 规格选择触发器：作为 Form.Item 子元素，接收 value（逗号分隔的 skuId 字符串），
 * 拼接对应 SKU 名称显示。点击后调用 onOpen 打开弹窗。
 * value 由 Form.Item 注入，onChange 不使用（值通过弹窗确认后 form.setFieldValue 写入）。
 */
interface SkuModalTriggerProps {
	value?: string;
	onChange?: (val: string | undefined) => void;
	skus: ISku[];
	loading?: boolean;
	isView?: boolean;
	disabled?: boolean;
	onOpen: () => void;
}

const SkuModalTrigger = ({
	value,
	skus,
	loading,
	isView,
	disabled,
	onOpen,
}: SkuModalTriggerProps) => {
	const ids = value ? value.split(",").map(Number).filter(Boolean) : [];
	const names = ids
		.map(id => skus.find(s => s.id === id)?.name)
		.filter(Boolean) as string[];
	const specText = names.join("/");
	if (isView) {
		return <span>{specText || "-"}</span>;
	}
	return (
		<Button
			onClick={onOpen}
			disabled={disabled}
			loading={loading}
			block
			style={{ textAlign: "left" }}
		>
			{specText || (loading ? "加载中..." : "请选择规格")}
		</Button>
	);
};

interface StockOperationTableProps<T> {
	columnsBase: TableProps<JoinFieldRow>["columns"];
	fields: JoinFieldRow[];
	remove: (name: number) => void;
	onAdd: () => void;
	editable: boolean;
	pageOperation: PageOperation;
	allData: IProduct[];
	currentValues: T[];
	/** Form.List 的字段名，用于程序化清空本行的 SKU 相关字段 */
	listName: string;
	onUpdateProductVendorMap: (map: Partial<Record<number, number>>) => void;
	onSelectProduct?: (productId: number, row: JoinFieldRow) => void;
	/** 产品详情加载完成（选择商品与编辑回显都会触发），父组件可据此缓存变体库存等 */
	onProductDetailLoaded?: (productId: number, detail: IProduct) => void;
}

export default function StockOperationTable<T extends IProductJoinStockOperation>(
	props: StockOperationTableProps<T>
) {
	const { columnsBase, fields, remove, editable, pageOperation, onAdd, currentValues } =
		props;

	const form = Form.useFormInstance();

	// 产品id → 该产品关联的 SKU 列表（来自产品详情，按产品缓存）
	const [productSkus, setProductSkus] = useState<Record<number, ISku[]>>({});
	const [loadingProductIds, setLoadingProductIds] = useState<Set<number>>(new Set());

	// 规格选择弹窗状态
	const [modalRowIndex, setModalRowIndex] = useState<number | null>(null);
	const [modalSelectedSkuIds, setModalSelectedSkuIds] = useState<Set<number>>(
		new Set(),
	);

	/** 拉取并缓存产品关联的 SKU（含分类信息） */
	const fetchProductSkus = async (productId: number) => {
		// 如果productId无效或已经缓存过该产品，直接返回undefined或缓存值
		if (!productId || productSkus[productId]) return productSkus[productId];
		setLoadingProductIds(prev => new Set(prev).add(productId));
		try {
			const detail = await getProductDetailById(productId);
			const skus = (detail.productJoinSkus ?? []).map(item => item.sku);
			setProductSkus(prev => ({ ...prev, [productId]: skus }));
			props.onProductDetailLoaded?.(productId, detail);
			return skus;
		} finally {
			setLoadingProductIds(prev => {
				const next = new Set(prev);
				next.delete(productId);
				return next;
			});
		}
	};

	// 取本行已选产品关联的 SKU
	const getRowSkus = (rowIndex: number): ISku[] => {
		const productId = currentValues?.[rowIndex]?.productId;
		if (!productId) return [];
		return productSkus[productId] ?? [];
	};

	// 产品id与供应商id的映射
	const productVendorMap: Partial<Record<number, number>> = {};

	// 产品下拉选项：展示所有产品（规格为弹窗多选，无法预枚举笛卡尔积排除）
	const getProductOptionsForRow = () => {
		return props.allData.map(item => {
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
							options={getProductOptionsForRow()}
							onChange={async val => {
								// 切换/清空商品时，清空本行规格
								form.setFieldValue([props.listName, row.name, "specSkuIds"], undefined);
								if (typeof val !== "number") return;
								// 缓存产品id和供应商的映射关系
								makeCacheProductVendorMap(val);
								// 选择商品，触发回调
								props.onSelectProduct?.(val, row);
								// 拉取该产品关联的 SKU
								await fetchProductSkus(val);
							}}
						/>
					</Form.Item>
				);
			},
		},
		{
			title: "规格",
			key: "specSkuIds",
			width: 160,
			render: (_v, row) => {
				const productId = currentValues?.[row.name]?.productId;
				const isView = pageOperation === "view";
				return (
					<Form.Item name={[row.name, "specSkuIds"]} style={{ marginBottom: 0 }}>
						<SkuModalTrigger
							skus={getRowSkus(row.name)}
							loading={productId ? loadingProductIds.has(productId) : false}
							isView={isView}
							disabled={!editable || !productId}
							onOpen={() => {
								setModalRowIndex(row.name);
								const currentSpecSkuIds = form.getFieldValue([
									props.listName,
									row.name,
									"specSkuIds",
								]);
								const ids = currentSpecSkuIds
									? currentSpecSkuIds.split(",").map(Number).filter(Boolean)
									: [];
								setModalSelectedSkuIds(new Set(ids));
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

	// 编辑/查看态：预加载各行产品关联的 SKU，用于回显分类与 SKU 文本
	useEffect(() => {
		if (!Array.isArray(props.currentValues)) return;
		props.currentValues.forEach(item => {
			if (item?.productId) {
				fetchProductSkus(item.productId);
			}
		});
	}, [props.currentValues]);

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
						disabled={!editable}
					>
						新增商品
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
			<Modal
				title="选择规格"
				open={modalRowIndex !== null}
				width={480}
				okText="确定"
				cancelText="取消"
				okButtonProps={{ disabled: modalSelectedSkuIds.size === 0 }}
				onOk={() => {
					if (modalRowIndex !== null) {
						const ids = [...modalSelectedSkuIds].sort((a, b) => a - b).join(",");
						form.setFieldValue(
							[props.listName, modalRowIndex, "specSkuIds"],
							ids || undefined,
						);
					}
					setModalRowIndex(null);
					setModalSelectedSkuIds(new Set());
				}}
				onCancel={() => {
					setModalRowIndex(null);
					setModalSelectedSkuIds(new Set());
				}}
			>
				{modalRowIndex !== null &&
					(() => {
						const skus = getRowSkus(modalRowIndex);
						// 按分类分组
						const categoryMap = new Map<number, string>();
						const uncategorized: ISku[] = [];
						for (const sku of skus) {
							if (sku.skuCategory) {
								if (!categoryMap.has(sku.skuCategory.id)) {
									categoryMap.set(sku.skuCategory.id, sku.skuCategory.name);
								}
							} else {
								uncategorized.push(sku);
							}
						}
						const renderSkuTag = (sku: ISku) => {
							const selected = modalSelectedSkuIds.has(sku.id);
							return (
								<Tag
									key={sku.id}
									color={selected ? "blue" : undefined}
									style={{
										cursor: "pointer",
										padding: "4px 12px",
										fontSize: 14,
									}}
									onClick={() => {
										setModalSelectedSkuIds(prev => {
											const next = new Set(prev);
											if (next.has(sku.id)) {
												next.delete(sku.id);
											} else {
												// 同分类下只能选一个，替换已选
												for (const id of next) {
													const s = skus.find(
														sku2 => sku2.id === id,
													);
													if (
														s?.skuCategoryId ===
														sku.skuCategoryId
													) {
														next.delete(id);
													}
												}
												next.add(sku.id);
											}
											return next;
										});
									}}
								>
									{sku.name}
								</Tag>
							);
						};
						return (
							<div>
								{[...categoryMap].map(([catId, catName]) => (
									<div key={catId} style={{ marginBottom: 16 }}>
										<div
											style={{ fontWeight: 500, marginBottom: 8 }}
										>
											{catName}
										</div>
										<div
											style={{
												display: "flex",
												flexWrap: "wrap",
												gap: 8,
											}}
										>
											{skus
												.filter(s => s.skuCategoryId === catId)
												.map(renderSkuTag)}
										</div>
									</div>
								))}
								{uncategorized.length > 0 && (
									<div style={{ marginBottom: 16 }}>
										<div
											style={{ fontWeight: 500, marginBottom: 8 }}
										>
											未分类
										</div>
										<div
											style={{
												display: "flex",
												flexWrap: "wrap",
												gap: 8,
											}}
										>
											{uncategorized.map(renderSkuTag)}
										</div>
									</div>
								)}
							</div>
						);
					})()}
			</Modal>
			</>
		);
	}
