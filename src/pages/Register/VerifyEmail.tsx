import { debounce } from "lodash";
import React, { useMemo, useState } from "react";
import { Button, Form, Input, Space } from "antd";
import { emailRegex, tailFormItemLayout } from "./Register";
import { checkEmailNotExisted } from "../../api/user";
import { checkEmailVerificationCode, sendEmailVerificationCode } from "../../api/util";

export interface RegisterCommonProps {
	onNextStep?: () => void;
	onPrevStep?: () => void;
}

interface VerifyEmailProps extends RegisterCommonProps {
	onGetVerifyValues: (values: { email: string; verifyCode: string }) => void;
}

const initialValues = {
	email: "aachen2012@outlook.com",
	verifyCode: "123123",
};
export default function VerifyEmail(props: VerifyEmailProps) {
	const { onNextStep, onGetVerifyValues } = props;
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);

	const [countdown, setCountdown] = useState(0);
	const debounceCheckEmail = useMemo(
		() =>
			debounce(email => {
				if (!emailRegex.test(email)) return;
				checkEmailNotExisted(email).then(existed => {
					form.setFields([{ name: "email", errors: !existed ? ["邮箱已存在"] : [] }]);
				});
			}, 500),
		[form]
	);

	const onFinish = async () => {
		try {
			setLoading(true);
			await form.validateFields(["email", "verifyCode"]);
			const values = form.getFieldsValue();
			const { email, verifyCode } = values;
			await checkEmailVerificationCode({ email, verifyCode });
			// setCurrentStep(1);
			onGetVerifyValues(values);
			// setEmail(email);
			// setVerifyCode(verifyCode);
			onNextStep?.();
		} finally {
			setLoading(false);
			// 校验失败由 Form 展示
		}
	};

	const sendVerifyCode = async () => {
		try {
			await form.validateFields(["email"]);
			const email = form.getFieldValue("email");
			await sendEmailVerificationCode(email);
			setCountdown(60);
			const timer = setInterval(() => {
				setCountdown(prev => {
					if (prev <= 1) {
						clearInterval(timer);
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		} catch (error) {
			console.log("error: ", error);
			// 校验失败由 Form 展示
		}
	};

	return (
		<Form form={form} onFinish={onFinish} initialValues={initialValues}>
			<Form.Item
				name="email"
				label="邮箱"
				rules={[
					// { type: "email", message: "请输入有效的邮箱地址！" },
					// { required: true, message: "请输入邮箱！" },
					{
						validator: async (_, value) => {
							if (value === "") {
								return Promise.reject(new Error("请输入邮箱！"));
							}
							if (!emailRegex.test(value)) {
								return Promise.reject(new Error("请输入有效的邮箱地址！"));
							}
							const existed = await checkEmailNotExisted(value);
							return !existed ? Promise.reject(new Error("邮箱已存在")) : Promise.resolve();
						},
					},
				]}
				validateTrigger={["onBlur", "onSubmit"]}
			>
				<Input placeholder="请输入邮箱" onChange={e => debounceCheckEmail(e.target.value)} />
			</Form.Item>
			<Form.Item
				name="verifyCode"
				label="邮箱验证码"
				rules={[{ required: true, message: "请输入验证码！" }]}
			>
				<Space.Compact style={{ width: "100%" }}>
					<Input placeholder="请输入验证码" />
					<Button type="primary" onClick={sendVerifyCode} disabled={countdown > 0}>
						{countdown > 0 ? `${countdown}秒后重发` : "发送验证码"}
					</Button>
				</Space.Compact>
			</Form.Item>
			<Form.Item {...tailFormItemLayout}>
				<Button block type="primary" htmlType="submit" loading={loading}>
					下一步
				</Button>
			</Form.Item>
		</Form>
	);
}
