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
import EmailVerification from "../components/EmailVerification";

/** 垂直布局：标签与输入均占满一行，避免右侧留白 */
const formItemLayout: FormProps = {
	labelCol: { span: 24 },
	wrapperCol: { span: 24 },
};

const tailFormItemLayout: FormItemProps = {
	wrapperCol: { span: 24 },
};

const stepItems = [
	{ title: "验证邮箱", description: "填写邮箱并获取验证码" },
	{ title: "设置账号", description: "填写用户名与密码" },
];

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

const ForgetPassword: React.FC = () => {
	const [form] = Form.useForm();
	const navigate = useNavigate();
	const [countdown, setCountdown] = useState(0);
	const [step1Loading, setStep1Loading] = useState(false);

	const sendVerifyCode = async () => {
		try {
			await form.validateFields(["email"]);
			const email = form.getFieldValue("email");
			await sendEmailVerificationCode(email);
			setCountdown(60);
			const timer = setInterval(() => {
				setCountdown(prev => {
					if (prev <= 1) {
						clearInterval(timer);
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		} catch (error) {
			console.log("error: ", error);
			// 校验失败由 Form 展示
		}
	};

	const onFinish = async () => {
		try {
			setStep1Loading(true);
			await form.validateFields(["email", "verifyCode"]);
			const values = form.getFieldsValue();
			const { email, verifyCode } = values;
			await checkEmailVerificationCode({ email, verifyCode });
		} finally {
			setStep1Loading(false);
			// 校验失败由 Form 展示
		}
	};

	const debounceCheckEmail = useMemo(
		() =>
			debounce(email => {
				if (!emailRegex.test(email)) return;
				checkEmailExisted(email).then(existed => {
					form.setFields([{ name: "email", errors: existed ? ["邮箱已存在"] : [] }]);
				});
			}, 500),
		[form]
	);

	const email = Form.useWatch("email", form);

	return (
		<div>
			<Card style={{ width: 500 }}>
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
						<Form.Item
							name="email"
							label="邮箱"
							rules={[
								// { type: "email", message: "请输入有效的邮箱地址！" },
								// { required: true, message: "请输入邮箱！" },
								{
									validator: async (_, value) => {
										if (value === "") {
											return Promise.reject(new Error("请输入邮箱！"));
										}
										if (!emailRegex.test(value)) {
											return Promise.reject(new Error("请输入有效的邮箱地址！"));
										}
										const existed = await checkEmailExisted(value);
										return existed ? Promise.reject(new Error("邮箱已存在")) : Promise.resolve();
									},
								},
							]}
							validateTrigger={["onBlur", "onSubmit"]}
						>
							<EmailVerification email={email} />
						</Form.Item>
						<Form.Item
							name="verifyCode"
							label="验证码"
							rules={[{ required: true, message: "请输入验证码！" }]}
						>
							<Space.Compact style={{ width: "100%" }}>
								<Input placeholder="请输入验证码" />
								<Button type="primary" onClick={sendVerifyCode} disabled={countdown > 0}>
									{countdown > 0 ? `${countdown}秒后重发` : "发送验证码"}
								</Button>
							</Space.Compact>
						</Form.Item>
						<Form.Item {...tailFormItemLayout}>
							<Button block type="primary" htmlType="submit" loading={step1Loading}>
								重置密码
							</Button>
						</Form.Item>
					</Form>
				</div>
			</Card>
		</div>
	);
};

export default ForgetPassword;
