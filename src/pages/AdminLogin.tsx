import React, { useEffect, useRef, useState } from "react";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Button, Flex, Form, Input, message } from "antd";
import { adminGetUserSaltByEmail, adminUserLogin } from "../api/adminUser";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Box from "../components/Box";
import { clearUserCache } from "../routes";
import { hashPassword, sha256 } from "../utils/algo";
import Captcha, { CaptchaHandle } from "../components/Captcha";
import { getNonce } from "../api/util";
import { LoginParams } from "../api/user";

const loginFormInitialValues = {
	email: "fernandowang584@gmail.com",
	password: "123456",
	remember: true,
};

const AdminLogin: React.FC = () => {
	const [form] = Form.useForm();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const captchaRef = useRef<CaptchaHandle>(null);

	const [loading, setLoading] = useState(false);
	const [captchaId, setCaptchaId] = useState<string>();
	const onFinish = async (values: LoginParams) => {
		try {
			// 响应拦截器已经处理了 IResponse 格式，直接返回 token (string)
			if (!captchaId) {
				message.error("验证码获取异常");
				return;
			}
			setLoading(true);
			const nonce = await getNonce();
			const salt = await loadUserSalt(values.email);
			console.log("salt: ", salt);
			if (!salt) {
				setLoading(false);
				message.error("请确认邮箱是否正确，或重新输入邮箱");
				return;
			}
			values.captchaId = captchaId;
			values.nonce = nonce;
			values.password = await hashPassword(values.password, nonce, salt);
			const token = await adminUserLogin(values);
			localStorage.setItem("access_token", token);
			// 清除旧的用户缓存，让 authLoader 重新获取用户信息
			clearUserCache();

			// 获取回跳地址
			const redirect = searchParams.get("redirect");
			// 如果有回跳地址就跳转到那里，否则跳转到首页
			if (redirect) {
				navigate(decodeURIComponent(redirect), { replace: true });
			} else {
				navigate("/", { replace: true });
			}
		} catch (error: unknown) {
			captchaRef.current?.refreshCaptcha();
			// 错误提示已由响应拦截器统一处理
			// message.error(error instanceof Error ? error.message : "登录失败");
			form.resetFields(["captchaText"]);
		} finally {
			setLoading(false);
		}
	};

	const loadUserSalt = async (email: string) => {
		if (!email) {
			message.error("请输入邮箱");
			return;
		}
		const salt = await adminGetUserSaltByEmail(email);
		console.log("salt: ", salt);
		// setSalt(salt);
		return salt;
	};

	return (
		<div
			style={{
				minHeight: "100vh",
				width: "100vw",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: 40,
				padding: 0,
				flexWrap: "wrap",
				background: "white",
			}}
		>
			<h3 className="text-3xl font-bold text-orange-400">后管平台</h3>
			<Form
				form={form}
				initialValues={{ ...loginFormInitialValues }}
				style={{
					maxWidth: 360,
					width: 360,
					padding: 20,
					borderRadius: 14,
					// border: "1px solid rgba(255,255,255,0.10)",
					boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
					backdropFilter: "blur(10px)",
					WebkitBackdropFilter: "blur(10px)",
				}}
				className="bg-orange-400"
				onFinish={onFinish}
			>
				<Form.Item name="email" rules={[{ required: true, message: "请输入邮箱" }]}>
					<Input prefix={<MailOutlined />} placeholder="邮箱" />
				</Form.Item>
				<Form.Item name="password" rules={[{ required: true, message: "请输入密码" }]}>
					<Input.Password prefix={<LockOutlined />} type="password" placeholder="密码" />
				</Form.Item>
				<Form.Item name="captchaText" rules={[{ required: true, message: "请输入验证码" }]}>
					<Flex gap={10}>
						<Input placeholder="请输入验证码" />
						<Captcha
							onChange={setCaptchaId}
							pathname={location.pathname}
							pathnamesRefresh={["/admin/login"]}
							ref={captchaRef}
						/>
					</Flex>
				</Form.Item>
				<Form.Item>
					<Button block type="primary" htmlType="submit" loading={loading}>
						登录
					</Button>

					<Flex justify="space-between" align="center">
						{/* <Form.Item name="remember" valuePropName="checked" noStyle>
							<Checkbox>Remember me</Checkbox>
						</Form.Item> */}
						<Link to="/admin/forget-password">忘记密码</Link>
					</Flex>
					<Link to="/landing/login">去商户平台登录</Link>
				</Form.Item>
			</Form>
		</div>
	);
};

export default AdminLogin;
