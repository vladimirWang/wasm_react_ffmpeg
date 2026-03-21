import React, { useEffect, useMemo, useRef, useState } from "react";
import type { FormItemProps, FormProps } from "antd";
import { Button, Card, Checkbox, Form, Input, message, Space, Steps } from "antd";
import {
	userRegister,
	type RegisterParams,
	type RegisterResponse,
	sendEmailVerificationCode,
	checkEmailVerificationCode,
	checkEmailExisted,
	updatePassword,
	type IUpdatePasswordParams,
	getNonce,
	getUserSaltByEmail,
} from "../api/user";
import { Link, useNavigate } from "react-router-dom";
import { useWindowSize } from "react-use";
import Confetti from "react-confetti";
import { sleep } from "../utils/common";
import { debounce } from "lodash";
import { useUserStore } from "../store/userStore";
import { useLoadNonceAndSalt } from "../hooks/useLoadNonceAndSalt";
import { hashPassword } from "../utils/algo";

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
	const [loading, setLoading] = useState(false);

	const { nonce, userSalt, loadNonce } = useLoadNonceAndSalt();

	const onFinish = async (values: IUpdatePasswordParams) => {
		if (!nonce) {
			message.error("nonce获取异常");
			return;
		}
		if (!userSalt) {
			message.error("用户盐获取异常");
			return;
		}
		try {
			setLoading(true);
			values.nonce = nonce;
			values.current = await hashPassword(values.current, nonce, userSalt);
			// values.password = await hashPassword(values.password, nonce, userSalt);
			await updatePassword(values);
			await sleep(500);
			navigate("/landing/login");
		} catch {
			loadNonce();
		} finally {
			setLoading(false);
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
							<Form.Item {...tailFormItemLayout}>
								<Button block type="primary" htmlType="submit" loading={loading}>
									确定
								</Button>
							</Form.Item>
						</>
					</Form>
				</div>
			</Card>
		</div>
	);
};

export default ChangePassword;
