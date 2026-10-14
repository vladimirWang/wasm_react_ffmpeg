import React from "react";
import { Card, Steps } from "antd";
import { Link } from "react-router-dom";
import GetInviteCode from "./GetInviteCode";

/** 垂直布局：标签与输入均占满一行，避免右侧留白 */
export const formItemLayout = {
	labelCol: { span: 24 },
	wrapperCol: { span: 24 },
};

export const tailFormItemLayout = {
	wrapperCol: { span: 24 },
};

const stepItems = [{ title: "提交申请", description: "填写邮箱与租户信息" }];

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const passwordRegex = /^[0-9a-zA-Z!@#$%^&*()_+\-=\[\]{}|;:,.<>?~]{6,8}$/;

const Register: React.FC = () => {
	return (
		<div className="flex justify-center items-center min-h-screen">
			<Card style={{ width: 500 }}>
				<div className="flex flex-col items-center">
					<Steps current={0} items={stepItems} style={{ marginBottom: 24 }} />
					<GetInviteCode />
					<Link to="/landing/login" className="mt-4">
						已有账号？去登录
					</Link>
				</div>
			</Card>
		</div>
	);
};

export default Register;
