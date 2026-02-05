import React, { useEffect, useRef, useState } from "react";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Button, Flex, Form, Input, message } from "antd";
import { getCaptcha, userLogin, type LoginParams, type LoginResponse } from "../api/user";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Box from "../components/Box";
import { clearUserCache } from "../routes";

const loginFormInitialValues = {
	email: "aachen2012@outlook.com",
	password: "123456",
	remember: true,
};

const Login: React.FC = () => {
	const [form] = Form.useForm();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const [captchaSrc, setCaptchaSrc] = useState<string>();
	const [captchaId, setCaptchaId] = useState<string>();

	const onFinish = async (values: LoginParams) => {
		try {
			// 响应拦截器已经处理了 IResponse 格式，直接返回 token (string)
			if (!captchaId) {
				message.error("验证码获取异常");
				return;
			}
			values.captchaId = captchaId;
			const token = await userLogin(values);
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
			// 错误提示已由响应拦截器统一处理
			if (error instanceof Error) {
				console.error(error.message);
			} else {
				console.error("Unknown error: ", error);
			}
			// 登录失败刷新验证码
			loadCaptcha();
		}
	};
	const loadCaptcha = async () => {
		const src = await getCaptcha();
		setCaptchaSrc(src.image);
		setCaptchaId(src.captchaId);
	};
	useEffect(() => {
		loadCaptcha();
	}, []);

	return (
		<div
			style={{
				minHeight: "100vh",
				width: "100vw",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				gap: 40,
				padding: 0,
				flexWrap: "wrap",
				background:
					"radial-gradient(1200px 600px at 20% 20%, rgba(99, 102, 241, 0.35), transparent 60%), radial-gradient(900px 500px at 80% 70%, rgba(236, 72, 153, 0.28), transparent 55%), linear-gradient(180deg, #0b1020, #070a14)",
			}}
		>
			<div
				style={{
					width: 420,
					height: 420,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					// 轻微光晕，让立方体更融入背景（canvas 仍然透明）
					filter: "drop-shadow(0 24px 60px rgba(0,0,0,0.45))",
				}}
			>
				<Box width={420} height={420} />
			</div>

			<Form
				form={form}
				initialValues={{ ...loginFormInitialValues }}
				style={{
					maxWidth: 360,
					width: 360,
					padding: 20,
					borderRadius: 14,
					border: "1px solid rgba(255,255,255,0.10)",
					background: "rgba(255,102,0,0.6)",
					boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
					backdropFilter: "blur(10px)",
					WebkitBackdropFilter: "blur(10px)",
				}}
				onFinish={onFinish}
			>
				<Form.Item name="email" rules={[{ required: true, message: "请输入邮箱" }]}>
					<Input prefix={<MailOutlined />} placeholder="email" />
				</Form.Item>
				<Form.Item name="password" rules={[{ required: true, message: "请输入密码" }]}>
					<Input.Password prefix={<LockOutlined />} type="password" placeholder="Password" />
				</Form.Item>
				<Form.Item name="captchaText" rules={[{ required: true, message: "请输入验证码" }]}>
					<Flex gap={10}>
						<Input placeholder="请输入验证码" />
						<img
							src={captchaSrc}
							width={100}
							height={40}
							alt="验证码"
							onClick={loadCaptcha}
							style={{ background: "white" }}
						/>
					</Flex>
				</Form.Item>
				<Form.Item>
					<Button block type="primary" htmlType="submit">
						登录
					</Button>

					<Flex justify="space-between" align="center">
						{/* <Form.Item name="remember" valuePropName="checked" noStyle>
							<Checkbox>Remember me</Checkbox>
						</Form.Item> */}
						<a href="">忘记密码</a>
						<Link to="/landing/register">去注册!</Link>
					</Flex>
				</Form.Item>
			</Form>
		</div>
	);
};

export default Login;
