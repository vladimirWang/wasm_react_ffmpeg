import React, { useRef, useState } from "react";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Button, Flex, Form, Input, message } from "antd";
import { getUserSaltByEmail, userLogin, type LoginParams } from "../api/user";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { clearUserCache } from "../routes";
import { hashPassword } from "../utils/algo";
import Captcha, { CaptchaHandle } from "../components/Captcha";
import { getNonce } from "../api/util";
import cartoonPng from "../assets/cartoon.png";

const loginFormInitialValues = {
	email: "",
	password: "",
	remember: true,
};

const Login: React.FC = () => {
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
		const salt = await getUserSaltByEmail(email);
		console.log("salt: ", salt);
		// setSalt(salt);
		return salt;
	};

	return (
		<div className="loginPage">
			<style>{`
				.loginPage{
					min-height:100vh;
					width:100vw;
					display:flex;
					align-items:center;
					justify-content:center;
					gap:clamp(16px, 4vw, 44px);
					padding:clamp(16px, 3.5vw, 48px);
					flex-wrap:wrap;
					background: #eee;
				}
				.loginVisual{
					width:400px;
					display:flex;
					align-items:center;
					justify-content:center;
					filter: drop-shadow(0 24px 60px rgba(0,0,0,0.45));
					user-select:none;
				}
				.loginVisual img{
					width:100%;
					height:auto;
					max-height:min(420px, 48vh);
					object-fit:contain;
				}
				.loginForm{
					width:min(360px, 92vw);
					max-width:360px;
					padding:20px;
					border-radius:14px;
					border:1px solid rgba(0,0,0,0.08);
					background: #fff;
					box-shadow: 0 20px 60px rgba(0,0,0,0.14);
				}
				@media (max-width: 768px){
					.loginVisual{ display:none; }
					.loginForm{ padding:16px; }
				}
			`}</style>

			<div className="loginVisual" aria-hidden="true">
				<img src={cartoonPng} alt="" loading="eager" decoding="async" />
			</div>

			<Form
				form={form}
				initialValues={{ ...loginFormInitialValues }}
				className="loginForm"
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
							pathnamesRefresh={["/landing/login"]}
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
						<Link to="/forget-password">忘记密码</Link>
						<Link to="/landing/register">去注册!</Link>
					</Flex>
					<Link to="/admin/login">去后管平台</Link>
				</Form.Item>
			</Form>
		</div>
	);
};

export default Login;
