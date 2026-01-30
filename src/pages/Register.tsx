import React, { useState } from "react";
import type { FormItemProps, FormProps } from "antd";
import {
	Button,
	Checkbox,
	Form,
	Input,
	Space,
	Steps,
} from "antd";
import { userRegister, type RegisterParams, type RegisterResponse } from "../api/user";
import { Link, useNavigate } from "react-router-dom";

const formItemLayout: FormProps = {
	labelCol: {
		xs: { span: 24 },
		sm: { span: 8 },
	},
	wrapperCol: {
		xs: { span: 24 },
		sm: { span: 16 },
	},
};

const tailFormItemLayout: FormItemProps = {
	wrapperCol: {
		xs: {
			span: 24,
			offset: 0,
		},
		sm: {
			span: 16,
			offset: 8,
		},
	},
};

const stepItems = [
	{ title: "验证邮箱", description: "填写邮箱并获取验证码" },
	{ title: "设置账号", description: "填写用户名与密码" },
];

const registerFormInitialValues = {
	email: "",
	verifyCode: "",
	username: "",
	password: "123456",
	confirm: "123456",
	agreement: true,
};

const Register: React.FC = () => {
	const [form] = Form.useForm();
	const navigate = useNavigate();
	const [currentStep, setCurrentStep] = useState(0);
	const [countdown, setCountdown] = useState(0);

	const sendVerifyCode = async () => {
		try {
			await form.validateFields(["email"]);
			const email = form.getFieldValue("email");
			// TODO: 调用发送验证码接口，例如 sendEmailVerifyCode(email)
			console.log("发送验证码到:", email);
			setCountdown(60);
			const timer = setInterval(() => {
				setCountdown((prev) => {
					if (prev <= 1) {
						clearInterval(timer);
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		} catch {
			// 校验失败由 Form 展示
		}
	};

	const onNextStep = async () => {
		try {
			await form.validateFields(["email", "verifyCode"]);
			setCurrentStep(1);
		} catch {
			// 校验失败由 Form 展示
		}
	};

	const onPrevStep = () => {
		setCurrentStep(0);
	};

	const onFinish = async (values: RegisterParams & { confirm?: string; agreement?: boolean }) => {
		try {
			const { email, password, username } = values;
			const res: RegisterResponse = await userRegister({ email, password, username });
			if (res.code === 200) {
				navigate("/landing/login");
			}
			if (res.message) {
				console.log("注册成功:", res.message);
			}
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error(error.message);
			} else {
				console.error("Unknown error: ", error);
			}
		}
	};

	return (
		<div style={{ width: 500 }}>
			<Steps
				current={currentStep}
				items={stepItems}
				style={{ marginBottom: 24 }}
			/>
			<Form
				{...formItemLayout}
				form={form}
				name="register"
				onFinish={onFinish}
				initialValues={registerFormInitialValues}
				scrollToFirstError
			>
				{currentStep === 0 && (
					<>
						<Form.Item
							name="email"
							label="邮箱"
							rules={[
								{ type: "email", message: "请输入有效的邮箱地址！" },
								{ required: true, message: "请输入邮箱！" },
							]}
						>
							<Input placeholder="请输入邮箱" />
						</Form.Item>
						<Form.Item
							name="verifyCode"
							label="验证码"
							rules={[{ required: true, message: "请输入验证码！" }]}
						>
							<Space.Compact style={{ width: "100%" }}>
								<Input placeholder="请输入验证码" />
								<Button
									type="primary"
									onClick={sendVerifyCode}
									disabled={countdown > 0}
								>
									{countdown > 0 ? `${countdown}秒后重发` : "发送验证码"}
								</Button>
							</Space.Compact>
						</Form.Item>
						<Form.Item {...tailFormItemLayout}>
							<Button type="primary" onClick={onNextStep}>
								下一步
							</Button>
						</Form.Item>
					</>
				)}
				{currentStep === 1 && (
					<>
						<Form.Item
							name="username"
							label="用户名"
							rules={[{ required: true, message: "请输入用户名！" }]}
						>
							<Input placeholder="请输入用户名" />
						</Form.Item>
						<Form.Item
							name="password"
							label="密码"
							rules={[{ required: true, message: "请输入密码！" }]}
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
						<Form.Item
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
						</Form.Item>
						<Form.Item {...tailFormItemLayout}>
							<Space>
								<Button onClick={onPrevStep}>上一步</Button>
								<Button type="primary" htmlType="submit">
									注册
								</Button>
								<Link to="/landing/login">已有账号？去登录</Link>
							</Space>
						</Form.Item>
					</>
				)}
			</Form>
		</div>
	);
};

export default Register;
