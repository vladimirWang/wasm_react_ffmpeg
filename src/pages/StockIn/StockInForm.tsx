import { Button, Form, Input, InputNumber, Select, Table } from "antd";
import type { TableProps } from "antd";
import { IVendorCreateParams, IVendorUpdateParams } from "../../api/vendor";
import { useEffect, useState } from "react";
import { IProductJoinStockIn } from "../../api/stockIn";
import { PlusSquareOutlined } from "@ant-design/icons";
import { getProducts, IProduct } from "../../api/product";
import { produce } from "immer";
import VendorProductTree from "../../components/VendorProductTree";

interface StockInFormProps {
	onFinishCallback?: (
		formValue: IVendorUpdateParams,
		tableValue: IProductJoinStockIn[]
	) => Promise<void>;
	initialValues?: IVendorUpdateParams;
}

const defaultJoinData: IProductJoinStockIn[] = [
	// {
	// 	productId: 12,
	// 	cost: 10,
	// 	count: 20,
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
	const [joinData, setJoinData] = useState<IProductJoinStockIn[]>(defaultJoinData);

	const [products, setProducts] = useState<IProduct[]>([]);

	const columns: TableProps<IProductJoinStockIn>["columns"] = [
		{
			title: "序号",
			render: (_v, _r, idx) => {
				return idx + 1;
			},
		},
		{
			title: "商品名称",
			dataIndex: "productId",
			key: "productId",
			render: (_v, _r, idx) => {
				return (
					// <VendorProductTree
					// 	onChange={(vendorId: number, productId: number) => {
					// 		console.log("vendorId: ", vendorId, "; productId: ", productId);
					// 	}}
					// />
					<Select
						style={{ width: 150 }}
						options={products.map(item => ({ value: item.id, label: item.name }))}
						onSelect={value => {
							console.log("idx: ", idx, value);
							// joinData
							const nextState = produce(joinData, draftState => {
								draftState[idx].productId = value;
							});
							setJoinData(nextState);
						}}
					/>
				);
			},
		},
		{
			title: "价格",
			dataIndex: "cost",
			key: "cost",
			render: (_v, _r, idx) => {
				return (
					<InputNumber
						min={1}
						precision={0}
						style={{ width: 150 }}
						onChange={value => {
							console.log("set number: ", value);
							const nextState = produce(joinData, draftState => {
								draftState[idx].cost = Number(value);
							});
							setJoinData(nextState);
						}}
					/>
				);
			},
		},
		{
			title: "数量",
			dataIndex: "count",
			key: "count",
			render: (_v, _r, idx) => {
				return (
					<InputNumber
						min={1}
						precision={0}
						style={{ width: 150 }}
						onChange={value => {
							const nextState = produce(joinData, draftState => {
								draftState[idx].count = Number(value);
							});
							setJoinData(nextState);
						}}
					/>
				);
			},
		},
	];

	const loadProducts = async () => {
		try {
			const res = await getProducts();
			if (res.code === 200) {
				setProducts(res.data.list);
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
			<Button
				icon={<PlusSquareOutlined />}
				onClick={() => {
					setJoinData(joinData.concat({ productId: -1, cost: 1, count: 1 }));
				}}
			>
				新增
			</Button>
			<Table dataSource={joinData} columns={columns} />
			<Form
				form={form}
				name="basic"
				initialValues={props.initialValues}
				labelCol={{ span: 8 }}
				wrapperCol={{ span: 16 }}
				style={{ maxWidth: 600 }}
				onFinish={async (values: IVendorUpdateParams) => {
					if (!props.onFinishCallback) return;
					setLoading(true);
					try {
						await props.onFinishCallback(values, joinData);
					} catch (e: unknown) {
					} finally {
						setLoading(false);
					}
				}}
				autoComplete="off"
			>
				<Form.Item<IVendorUpdateParams> label="备注" name="remark">
					<Input.TextArea />
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
