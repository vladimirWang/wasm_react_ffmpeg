import React, { useState } from "react";
import { Button, Checkbox, Form, FormItemProps, Input } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { RegisterParams, RegisterResponse, userRegister, userRegisterByToken } from "../../api/user";
import { sleep } from "../../utils/common";
import { formItemLayout } from "../Register/Register";
import { passwordRegex } from "../../regexp";

const registerFormInitialValues = {
	// email: "aachen2012@outlook.com",
	// email: "184594923@qq.com",
	// verifyCode: "",
	// username: "",
	// password: "123456",
	// confirm: "123456",
	// agreement: true,
	username: "mike",
	password: "123456",
	confirm: "123456",
	agreement: true,
};

interface RegisterForm {
	token: string;
}

export const tailFormItemLayout: FormItemProps = {
	wrapperCol: { span: 24 },
};

export default function RegisterForm(props: RegisterForm) {
	const navigate = useNavigate();
	// const { email, verifyCode } = props;
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const onFinish = async (values: RegisterParams & { confirm?: string; agreement?: boolean }) => {
		try {
			setLoading(true);
			const { password, username } = values;
			await userRegisterByToken({ token: props.token, password, username });
			// setConfettiVisible(true);
			await sleep(4500);
			// setConfettiVisible(false);
			navigate("/landing/login");
		} finally {
			setLoading(false);
		}
	};
	return (
		<div className="flex justify-center items-center h-screen w-screen">
			<Form
				style={{ width: "400px" }}
				{...formItemLayout}
				form={form}
				name="register"
				onFinish={onFinish}
				initialValues={registerFormInitialValues}
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
				{/* <Form.Item
				name="agreement"
				valuePropName="checked"
				rules={[
					{
						validator: (_, value) =>
							value ? Promise.resolve() : Promise.reject(new Error("请阅读并同意协议")),
					},
				]}
				{...tailFormItemLayout}
			>
				<Checkbox>
					我已阅读 <a href="">用户协议</a>
				</Checkbox>
			</Form.Item> */}
				<Form.Item {...tailFormItemLayout}>
					<Button block type="primary" htmlType="submit" loading={loading}>
						提交
					</Button>
				</Form.Item>
			</Form>
		</div>
	);
}
