import React, { useRef, useState } from "react";
import { GithubOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { Button, Divider, Flex, Form, Input, message } from "antd";
import {
	buildGithubOAuthStartUrl,
	getUserSaltByEmail,
	userLogin,
	type LoginParams,
} from "../api/user";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { clearUserCache } from "../routes";
import { hashPassword } from "../utils/algo";
import Captcha, { CaptchaHandle } from "../components/Captcha";
import { getNonce } from "../api/util";

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
			if (!captchaId) {
				message.error("验证码获取异常");
				return;
			}
			setLoading(true);
			const nonce = await getNonce();
			const salt = await loadUserSalt(values.email);
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
			clearUserCache();

			const redirect = searchParams.get("redirect");
			if (redirect) {
				navigate(decodeURIComponent(redirect), { replace: true });
			} else {
				navigate("/", { replace: true });
			}
		} catch (error: unknown) {
			captchaRef.current?.refreshCaptcha();
			form.resetFields(["captchaText"]);
		} finally {
			setLoading(false);
		}
	};

	const startGithubLogin = () => {
		const redirectParam = searchParams.get("redirect");
		const path = redirectParam != null && redirectParam !== "" ? redirectParam : undefined;
		window.location.href = buildGithubOAuthStartUrl(path);
	};

	const loadUserSalt = async (email: string) => {
		if (!email) {
			message.error("请输入邮箱");
			return;
		}
		const salt = await getUserSaltByEmail(email);
		return salt;
	};

	return (
		<div className="flex items-stretch rounded-xl overflow-hidden bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)] min-h-[480px] w-[min(92vw,860px)] max-md:max-w-[420px]">
			{/* 品牌面板 - 移动端隐藏 */}
			<div
				className="hidden md:flex w-[280px] shrink-0 bg-primary text-white flex-col justify-center items-center gap-5 px-8 py-10 text-center"
				aria-hidden="true"
			>
				<div className="w-16 h-16 rounded-[14px] bg-white/18 flex items-center justify-center text-[28px] font-bold tracking-[0.05em]">
					R
				</div>
				<div>
					<div className="text-[22px] font-semibold leading-[1.3]">仓库管理系统</div>
					<div className="text-[13px] leading-[1.6] opacity-[0.82]">
						RepoCMS · 简洁高效的库存管理平台
					</div>
				</div>
			</div>

			{/* 表单区 */}
			<div className="flex-1 flex flex-col justify-center px-7 pt-9 pb-6 md:px-11 md:pt-12 md:pb-9">
				<div className="mb-7">
					<h2 className="mb-1.5 text-[22px] font-semibold text-[rgba(0,0,0,0.85)]">账号登录</h2>
					<p className="text-[13px] text-[rgba(0,0,0,0.45)]">欢迎回来，请输入您的账号信息</p>
				</div>

				<Form
					form={form}
					initialValues={{ ...loginFormInitialValues }}
					onFinish={onFinish}
					layout="vertical"
				>
					<Form.Item label="邮箱" name="email" rules={[{ required: true, message: "请输入邮箱" }]}>
						<Input prefix={<MailOutlined />} placeholder="请输入邮箱" size="large" />
					</Form.Item>
					<Form.Item
						label="密码"
						name="password"
						rules={[{ required: true, message: "请输入密码" }]}
					>
						<Input.Password
							prefix={<LockOutlined />}
							type="password"
							placeholder="请输入密码"
							size="large"
						/>
					</Form.Item>
					<Form.Item
						label="验证码"
						name="captchaText"
						rules={[{ required: true, message: "请输入验证码" }]}
					>
						<Flex gap={10}>
							<Input placeholder="请输入验证码" size="large" />
							<Captcha
								onChange={setCaptchaId}
								pathname={location.pathname}
								pathnamesRefresh={["/landing/login"]}
								ref={captchaRef}
							/>
						</Flex>
					</Form.Item>

					<Form.Item className="mb-3!">
						<Button block type="primary" htmlType="submit" loading={loading} size="large">
							登录
						</Button>
					</Form.Item>

					<Flex justify="space-between" align="center" className="text-[13px]">
						<Link to="/forget-password">忘记密码</Link>
						<Link to="/landing/register">去注册</Link>
					</Flex>
					{/* <Flex justify="flex-start" className="mt-2 text-[13px]">
						<Link to="/admin/login">去后管平台</Link>
					</Flex> */}
				</Form>
			</div>
		</div>
	);
};

export default Login;
