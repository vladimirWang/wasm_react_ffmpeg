import { useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import { IProductUpdateParams } from "../../api/product";
import { Button, Card, Empty, Flex, Form, Input, InputNumber, Select, Upload } from "antd";
import { RcFile } from "antd/es/upload";
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { getVendors } from "../../api/vendor";
import { CostHistoryDrawer } from "./CostHistoryDrawer";

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
	const [uploading, setUploading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [costDrawerOpen, setCostDrawerOpen] = useState(false);

	const beforeUpload = (file: RcFile) => {
		const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
		if (!isJpgOrPng) {
			alert("You can only upload JPG/PNG file!");
		}
		return isJpgOrPng;
	};
	const handleChange = (info: any) => {
		const status = info?.file?.status as string | undefined;
		setUploading(status === "uploading");
		const fileObj = info?.file?.originFileObj as RcFile | undefined;
		if (fileObj) {
			setImageUrl(URL.createObjectURL(fileObj));
		}
	};

	const uploadButton = (
		<button style={{ border: 0, background: "none" }} type="button">
			{uploading ? <LoadingOutlined /> : <PlusOutlined />}
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
	} = useSWR("https://api.example.com/data", vendorsFetch, {
		revalidateOnFocus: true,
	});

	const productId = id ? Number(id) : undefined;

	return (
		<div className="p-6">
			<Form
				form={form}
				name="basic"
				initialValues={initialValues}
				labelCol={{ span: 6 }}
				wrapperCol={{ span: 18 }}
				onFinish={async values => {
					if (!onFinishCallback) return;
					setSubmitting(true);
					try {
						await onFinishCallback(values);
					} catch (e) {
					} finally {
						setSubmitting(false);
					}
				}}
				autoComplete="off"
			>
				<div className="flex gap-8 justify-between w-full">
					<section className="flex-1 space-y-4">
						<Form.Item<IProductUpdateParams>
							label="供应商"
							name="vendorId"
							rules={[{ required: true, message: "请选择供应商" }]}
						>
							<Select
								style={{ width: "100%" }}
								placeholder="请选择供应商"
								options={vendors}
							/>
						</Form.Item>
						<Form.Item<IProductUpdateParams>
							label="名称"
							name="name"
							rules={[{ required: true, message: "请输入名称" }]}
						>
							<Input placeholder="请输入产品名称" />
						</Form.Item>
						<Flex gap={16} align="flex-start">
							<Form.Item<IProductUpdateParams>
								label="价格"
								name="latestPrice"
								rules={[{ required: true, message: "请输入价格" }]}
								labelCol={{ span: 8 }}
								wrapperCol={{ span: 16 }}
								style={{ flex: 1, marginBottom: 0 }}
							>
								<InputNumber
									min={0}
									precision={0}
									style={{ width: "100%" }}
									placeholder="请输入价格"
								/>
							</Form.Item>
							<Form.Item<IProductUpdateParams>
								label="成本"
								name="latestCost"
								rules={[{ required: true, message: "请输入成本!" }]}
								labelCol={{ span: 8 }}
								wrapperCol={{ span: 16 }}
								style={{ flex: 1, marginBottom: 0 }}
							>
								<InputNumber
									min={0}
									precision={0}
									style={{ width: "100%" }}
									placeholder="请输入成本"
								/>
							</Form.Item>
						</Flex>
						<Form.Item<IProductUpdateParams> label="备注" name="remark">
							<Input.TextArea
								showCount
								maxLength={190}
								rows={4}
								placeholder="请输入备注信息"
							/>
						</Form.Item>
					</section>
					<section className="flex-1 space-y-4">
						<Form.Item<IProductUpdateParams>
							label="产品图片"
							name="img"
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

						<Card
							size="small"
							title="历史成本"
							className="mt-4"
							extra={
								productId && (
									<Button
										type="link"
										size="small"
										onClick={() => setCostDrawerOpen(true)}
									>
										查看详情
									</Button>
								)
							}
						>
							{!productId ? (
								<Empty
									description="创建产品时暂无历史成本"
									image={Empty.PRESENTED_IMAGE_SIMPLE}
								/>
							) : (
								<div className="text-gray-500 text-sm">
									点击右上角"查看详情"查看历史成本趋势
								</div>
							)}
						</Card>
					</section>
				</div>
				<Form.Item label={null} className="mt-6">
					<Button type="primary" htmlType="submit" loading={submitting} size="large">
						提交
					</Button>
				</Form.Item>
			</Form>
			<CostHistoryDrawer
				open={costDrawerOpen}
				onClose={() => setCostDrawerOpen(false)}
				productId={productId}
			/>
		</div>
	);
}
