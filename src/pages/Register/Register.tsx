import React, { useMemo, useRef, useState } from "react";
import type { FormItemProps, FormProps } from "antd";
import { Button, Card, Checkbox, Form, Input, Space, Steps } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useWindowSize } from "react-use";
import Confetti from "react-confetti";
import GetInviteCode from "./GetInviteCode";
import VerifyEmail from "./VerifyEmail";
import Submit from "./Submit";

/** 垂直布局：标签与输入均占满一行，避免右侧留白 */
export const formItemLayout: FormProps = {
	labelCol: { span: 24 },
	wrapperCol: { span: 24 },
};

export const tailFormItemLayout: FormItemProps = {
	wrapperCol: { span: 24 },
};

const stepItems = [
	{ title: "获取邀请码", description: "获取邀请码" },
	{ title: "验证邮箱", description: "验证邮箱" },
	{ title: "设置账号", description: "填写用户名与密码" },
];

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const passwordRegex = /^[0-9a-zA-Z!@#$%^&*()_+\-=\[\]{}|;:,.<>?~]{6,8}$/;

const Register: React.FC = () => {
	const [currentStep, setCurrentStep] = useState(0);
	const { width, height } = useWindowSize();
	const [confettiVisible, setConfettiVisible] = useState(false);

	const [verifyValues, setVerifyValues] = useState({ email: "", verifyCode: "" });

	return (
		<div>
			<Card style={{ width: 500 }}>
				<div className="flex flex-col items-center">
					<Steps current={currentStep} items={stepItems} style={{ marginBottom: 24 }} />
					{currentStep === 0 && <GetInviteCode onNextStep={() => setCurrentStep(1)} />}
					{currentStep === 1 && (
						<VerifyEmail
							onNextStep={() => setCurrentStep(2)}
							onPrevStep={() => setCurrentStep(0)}
							onGetVerifyValues={setVerifyValues}
						/>
					)}
					{currentStep === 2 && (
						<Submit
							onPrevStep={() => setCurrentStep(1)}
							email={verifyValues.email}
							verifyCode={verifyValues.verifyCode}
						/>
					)}
					<Link to="/landing/login">已有账号？去登录</Link>
				</div>
			</Card>
			{confettiVisible && <Confetti width={width} height={height} />}
		</div>
	);
};

export default Register;
