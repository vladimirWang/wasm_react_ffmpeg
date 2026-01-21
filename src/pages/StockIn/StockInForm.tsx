import { Button, Form, Input, InputNumber, Select, Table } from "antd";
import type { TableProps } from "antd";
import { IVendorUpdateParams } from "../../api/vendor";
import { useEffect, useMemo, useState } from "react";
import { IProductJoinStockIn, IStockIn } from "../../api/stockIn";
import { PlusSquareOutlined } from "@ant-design/icons";
import { getProducts, IProduct } from "../../api/product";
import { PageOperation } from "../../enum";
// import VendorProductTree from "../../components/VendorProductTree";

interface StockInFormProps {
	pageOperation: PageOperation;
	onFinishCallback?: (
		formValue: IVendorUpdateParams,
		tableValue: IProductJoinStockIn[]
	) => Promise<void>;
	initialValues?: IStockIn;
	joinData?: IProductJoinStockIn[];
}

const defaultJoinData: IProductJoinStockIn[] = [
	// {
	// 	productId: -1,
	// 	cost: 4,
	// 	count: 1,
	// },
	// {
	// 	productId: 10,
	// 	cost: 9,
	// 	count: 10,
	// },
];

export default function StockInForm(props: StockInFormProps) {
	const [loading, setLoading] = useState(false);
	const [form] = Form.useForm();

	const [allProducts, setAllProducts] = useState<IProduct[]>([]);
	const editable = useMemo(() => {
		return props.pageOperation === "create";
	}, [props.pageOperation]);

	type StockInFormValues = IVendorUpdateParams & {
		joinData: IProductJoinStockIn[];
	};

	type JoinFieldRow = { key: number; name: number };

	const columnsBase: TableProps<JoinFieldRow>["columns"] = [
		{
			title: "#",
			render: (_v, _r, idx) => {
				return idx + 1;
			},
		},
		{
			title: "商品名称",
			key: "productId",
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
							style={{ width: 150 }}
							options={allProducts.map(item => ({
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
			key: "cost",
			render: (_v, row) => {
				return (
					<Form.Item
						name={[row.name, "cost"]}
						style={{ marginBottom: 0 }}
						rules={[{ required: true, message: "请输入价格" }]}
					>
						<InputNumber
							disabled={!editable}
							min={1}
							precision={0}
							style={{ width: 150 }}
						/>
					</Form.Item>
				);
			},
		},
		{
			title: "数量",
			key: "count",
			render: (_v, row) => {
				return (
					<Form.Item
						name={[row.name, "count"]}
						style={{ marginBottom: 0 }}
						rules={[{ required: true, message: "请输入数量" }]}
					>
						<InputNumber
							disabled={!editable}
							min={1}
							precision={0}
							style={{ width: 150 }}
						/>
					</Form.Item>
				);
			},
		},
	];

	const loadProducts = async () => {
		try {
			const res = await getProducts();
			if (res.code === 200) {
				setAllProducts(res.data.list);
			} else {
				alert(res.message);
			}
		} catch (e) {
			alert((e as Error).message);
		}
	};

	useEffect(() => {
		loadProducts();
	}, []);

	return (
		<div>
			<Form
				disabled={!editable}
				form={form}
				name="basic"
				initialValues={{
					...props.initialValues,
					joinData: props.joinData || defaultJoinData,
				}}
				labelCol={{ span: 8 }}
				wrapperCol={{ span: 16 }}
				style={{ maxWidth: 600 }}
				onFinish={async (values: StockInFormValues) => {
					if (!props.onFinishCallback) return;
					setLoading(true);
					try {
						const { joinData, ...rest } = values;
						await props.onFinishCallback(rest, joinData || []);
					} catch (e: unknown) {
					} finally {
						setLoading(false);
					}
				}}
				autoComplete="off"
			>
				<Form.List name="joinData">
					{(fields, { add, remove }) => (
						<>
							<Button
								icon={<PlusSquareOutlined />}
								onClick={() => {
									add({ productId: -1, cost: 1, count: 1 });
								}}
								disabled={!editable}
								size='small'
							>
								新增
							</Button>
							<Table
								size="small"
								rowKey="key"
								dataSource={fields.map(f => ({ key: f.key, name: f.name }))}
								columns={[
									...columnsBase,
									{
										title: "操作",
										key: "action",
										render: (_v: unknown, row: JoinFieldRow) => (
											<Button
												disabled={!editable}
												type="link"
												onClick={() => remove(row.name)}
											>
												删除
											</Button>
										),
									},
								]}
								// pagination={false}
							/>
						</>
					)}
				</Form.List>
				<Form.Item<IVendorUpdateParams> label="备注" name="remark">
					<Input.TextArea showCount maxLength={190} />
				</Form.Item>
				<Form.Item label={null}>
					<Button type="primary" htmlType="submit" loading={loading}>
						提交
					</Button>
				</Form.Item>
			</Form>
		</div>
	);
}
