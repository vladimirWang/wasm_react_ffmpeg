import { Button, Form, Input } from "antd";
import { IVendorCreateParams, IVendorUpdateParams } from "../../api/vendor";
import { useState } from "react";

interface VendorFormProps {
	onFinishCallback?: (data: IVendorUpdateParams) => Promise<void>;
	initialValues?: IVendorUpdateParams;
}
export default function VendorForm(props: VendorFormProps) {
	const [loading, setLoading] = useState(false);
	const [form] = Form.useForm();
	return (
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
					await props.onFinishCallback(values);
				} catch (e: unknown) {
				} finally {
					setLoading(false);
				}
			}}
			autoComplete="off"
		>
			<Form.Item<IVendorUpdateParams>
				label="名称"
				name="name"
				rules={[{ required: true, message: "Please input your username!" }]}
			>
				<Input />
			</Form.Item>

			<Form.Item<IVendorUpdateParams> label="备注" name="remark">
				<Input.TextArea />
			</Form.Item>
			<Form.Item label={null}>
				<Button type="primary" htmlType="submit" loading={loading}>
					提交
				</Button>
			</Form.Item>
		</Form>
	);
}
