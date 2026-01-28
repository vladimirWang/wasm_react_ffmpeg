import {
	Button,
	Card,
	Form,
	Input,
	InputNumber,
	Select,
	Table,
	Space,
	Divider,
	message,
} from "antd";
import type { TableProps } from "antd";
import { IVendorUpdateParams } from "../../api/vendor";
import { useEffect, useMemo, useState } from "react";
import { IProductJoinStockOut, IStockOut } from "../../api/stockOut";
import { PlusSquareOutlined } from "@ant-design/icons";
import { getProducts, IProduct } from "../../api/product";
import { PageOperation } from "../../enum";
import { PositiveInputNumber } from "../../components/PositiveInputNumber";
import { useDistinctProducts } from "../../hooks/useDistinctProducts";
// import VendorProductTree from "../../components/VendorProductTree";

interface StockInFormProps {
	pageOperation: PageOperation;
	onFinishCallback?: (
		formValue: IVendorUpdateParams & { productJoinStockOut: IProductJoinStockOut[] }
	) => Promise<void>;
	initialValues?: IStockOut;
}

// const defaultJoinData: IProductJoinStockIn[] = [
// 	// {
// 	// 	productId: -1,
// 	// 	price: 4,
// 	// 	count: 1,
// 	// },
// 	// {
// 	// 	productId: 10,
// 	// 	price: 9,
// 	// 	count: 10,
// 	// },
// ];

export default function StockOutForm(props: StockInFormProps) {
	const [loading, setLoading] = useState(false);
	const [form] = Form.useForm();

	const [allProducts, setAllProducts] = useState<IProduct[]>([]);
	const editable = useMemo(() => {
		return props.pageOperation !== "view";
	}, [props.pageOperation]);

	type StockInFormValues = IVendorUpdateParams & {
		productJoinStockOut: IProductJoinStockOut[];
	};

	type JoinFieldRow = { key: number; name: number };

	const columnsBase: TableProps<JoinFieldRow>["columns"] = [
		{
			title: "#",
			width: 60,
			align: "center",
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
					// <VendorProductTree
					// 	onChange={(vendorId: number, productId: number) => {
					// 		console.log("vendorId: ", vendorId, "; productId: ", productId);
					// 	}}
					// />
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
							options={restProducts.map(item => ({
								value: item.id,
								label: item.name,
							}))}
						/>
					</Form.Item>
				);
			},
		},
		{
			title: "价格",
			key: "price",
			width: 150,
			render: (_v, row) => {
				return (
					<Form.Item
						name={[row.name, "price"]}
						style={{ marginBottom: 0 }}
						rules={[{ required: true, message: "请输入价格" }]}
					>
						<PositiveInputNumber
							disabled={!editable}
							min={1}
							style={{ width: "100%" }}
							addonAfter="元"
						/>
					</Form.Item>
				);
			},
		},
		{
			title: "数量",
			key: "count",
			width: 150,
			render: (_v, row) => {
				return (
					<Form.Item
						name={[row.name, "count"]}
						style={{ marginBottom: 0 }}
						rules={[{ required: true, message: "请输入数量" }]}
					>
						<PositiveInputNumber disabled={!editable} min={1} style={{ width: "100%" }} />
					</Form.Item>
				);
			},
		},
	];

	const loadProducts = async () => {
		try {
			const res = await getProducts();
			setAllProducts(res.list);
		} catch (e) {
			message.error((e as Error).message);
		}
	};

	useEffect(() => {
		loadProducts();
	}, []);

	const productJoinStockOutData: IProductJoinStockOut[] = Form.useWatch(
		"productJoinStockOut",
		form
	);

	// 剩下未选中过的商品
	const restProducts = useDistinctProducts<IProduct>(allProducts, productJoinStockOutData);

	return (
		<div style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh" }}>
			<Card
				title="出库单信息"
				style={{
					maxWidth: 1200,
					margin: "0 auto",
					boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
					borderRadius: "8px",
				}}
			>
				<Form
					disabled={!editable}
					form={form}
					name="basic"
					initialValues={{
						...props.initialValues,
					}}
					labelCol={{ span: 2 }}
					wrapperCol={{ span: 18 }}
					onFinish={async (values: StockInFormValues) => {
						if (!props.onFinishCallback) return;
						setLoading(true);
						try {
							await props.onFinishCallback(values || []);
						} catch (e: unknown) {
						} finally {
							setLoading(false);
						}
					}}
					autoComplete="off"
				>
					<Form.List name="productJoinStockOut">
						{(fields, { add, remove }) => (
							<>
								{props.pageOperation !== "view" && (
									<div style={{ marginBottom: 16, textAlign: "right" }}>
										<Button
											type="primary"
											icon={<PlusSquareOutlined />}
											onClick={() => {
												add({ productId: -1, price: 1, count: 1 });
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
										...columnsBase,
										...(props.pageOperation !== "view"
											? [
													{
														title: "操作",
														key: "action",
														width: 100,
														align: "center" as const,
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
						)}
					</Form.List>
					<Divider />

					<Form.Item<IVendorUpdateParams> label="备注" name="remark" style={{ marginBottom: 24 }}>
						<Input.TextArea
							showCount
							maxLength={190}
							rows={4}
							placeholder="请输入备注信息（可选）"
							style={{ resize: "none" }}
						/>
					</Form.Item>

					{props.pageOperation !== "view" && (
						<Form.Item label={null} style={{ marginBottom: 0 }}>
							<Space>
								<Button
									type="primary"
									htmlType="submit"
									loading={loading}
									size="large"
									style={{ minWidth: 120 }}
								>
									提交
								</Button>
								<Button htmlType="reset" size="large" onClick={() => form.resetFields()}>
									重置
								</Button>
							</Space>
						</Form.Item>
					)}
				</Form>
			</Card>
		</div>
	);
}
