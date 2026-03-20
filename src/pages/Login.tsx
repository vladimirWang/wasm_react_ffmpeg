import React, { useEffect, useRef, useState } from "react";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Button, Flex, Form, Input, message } from "antd";
import {
	getCaptcha,
	getNonce,
	getUserSaltByEmail,
	userLogin,
	type LoginParams,
	type LoginResponse,
} from "../api/user";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Box from "../components/Box";
import { clearUserCache } from "../routes";

async function sha256(str: string) {
	const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
	return Array.from(new Uint8Array(hashBuffer))
		.map(b => b.toString(16).padStart(2, "0")) // 转小写十六进制（和后端一致）
		.join("");
}

async function hashPassword(password: string, nonce: string, salt: string) {
	if (!salt || !nonce) {
		throw new Error("salt或nonce不能为空");
	}
	// 第一步：和注册逻辑一致，计算 password + "_" + salt 的哈希
	const passwordWithSalt = `${password}_${salt}`;

	const hash1 = await sha256(passwordWithSalt);

	// 第二步：拼接nonce，计算最终哈希（和后端对齐）
	const hashWithNonce = `${hash1}_${nonce}`;

	const hash2 = await sha256(hashWithNonce);

	return hash2;
}

const loginFormInitialValues = {
	email: "",
	password: "",
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
			if (!nonce) {
				message.error("nonce获取异常");
				return;
			}
			const salt = await loadUserSalt(values.email);
			console.log("salt: ", salt);
			if (!salt) {
				message.error("请确认邮箱是否正确，或重新输入邮箱");
				return;
			}
			values.captchaId = captchaId;
			values.nonce = nonce;
			values.password = await hashPassword(values.password, nonce, salt);
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
			form.resetFields(["captchaText"]);
			// 登录失败刷新验证码
			loadCaptcha();
			loadNonce();
		}
	};
	const loadCaptcha = async () => {
		const src = await getCaptcha();
		setCaptchaSrc(src.image);
		setCaptchaId(src.captchaId);
	};

	const [nonce, setNonce] = useState<string>();
	const loadNonce = async () => {
		const nonce = await getNonce();
		console.log("nonce: ", nonce);
		setNonce(nonce);
	};
	const loadUserSalt = async (email: string) => {
		if (!email) {
			message.error("请输入邮箱");
			return;
		}
		const salt = await getUserSaltByEmail(email);
		console.log("salt: ", salt);
		// setSalt(salt);
		return salt;
	};
	useEffect(() => {
		loadCaptcha();
		loadNonce();
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
					<Input prefix={<MailOutlined />} placeholder="邮箱" />
				</Form.Item>
				<Form.Item name="password" rules={[{ required: true, message: "请输入密码" }]}>
					<Input.Password prefix={<LockOutlined />} type="password" placeholder="密码" />
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
