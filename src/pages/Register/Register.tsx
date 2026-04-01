import React, { useMemo, useRef, useState } from "react";
import type { FormItemProps, FormProps } from "antd";
import { Button, Card, Checkbox, Form, Input, Space, Steps } from "antd";
import {
	userRegister,
	type RegisterParams,
	type RegisterResponse,
	checkEmailNotExisted,
	ParamEmail,
	getInviteCode,
} from "../../api/user";
import { Link, useNavigate } from "react-router-dom";
import { useWindowSize } from "react-use";
import Confetti from "react-confetti";
import { sleep } from "../../utils/common";
import { debounce } from "lodash";
import { checkEmailVerificationCode, sendEmailVerificationCode } from "../../api/util";
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
	const [form] = Form.useForm();
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [verifyCode, setVerifyCode] = useState("");
	const [currentStep, setCurrentStep] = useState(0);
	const [step1Loading, setStep1Loading] = useState(false);
	const [step2Loading, setStep2Loading] = useState(false);
	const { width, height } = useWindowSize();
	const [confettiVisible, setConfettiVisible] = useState(false);

	const onPrevStep = () => {
		setCurrentStep(0);
	};

	const [step0Loading, setStep0Loading] = useState(false);
	const [verifyValues, setVerifyValues] = useState({ email: "", verifyCode: "" });

	return (
		<div>
			<Card style={{ width: 500 }}>
				<div className="flex flex-col items-center">
					<Steps current={currentStep} items={stepItems} style={{ marginBottom: 24 }} />
					{currentStep === 0 && <GetInviteCode onNextStep={() => setCurrentStep(1)} />}
					{currentStep === 1 && (
						<VerifyEmail onNextStep={() => setCurrentStep(2)} onGetVerifyValues={setVerifyValues} />
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
