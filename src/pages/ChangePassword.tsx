import React, { useMemo, useRef, useState } from "react";
import type { FormItemProps, FormProps } from "antd";
import { Button, Card, Checkbox, Form, Input, Space, Steps } from "antd";
import {
	userRegister,
	type RegisterParams,
	type RegisterResponse,
	sendEmailVerificationCode,
	checkEmailVerificationCode,
	checkEmailExisted,
} from "../api/user";
import { Link, useNavigate } from "react-router-dom";
import { useWindowSize } from "react-use";
import Confetti from "react-confetti";
import { sleep } from "../utils/common";
import { debounce } from "lodash";

/** 垂直布局：标签与输入均占满一行，避免右侧留白 */
const formItemLayout: FormProps = {
	labelCol: { span: 24 },
	wrapperCol: { span: 24 },
};

const tailFormItemLayout: FormItemProps = {
	wrapperCol: { span: 24 },
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const registerFormInitialValues = {
	// email: "aachen2012@outlook.com",
	// email: "184594923@qq.com",
	// verifyCode: "",
	// username: "",
	// password: "123456",
	// confirm: "123456",
	// agreement: true,
	email: "",
	verifyCode: "",
	username: "",
	password: "",
	confirm: "",
	agreement: true,
};

const ChangePassword: React.FC = () => {
	const [form] = Form.useForm();
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [verifyCode, setVerifyCode] = useState("");
	const [step2Loading, setStep2Loading] = useState(false);
	const { width, height } = useWindowSize();
	const [confettiVisible, setConfettiVisible] = useState(false);

	const onFinish = async (values: RegisterParams & { confirm?: string; agreement?: boolean }) => {
		try {
			setStep2Loading(true);
			const { password, username } = values;
			const res: RegisterResponse = await userRegister({ email, password, username, verifyCode });
			setConfettiVisible(true);
			await sleep(4500);
			setConfettiVisible(false);
			if (res.code === 200) {
				navigate("/landing/login");
			}
			if (res.message) {
				console.log("注册成功:", res.message);
			}
		} finally {
			setStep2Loading(false);
		}
	};

	return (
		<div className="flex justify-center items-center h-screen">
			<Card style={{ width: 500 }} title="修改密码">
				<div className="flex flex-col items-center">
					<Form
						style={{ width: "100%" }}
						{...formItemLayout}
						form={form}
						name="register"
						onFinish={onFinish}
						initialValues={registerFormInitialValues}
						scrollToFirstError
						layout="vertical"
					>
						<>
							<Form.Item
								name="current"
								label="当前密码"
								rules={[{ required: true, message: "请输入当前密码！" }]}
							>
								<Input.Password placeholder="请输入当前密码" />
							</Form.Item>
							<Form.Item
								name="password"
								label="新密码"
								rules={[
									{ required: true, message: "请输入新密码！" },
									{ min: 6, message: "密码长度不能小于6位" },
									{ max: 8, message: "密码长度不能大于8位" },
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
							></Form.Item>
							<Form.Item {...tailFormItemLayout}>
								<Button block type="primary" htmlType="submit" loading={step2Loading}>
									确定
								</Button>
							</Form.Item>
						</>
					</Form>
				</div>
			</Card>
			{confettiVisible && <Confetti width={width} height={height} />}
		</div>
	);
};

export default ChangePassword;
