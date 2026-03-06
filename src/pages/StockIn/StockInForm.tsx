import {
	Button,
	Form,
	Input,
	Select,
	Space,
	Divider,
	message,
	DatePicker,
	Flex,
	Tooltip,
} from "antd";
import type { DatePickerProps, TableProps } from "antd";
import { IVendor, IVendorUpdateParams } from "../../api/vendor";
import { useEffect, useMemo, useState } from "react";
import { IProductJoinStockIn, IStockIn } from "../../api/stockIn";
import { PlusSquareOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { getProducts, IProduct, getLatestShelfPriceByProductId } from "../../api/product";
import { PageOperation } from "../../enum";
import { PositiveInputNumber } from "../../components/PositiveInputNumber";
import { useDistinctProducts } from "../../hooks/useDistinctProducts";
import StockOperationTable, { JoinFieldRow } from "../../components/StockOperationTable";
import dayjs from "dayjs";
import { disabledFuture } from "../../utils/common";
// import VendorProductTree from "../../components/VendorProductTree";

interface StockInFormProps {
	pageOperation: PageOperation;
	onFinishCallback?: (
		formValue: IVendorUpdateParams & { productJoinStockIn: IProductJoinStockIn[] }
	) => Promise<void>;
	initialValues?: IStockIn;
}

export default function StockInForm(props: StockInFormProps) {
	const [loading, setLoading] = useState(false);
	const [form] = Form.useForm();

	const editable = useMemo(() => {
		return props.pageOperation !== "view";
	}, [props.pageOperation]);

	type StockInFormValues = IVendorUpdateParams & {
		productJoinStockIn: IProductJoinStockIn[];
	};

	const productJoinStockInData: IProductJoinStockIn[] = Form.useWatch("productJoinStockIn", form);

	const [allProducts, setAllProducts] = useState<IProduct[]>([]);

	// const [shelfPriceMap, setShelfPriceMap] = useState<Partial<Record<number, number>>>({});

	// const makeCacheProductShelfPriceMap = async (val: number): Promise<number> => {
	// 	if (shelfPriceMap[val]) {
	// 		return shelfPriceMap[val];
	// 	}
	// 	const latestShelfPrice = await getLatestShelfPriceByProductId(val);

	// 	if (latestShelfPrice.shelfPrice) {
	// 		// productShelfPriceMap[val] = latestShelfPrice.shelfPrice as number;
	// 		setShelfPriceMap(prev => ({ ...prev, [val]: latestShelfPrice.shelfPrice as number }));
	// 	}
	// 	return latestShelfPrice.shelfPrice as number;
	// };

	const columnsBase: TableProps<JoinFieldRow>["columns"] = [
		{
			title: "成本价",
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
		// {
		// 	title: (
		// 		<Flex gap={10}>
		// 			<span>推荐零售价</span>
		// 			<Tooltip title="推荐零售价是根据商品的历史价格计算得出的，用于指导零售价的设置。第一次进货的商品须手动设置">
		// 				<QuestionCircleOutlined />
		// 			</Tooltip>
		// 		</Flex>
		// 	),
		// 	key: "shelfPrice",
		// 	width: 200,
		// 	render: (_v, row) => {
		// 		return (
		// 			<Form.Item
		// 				name={[row.name, "shelfPrice"]}
		// 				style={{ marginBottom: 0 }}
		// 				rules={[{ required: true, message: "请输入价格" }]}
		// 			>
		// 				<PositiveInputNumber
		// 					disabled={!editable}
		// 					min={1}
		// 					precision={0}
		// 					style={{ width: "100%" }}
		// 					placeholder="请输入价格"
		// 					addonAfter="元"
		// 				/>
		// 			</Form.Item>
		// 		);
		// 	},
		// },
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

	const [productVendorMap, setProductVendorMap] = useState<Partial<Record<number, number>>>({});
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
					let { productJoinStockIn, remark } = values;
					// 找出产品对应的供应商信息
					for (const item of productJoinStockIn) {
						let vendorId = productVendorMap[item.productId];
						if (!vendorId) {
							throw new Error(`商品id: ${item.productId} 没有找到对应的供应商信息`);
						}
						item.vendorId = vendorId;
					}
					if (remark === null) {
						values.remark = undefined;
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
							onUpdateProductVendorMap={setProductVendorMap}
							editable={editable}
							pageOperation={props.pageOperation}
							columnsBase={columnsBase}
							fields={fields}
							remove={remove}
							currentValues={productJoinStockInData}
							allData={allProducts}
							onAdd={() => {
								add({ productId: undefined, cost: 1, count: 1, shelfPrice: 1 });
							}}
							// onSelectProduct={async (val, row) => {
							// 	const shelfPrice = await makeCacheProductShelfPriceMap(val);
							// 	form.setFieldValue(["productJoinStockIn", row.name, "shelfPrice"], shelfPrice);
							// }}
						/>
					</>
				)}
			</Form.List>
			<Divider />
			<Form.Item name="createdAt" label="创建日期">
				<DatePicker placeholder="请选择创建日期" disabledDate={disabledFuture} />
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
