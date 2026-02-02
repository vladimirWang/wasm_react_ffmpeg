import {
	Button,
	Card,
	Form,
	Input,
	Select,
	Table,
	Space,
	Divider,
	message,
	DatePicker,
} from "antd";
import type { TableProps } from "antd";
import { IVendor, IVendorUpdateParams } from "../../api/vendor";
import { useEffect, useMemo, useState } from "react";
import { IProductJoinStockIn, IStockIn } from "../../api/stockIn";
import { PlusSquareOutlined } from "@ant-design/icons";
import { getProducts, IProduct } from "../../api/product";
import { PageOperation } from "../../enum";
import { PositiveInputNumber } from "../../components/PositiveInputNumber";
import { useDistinctProducts } from "../../hooks/useDistinctProducts";
import StockOperationTable, { JoinFieldRow } from "../../components/StockOperationTable";
import dayjs from "dayjs";
// import VendorProductTree from "../../components/VendorProductTree";

interface StockInFormProps {
	pageOperation: PageOperation;
	onFinishCallback?: (
		formValue: IVendorUpdateParams & { productJoinStockIn: IProductJoinStockIn[] }
	) => Promise<void>;
	initialValues?: IStockIn;
}

// 产品id与供应商id的映射
const productVendorMap: Partial<Record<number, number>> = {};

export default function StockInForm(props: StockInFormProps) {
	const [loading, setLoading] = useState(false);
	const [form] = Form.useForm();

	const [allProducts, setAllProducts] = useState<IProduct[]>([]);
	const editable = useMemo(() => {
		return props.pageOperation !== "view";
	}, [props.pageOperation]);

	type StockInFormValues = IVendorUpdateParams & {
		productJoinStockIn: IProductJoinStockIn[];
	};

	const productJoinStockInData: IProductJoinStockIn[] = Form.useWatch("productJoinStockIn", form);

	// 根据其他航的选项，加载本行产品数据
	const getProductOptionsForRow = (rowIndex: number) => {
		const usedByOtherRows = new Set<number>();
		(productJoinStockInData || []).forEach((p, idx) => {
			// 只排除“其它行”已选的商品；本行当前值必须保留，才能在编辑态正常显示 label
			if (idx === rowIndex) return;
			if (!p || typeof p.productId !== "number") return;
			usedByOtherRows.add(p.productId);
		});

		return allProducts
			.filter(item => !usedByOtherRows.has(item.id))
			.map(item => {
				const vendorInfo = item.Vendor;
				if (!vendorInfo) {
					return { value: item.id, label: item.name };
				}
				const withVendorName =
					vendorInfo.name.length > 5 ? vendorInfo.name.slice(0, 5) + "..." : vendorInfo.name;
				return { value: item.id, label: withVendorName + "/" + item.name };
			});
	};

	// 缓存产品id和供应商的映射关系
	const makeCacheProductVendorMap = (val: number) => {
		if (productVendorMap[val]) {
			return;
		}
		const productFound = allProducts.find(item => {
			return item.id === val;
		});
		if (!productFound || !productFound.Vendor) {
			return;
		}
		productVendorMap[val] = productFound.Vendor.id;
	};

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
							onChange={makeCacheProductVendorMap}
						/>
					</Form.Item>
				);
			},
		},
		{
			title: "价格",
			key: "cost",
			width: 150,
			render: (_v, row) => {
				return (
					<Form.Item
						name={[row.name, "cost"]}
						style={{ marginBottom: 0 }}
						rules={[{ required: true, message: "请输入价格" }]}
					>
						<PositiveInputNumber
							disabled={!editable}
							min={1}
							precision={0}
							style={{ width: "100%" }}
							placeholder="请输入价格"
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

	return (
		<div style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh" }}>
			<Card
				title="入库单信息"
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
						createdAt: dayjs(),
						...props.initialValues,
					}}
					labelCol={{ span: 2 }}
					wrapperCol={{ span: 18 }}
					onFinish={async (values: StockInFormValues) => {
						const productJoinStockInValue = form.getFieldValue("productJoinStockIn");
						if (!Array.isArray(productJoinStockInValue) || productJoinStockInValue.length === 0) {
							message.error("进货明细数据必填");
							return;
						}
						if (!props.onFinishCallback) return;
						setLoading(true);
						try {
							let { productJoinStockIn } = values;
							// 找出产品对应的供应商信息
							for (const item of productJoinStockIn) {
								let vendorId = productVendorMap[item.productId];
								if (!vendorId) {
									throw new Error(`商品id: ${item.productId} 没有找到对应的供应商信息`);
								}
								item.vendorId = vendorId;
							}
							await props.onFinishCallback(values || []);
						} catch (e: unknown) {
							message.error((e as Error).message);
						} finally {
							setLoading(false);
						}
					}}
					autoComplete="off"
				>
					<Form.List name="productJoinStockIn">
						{(fields, { add, remove }) => (
							<>
								<StockOperationTable<IProductJoinStockIn>
									editable={editable}
									pageOperation={props.pageOperation}
									columnsBase={columnsBase}
									fields={fields}
									remove={remove}
									currentValues={productJoinStockInData}
									allData={allProducts}
									onAdd={() => {
										add({ productId: undefined, cost: 1, count: 1 });
									}}
								/>
							</>
						)}
					</Form.List>
					<Divider />
					<Form.Item name="createdAt" label="创建日期">
						<DatePicker />
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
			</Card>
		</div>
	);
}
