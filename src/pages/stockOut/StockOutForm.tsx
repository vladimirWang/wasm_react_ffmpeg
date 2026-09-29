import { Button, Form, Input, Select, Space, Divider, message, DatePicker, Upload } from "antd";
import type { TableProps } from "antd";
import type { RcFile } from "antd/es/upload";
import { IVendorUpdateParams } from "../../api/vendor";
import { useEffect, useMemo, useState } from "react";
import { IProductJoinStockOut, IStockOut, IStockOutCreateParams } from "../../api/stockOut";
import {
	getProducts,
	IProduct,
	getProductsByAmount,
} from "../../api/product";
import { PageOperation } from "../../enum";
import { PositiveInputNumber } from "../../components/PositiveInputNumber";
import StockOperationTable from "../../components/StockOperationTable";
import { disabledFuture } from "../../utils/common";
import dayjs from "dayjs";
import { getPlatforms, IPlatform } from "../../api/platform";
import { getClients, IClient } from "../../api/client";
import { PlusOutlined, UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { uploadFile } from "../../api/util";
import ImageUpload from "../../components/ImageUpload";
// import VendorProductTree from "../../components/VendorProductTree";

interface StockInFormProps {
	redirect?: string;
	pageOperation: PageOperation;
	onFinishCallback?: (formValue: IStockOutCreateParams) => Promise<void>;
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
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [form] = Form.useForm();

	const [allProducts, setAllProducts] = useState<IProduct[]>([]);
	const editable = useMemo(() => {
		return props.pageOperation !== "view";
	}, [props.pageOperation]);

	type JoinFieldRow = { key: number; name: number };

	const [productVendorMap, setProductVendorMap] = useState<Partial<Record<number, number>>>({});
	// 产品id → (规格组合 specSkuIds → 该变体库存)
	const [productVariantMap, setProductVariantMap] = useState<
		Record<number, Record<string, number>>
	>({});

	const columnsBase: TableProps<JoinFieldRow>["columns"] = [
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
				const rowValue = productJoinStockOutData?.[row.name];
				// 按所选完整规格组合取变体库存上限；未选规格时不限制（后端仍做超卖校验）
				const max =
					rowValue?.productId != null && rowValue.specSkuIds
						? productVariantMap[rowValue.productId]?.[rowValue.specSkuIds]
						: undefined;
				return (
					<Form.Item
						name={[row.name, "count"]}
						style={{ marginBottom: 0 }}
						rules={[{ required: true, message: "请输入数量" }]}
					>
						<PositiveInputNumber
							disabled={!editable}
							min={1}
							style={{ width: "100%" }}
							max={max}
						/>
					</Form.Item>
				);
			},
		},
	];

	const loadProducts = async () => {
		try {
			const res = await getProductsByAmount({ amount: 0, moreThan: true });
			// const res = await getProducts();
			console.log("[DEBUG] getProductsByAmount res:", res);
			console.log("[DEBUG] res.list[0]?.vendor:", res.list?.[0]?.vendor);
			setAllProducts(res.list);
		} catch (e) {
			message.error((e as Error).message);
		}
	};

	const [platforms, setPlatforms] = useState<IPlatform[]>([]);

	const loadPlatforms = async () => {
		try {
			const res = await getPlatforms();
			setPlatforms(res);
		} catch (e) {
			message.error((e as Error).message);
		}
	};
	const [clients, setClients] = useState<IClient[]>([]);
	const loadClients = async () => {
		try {
			const { list } = await getClients({ pagination: 0 });

			setClients(list);
		} catch (e) {
			message.error((e as Error).message);
		}
	};

	useEffect(() => {
		loadProducts();
		loadPlatforms();
		loadClients();
	}, []);

	const productJoinStockOutData: IProductJoinStockOut[] = Form.useWatch(
		"productJoinStockOut",
		form
	);

	const platformId = Form.useWatch("platformId", form);

	useEffect(() => {
		if (platformId === undefined) return;
		form.validateFields(["platformOrderNo"]);
	}, [platformId, form]);

	return (
		<Form
			disabled={!editable}
			form={form}
			name="basic"
			initialValues={{
				...props.initialValues,
				createdAt: props.initialValues?.createdAt
					? dayjs(props.initialValues.createdAt)
					: undefined,
			}}
			labelCol={{ span: 4 }}
			wrapperCol={{ span: 18 }}
			onFinish={async (values: IStockOutCreateParams) => {
				if (!props.onFinishCallback) return;
				setLoading(true);
				try {
					const { productJoinStockOut, platformId, platformOrderNo } = values;
					// 找出产品对应的供应商信息
					for (const item of productJoinStockOut) {
						let vendorId = productVendorMap[item.productId];
						if (!vendorId) {
							throw new Error(`商品id: ${item.productId} 没有找到对应的供应商信息`);
						}
						item.vendorId = vendorId;
					}
					// if (!clientId) {
					// 	values.clientId = null;
					// }
					// if (remark === null) {
					// 	values.remark = undefined;
					// }
					await props.onFinishCallback({
						...values,
						productJoinStockOut,
						platformId,
						platformOrderNo: platformId === 1 ? undefined : platformOrderNo,
					});
				} catch (e: unknown) {
					message.error("创建出货异常: " + (e as Error).message);
				} finally {
					setLoading(false);
				}
			}}
			autoComplete="off"
		>
			<Form.List name="productJoinStockOut">
				{(fields, { add, remove }) => (
					<StockOperationTable<IProductJoinStockOut>
						onUpdateProductVendorMap={setProductVendorMap}
						editable={editable}
						pageOperation={props.pageOperation}
						columnsBase={columnsBase}
						fields={fields}
						remove={remove}
						currentValues={productJoinStockOutData ?? []}
						allData={allProducts}
						listName="productJoinStockOut"
						onAdd={() => {
							add({ productId: undefined, price: 1, count: 1 });
						}}
						onProductDetailLoaded={(productId, detail) => {
							// 从变体列表构建 规格组合 → 库存 的映射（选择与回显都会触发）
							const variantBalance: Record<string, number> = {};
							for (const v of detail.variants ?? []) {
								variantBalance[v.specSkuIds] = v.balance;
							}
							setProductVariantMap(prev => ({
								...prev,
								[productId]: variantBalance,
							}));
						}}
					/>
				)}
			</Form.List>
			<Divider />
			<Form.Item name="createdAt" label="创建日期">
				<DatePicker placeholder="请选择创建日期" disabledDate={disabledFuture} />
			</Form.Item>
			<Form.Item name="platformId" label="平台" rules={[{ required: true, message: "请选择平台" }]}>
				<Select
					options={platforms}
					fieldNames={{ label: "name", value: "id" }}
					placeholder="请选择平台"
				/>
			</Form.Item>
			{platformId !== 1 && (
				<Form.Item
					name="platformOrderNo"
					label="平台订单号"
					rules={[{ required: true, message: "请填写平台订单号" }]}
				>
					<Input placeholder="请填写平台订单号" />
				</Form.Item>
			)}

			<Form.Item label="客户" rules={[{ required: true, message: "请选择客户" }]}>
				<div className="flex items-center gap-2">
					<Form.Item name="clientId" noStyle>
						<Select
							placeholder="请选择客户"
							options={clients}
							fieldNames={{ label: "name", value: "id" }}
							onChange={val => {
								if (val === undefined) {
									form.setFieldValue("clientId", null);
								}
							}}
						/>
					</Form.Item>
					<Button
						type="primary"
						onClick={() => {
							navigate("/client/create?redirect=" + (props.redirect ?? ""));
						}}
					>
						<PlusOutlined />
					</Button>
				</div>
			</Form.Item>
			<Form.Item name="docs" label="单据">
				<ImageUpload maxCount={3} />
			</Form.Item>
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
	);
}
