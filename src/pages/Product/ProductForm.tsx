import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import { getProductDetailById, IProductHistoryCostItem, IProductUpdateParams } from "../../api/product";
import { Button, Card, Empty, Form, Input, InputNumber, Select, Spin, Upload } from "antd";
import { RcFile } from "antd/es/upload";
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { getVendors, IVendor } from "../../api/vendor";
import { Line } from "@ant-design/charts";
import dayjs from "dayjs";

export default function ProductForm({
	initialValues,
	onFinishCallback,
}: {
	initialValues?: IProductUpdateParams;
	onFinishCallback?: (values: IProductUpdateParams) => Promise<void>;
}) {
	const [form] = Form.useForm();
	const { id } = useParams();

	const [imageUrl, setImageUrl] = useState<string>();
	const [loading, setLoading] = useState(false);

	const beforeUpload = (file: RcFile) => {
		const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
		if (!isJpgOrPng) {
			alert("You can only upload JPG/PNG file!");
		}
		return isJpgOrPng;
	};
	const handleChange = () => {};

	const uploadButton = (
		<button style={{ border: 0, background: "none" }} type="button">
			{loading ? <LoadingOutlined /> : <PlusOutlined />}
			<div style={{ marginTop: 8 }}>Upload</div>
		</button>
	);

	// const [vendors, setVendors] = useState<IVendor[]>([]);

	const vendorsFetch = async () => {
		const res = await getVendors({ pagination: false });
		if (res.code !== 200) return [];
		console.log("---res---: ", res.data);
		const { list } = res.data;
		return list.map(item => ({ value: item.id, label: item.name }));
	};

	const {
		data: vendors,
		error: getVendorsError,
		isLoading: getVendorsLoading,
	} = useSWR("https://api.example.com/data", vendorsFetch, {
		revalidateOnFocus: true,
	});

	type CostHistoryPoint = { time: string; cost: number };

	const fetchCostHistory = async (productId: number): Promise<CostHistoryPoint[]> => {
		const res = await getProductDetailById(productId);
		if (res.code !== 200) return [];

		const raw = (res.data as unknown as { historyCost?: unknown }).historyCost;
		const arr = Array.isArray(raw) ? raw : [];

		const last10 = arr.slice(-10);
		return last10.map((it, idx) => {
			// 兼容：后端约定 historyCost[].value
			const item = it as Partial<IProductHistoryCostItem> | number;
			const value = typeof item === "number" ? item : Number(item.value);
			const timeRaw =
				typeof item === "object" && item
					? (item.createdAt ?? item.updatedAt ?? item.time ?? item.date)
					: undefined;
			const time = timeRaw ? dayjs(timeRaw).format("YYYY-MM-DD HH:mm") : `#${idx + 1}`;
			return { time, cost: value };
		});
	};

	const productId = id ? Number(id) : undefined;
	const {
		data: costHistory,
		isLoading: costHistoryLoading,
		error: costHistoryError,
	} = useSWR(productId ? ["product-cost-history", productId] : null, () => fetchCostHistory(productId!), {
		revalidateOnFocus: false,
	});

	const lineConfig = useMemo(() => {
		return {
			data: costHistory || [],
			height: 260,
			xField: "time",
			yField: "cost",
			style: { lineWidth: 2 },
			point: { size: 3 },
		};
	}, [costHistory]);

	return (
		<div>
			<Form
				form={form}
				name="basic"
				initialValues={initialValues}
				labelCol={{ span: 8 }}
				wrapperCol={{ span: 16 }}
				// style={{ maxWidth: 600 }}
				onFinish={async values => {
					if (!onFinishCallback) return;
					setLoading(true);
					try {
						await onFinishCallback(values);
					} catch (e) {
					} finally {
						setLoading(false);
					}
				}}
				autoComplete="off"
			>
				<div className="flex gap-6 justify-between w-full">
					<section className="flex-1">
						<Form.Item<IProductUpdateParams>
							label="供应商"
							name="vendorId"
							rules={[{ required: true, message: "请选择供应商" }]}
						>
							<Select
								style={{ width: 120 }}
								// onChange={handleChange}
								options={vendors}
							/>
						</Form.Item>
						<Form.Item<IProductUpdateParams>
							label="名称"
							name="name"
							rules={[{ required: true, message: "请输入名称" }]}
						>
							<Input />
						</Form.Item>
						<Form.Item<IProductUpdateParams>
							label="价格"
							name="latestPrice"
							rules={[{ required: true, message: "请输入价格" }]}
						>
							<InputNumber min={0} precision={0} />
						</Form.Item>
						<Form.Item<IProductUpdateParams>
							label="成本"
							name="latestCost"
							rules={[{ required: true, message: "请输入成本!" }]}
						>
							<InputNumber min={0} precision={0} />
						</Form.Item>
						<Form.Item<IProductUpdateParams> label="备注" name="remark">
							<Input.TextArea showCount maxLength={190} />
						</Form.Item>
					</section>
					<section className="flex-1">
						<Form.Item<IProductUpdateParams>
							label=""
							name="name"
							rules={[{ required: true, message: "请输入名称" }]}
						>
							<Upload
								name="avatar"
								listType="picture-card"
								className="avatar-uploader"
								showUploadList={false}
								action="https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload"
								beforeUpload={beforeUpload}
								onChange={handleChange}
							>
								{imageUrl ? (
									<img draggable={false} src={imageUrl} alt="avatar" style={{ width: "100%" }} />
								) : (
									uploadButton
								)}
							</Upload>
						</Form.Item>

						<Card size="small" title="历史成本（最近 10 条）">
							{!productId ? (
								<Empty description="创建产品时暂无历史成本" />
							) : (
								<Spin spinning={costHistoryLoading}>
									{costHistoryError ? (
										<Empty description="历史成本加载失败" />
									) : (costHistory || []).length === 0 ? (
										<Empty description="暂无历史成本数据" />
									) : (
										<Line {...lineConfig} style={{ width: "100%" }} />
									)}
								</Spin>
							)}
						</Card>
					</section>
				</div>
				<Form.Item label={null}>
					<Button type="primary" htmlType="submit">
						提交
					</Button>
				</Form.Item>
			</Form>
		</div>
	);
}
