import { useState } from "react";
import { Button, Card, Form, FormItemProps, Input } from "antd";
import { useNavigate } from "react-router-dom";
import { userRegisterByToken } from "../../api/user";
import { sleep } from "../../utils/common";
import { formItemLayout } from "../Register/Register";
import { passwordRegex } from "../../regexp";

interface RegisterFormProps {
	token: string;
}

export const tailFormItemLayout: FormItemProps = {
	wrapperCol: { span: 24 },
};

export default function RegisterForm(props: RegisterFormProps) {
	const navigate = useNavigate();
	const { token } = props;
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);

	const onFinish = async (values: {
		username: string;
		password: string;
		confirm: string;
	}) => {
		try {
			setLoading(true);
			await userRegisterByToken({
				token,
				password: values.password,
				username: values.username,
			});
			await sleep(4500);
			navigate("/landing/login");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex justify-center items-center h-screen w-screen">
			<Card style={{ width: 440 }}>
				<Form
					style={{ width: "100%" }}
					{...formItemLayout}
					form={form}
					name="activate-register"
					onFinish={onFinish}
					scrollToFirstError
					layout="vertical"
				>
					<Form.Item
						name="username"
						label="用户名"
						rules={[
							{ required: true, message: "请输入用户名！" },
							{ max: 8, message: "用户名长度不能大于8位" },
						]}
					>
						<Input placeholder="请输入用户名" />
					</Form.Item>
					<Form.Item
						name="password"
						label="密码"
						rules={[
							{ required: true, message: "请输入密码！" },
							{
								pattern: passwordRegex,
								message: "密码长度为6-8位，只能包含数字、字母、特殊字符",
							},
						]}
						hasFeedback
					>
						<Input.Password placeholder="请输入密码" />
					</Form.Item>
					<Form.Item
						name="confirm"
						label="确认密码"
						dependencies={["password"]}
						hasFeedback
						rules={[
							{ required: true, message: "请确认密码！" },
							({ getFieldValue }) => ({
								validator(_, value) {
									if (!value || getFieldValue("password") === value) {
										return Promise.resolve();
									}
									return Promise.reject(new Error("两次输入的密码不一致！"));
								},
							}),
						]}
					>
						<Input.Password placeholder="请再次输入密码" />
					</Form.Item>
					<Form.Item {...tailFormItemLayout}>
						<Button type="primary" htmlType="submit" loading={loading} block>
							提交
						</Button>
					</Form.Item>
				</Form>
			</Card>
		</div>
	);
}
