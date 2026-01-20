import { Button, Form, Input, InputNumber, Select, Table } from "antd";
import type { TableProps } from "antd";
import { IVendorCreateParams, IVendorUpdateParams } from "../../api/vendor";
import { useEffect, useMemo, useState } from "react";
import { IProductJoinStockIn, IStockIn } from "../../api/stockIn";
import { PlusSquareOutlined } from "@ant-design/icons";
import { getProducts, IProduct } from "../../api/product";
import { produce } from "immer";
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
	const [joinData, setJoinData] = useState<IProductJoinStockIn[]>(
		props.joinData || defaultJoinData
	);

	const [allProducts, setAllProducts] = useState<IProduct[]>([]);
	const [restProducts, setRestProducts] = useState<IProduct[]>([]);
	const editable = useMemo(() => {
		return props.pageOperation === "create";
	}, [props.pageOperation]);
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
						disabled={!editable}
						value={joinData[idx].productId}
						allowClear={true}
						style={{ width: 150 }}
						options={allProducts.map(item => ({ value: item.id, label: item.name }))}
						onSelect={value => {
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
						disabled={!editable}
						value={joinData[idx].cost}
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
						disabled={!editable}
						value={joinData[idx].count}
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
		{
			title: "操作",
			render: (_v, _r, idx) => {
				return (
					<Button
						disabled={!editable}
						type="link"
						onClick={() => {
							// const newData = joinData.filter((item, index) => index !== idx);
							// console.log("newData:----- ", newData);
							// setJoinData(newData);
						}}
					>
						删除
					</Button>
				);
			},
		},
	];

	const loadProducts = async () => {
		try {
			const res = await getProducts();
			if (res.code === 200) {
				setAllProducts(res.data.list);
				setRestProducts(res.data.list);
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
				disabled={!editable}
			>
				新增
			</Button>
			<Table dataSource={joinData} columns={columns} />
			<Form
				disabled={!editable}
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
