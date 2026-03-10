import { Button, Form, Input, Space } from "antd";
import { useState } from "react";
import { PageOperation } from "../../enum";
import { IClient, IClientBody, IClientUpdateParams } from "../../api/client";
import { pickIncrementalFields } from "../../utils/common";
import { pick } from "lodash";

/** onSubmit 的入参类型：create 时为 IClientBody，update 时为 IClientUpdateParams */
interface ClientFormProps<T = IClientBody> {
	onSubmit?: (data: T) => Promise<IClient>;
	initialValues?: Omit<IClient, "id">;
	pageOperation: PageOperation;
}

export default function ClientForm<T extends IClientUpdateParams = IClientBody>(
	props: ClientFormProps<T>
) {
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
			onFinish={async (values: Omit<IClient, "id">) => {
				if (!props.onSubmit) return;
				setLoading(true);
				try {
					const data =
						props.pageOperation === "update" && props.initialValues
							? (pick(
									values,
									pickIncrementalFields<T>(values as T, props.initialValues as T).updated
								) as T)
							: (values as T);
					await props.onSubmit(data);
				} finally {
					setLoading(false);
				}
			}}
			autoComplete="off"
		>
			<Form.Item<Omit<IClient, "id">>
				label="名字"
				name="name"
				rules={[
					{ required: true, message: "请输入客户名字" },
					{ min: 2, message: "客户名称至少2个字符" },
				]}
			>
				<Input />
			</Form.Item>
			<Form.Item<Omit<IClient, "id">>
				label="电话"
				required={true}
				name="tel"
				rules={[
					{
						validator: (rule, value, callback) => {
							if (!value) {
								callback("请输入电话");
							}
							if (!/1[3-9]\d{9}/.test(value)) {
								callback("请输入正确的电话");
							}
							callback();
						},
					},
				]}
			>
				<Input />
			</Form.Item>
			<Form.Item<Omit<IClient, "id">>
				label="地址"
				name="address"
				rules={[{ max: 30, message: "供应商名称最多30个字符" }]}
			>
				<Input />
			</Form.Item>

			<Form.Item<Omit<IClient, "id">> label="备注" name="remark">
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
