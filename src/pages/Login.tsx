import React from "react";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Button, Flex, Form, Input } from "antd";
import {
	userLogin,
	type LoginParams,
	type LoginResponse,
} from "../api/user";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Box from "../components/Box";
import { clearUserCache } from "../routes";

const loginFormInitialValues = {
	email: "123456@qq.com",
	password: "123456",
	remember: true,
};

const Login: React.FC = () => {
	const [form] = Form.useForm();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const onFinish = async (values: LoginParams) => {
		try {
			const res: LoginResponse = await userLogin(values);
			console.log("res: ", res);
			// 现在 res 有正确的类型提示
			if (res.code === 200) {
				console.log("token: ", res.data, typeof res.data);
				localStorage.setItem("access_token", res.data);
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

				// const currentUserResponse = await getCurrentUser();
				// const currentUser: IUser = currentUserResponse.data;
				// console.log("currentUser: ", currentUser);
			} else {
				alert(res.message);
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
					background: "rgba(255,255,255,0.06)",
					boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
					backdropFilter: "blur(10px)",
					WebkitBackdropFilter: "blur(10px)",
				}}
				onFinish={onFinish}
			>
				<Form.Item name="email" rules={[{ required: true, message: "Please input your email!" }]}>
					<Input prefix={<MailOutlined />} placeholder="email" />
				</Form.Item>
				<Form.Item
					name="password"
					rules={[{ required: true, message: "Please input your Password!" }]}
				>
					<Input prefix={<LockOutlined />} type="password" placeholder="Password" />
				</Form.Item>
				<Form.Item>
					<Flex justify="space-between" align="center">
						{/* <Form.Item name="remember" valuePropName="checked" noStyle>
							<Checkbox>Remember me</Checkbox>
						</Form.Item> */}
						<a href="">忘记密码</a>
					</Flex>
				</Form.Item>

				<Form.Item>
					<Button block type="primary" htmlType="submit">
						登录
					</Button>
					<Link to="/landing/register">去注册!</Link>
				</Form.Item>
			</Form>
		</div>
	);
};

export default Login;
