import { Button, Form, Input, message, Space } from "antd";
import { IVendorCreateParams, IVendorUpdateParams, VendorDetailResponse } from "../../api/vendor";
import { useState } from "react";
import { GlobalModal } from "../../components/GlobalModal";
import { PageOperation } from "../../enum";

interface VendorFormProps {
	onFinishCallback?: (data: IVendorUpdateParams) => Promise<VendorDetailResponse>;
	initialValues?: IVendorUpdateParams;
	pageOperation: PageOperation;
}
export default function VendorForm(props: VendorFormProps) {
	const [loading, setLoading] = useState(false);
	const [form] = Form.useForm();
	return (
		<Form
			disabled={props.pageOperation === "view"}
			form={form}
			name="basic"
			initialValues={{ ...props.initialValues }}
			labelCol={{ span: 8 }}
			wrapperCol={{ span: 16 }}
			style={{ maxWidth: 600 }}
			onFinish={async (values: IVendorUpdateParams) => {
				if (!props.onFinishCallback) return;
				setLoading(true);
				try {
					await props.onFinishCallback(values);
				} finally {
					setLoading(false);
				}
			}}
			autoComplete="off"
		>
			<Form.Item<IVendorUpdateParams>
				label="名称"
				name="name"
				rules={[
					{ required: true, message: "请输入供应商名称" },
					{ max: 10, message: "供应商名称最多10个字符" },
				]}
			>
				<Input />
			</Form.Item>

			<Form.Item<IVendorUpdateParams> label="备注" name="remark">
				<Input.TextArea showCount maxLength={190} />
			</Form.Item>
			<Form.Item label={null}>
				<Space>
					<Button type="primary" htmlType="submit" loading={loading}>
						提交
					</Button>

					<Button htmlType="reset" size="large" onClick={() => form.resetFields()}>
						重置
					</Button>
				</Space>
			</Form.Item>
		</Form>
	);
}
