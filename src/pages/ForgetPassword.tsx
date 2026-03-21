import React, { useState } from "react";
import type { FormItemProps, FormProps } from "antd";
import { Button, Card, Form } from "antd";
import { checkEmailExisted, resetPassword } from "../api/user";
import EmailVerification from "../components/EmailVerification";

/** 垂直布局：标签与输入均占满一行，避免右侧留白 */
const formItemLayout: FormProps = {
	labelCol: { span: 24 },
	wrapperCol: { span: 24 },
};

const tailFormItemLayout: FormItemProps = {
	wrapperCol: { span: 24 },
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const resetPwdFormInitialValues = {
	email: "",
	emailVerified: false,
};

const ForgetPassword: React.FC = () => {
	const [form] = Form.useForm();
	const [step1Loading, setStep1Loading] = useState(false);

	const onFinish = async () => {
		try {
			setStep1Loading(true);
			// email + emailVerified（由 EmailVerification 写入）一并校验
			await form.validateFields(["email", "emailVerified"]);
			const values = form.getFieldsValue();
			await resetPassword(values);
			// await resetPassword({ email: form.getFieldValue("email") });
		} finally {
			setStep1Loading(false);
			// 校验失败由 Form 展示
		}
	};

	const emailVerifiedValue = Form.useWatch("emailVerified", form);

	return (
		<div className="w-full h-full flex align-center justify-center">
			<Card style={{ width: 500 }} title="重置密码">
				<Form
					style={{ width: "100%" }}
					{...formItemLayout}
					form={form}
					name="register"
					onFinish={onFinish}
					initialValues={resetPwdFormInitialValues}
					scrollToFirstError
					layout="vertical"
				>
					{/* 与 EmailVerification 同步：未在弹窗内验证通过则为 false */}
					<Form.Item
						name="emailVerified"
						initialValue={false}
						// rules={[
						// 	{
						// 		validator: (_, v) => {
						// 			console.log("emailVerified: ", v);
						// 			return v === true
						// 				? Promise.resolve()
						// 				: Promise.reject(new Error("请先完成邮箱验证"));
						// 		},
						// 	},
						// ]}
					/>
					<Form.Item
						name="email"
						label="邮箱"
						rules={[
							{
								validator: async (_, value) => {
									if (value === "") {
										return Promise.reject(new Error("请输入邮箱！"));
									}
									if (!emailRegex.test(value)) {
										return Promise.reject(new Error("请输入有效的邮箱地址！"));
									}
									const existed = await checkEmailExisted(value);
									console.log("email existed: ", existed);
									if (!existed) return Promise.reject(new Error("该邮箱未注册"));
									return emailVerifiedValue
										? Promise.resolve()
										: Promise.reject(new Error("请先完成邮箱验证"));
								},
							},
						]}
						validateTrigger={["onBlur", "onSubmit"]}
					>
						<EmailVerification form={form} verifiedFieldName="emailVerified" />
					</Form.Item>
					<Form.Item {...tailFormItemLayout}>
						<Button block type="primary" htmlType="submit" loading={step1Loading}>
							重置密码
						</Button>
					</Form.Item>
				</Form>
			</Card>
		</div>
	);
};

export default ForgetPassword;
