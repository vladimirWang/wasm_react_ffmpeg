import React, { useState } from "react";
import { Button, Card, Form, FormItemProps, Input, Radio, Steps } from "antd";
import { useNavigate } from "react-router-dom";
import { userRegisterByToken } from "../../api/user";
import { sleep } from "../../utils/common";
import { formItemLayout } from "../Register/Register";
import { passwordRegex } from "../../regexp";

const registerFormInitialValues = {
	agreement: true,
	tenantOption: "join",
};

interface RegisterFormProps {
	token: string;
}

export const tailFormItemLayout: FormItemProps = {
	wrapperCol: { span: 24 },
};

const stepItems = [
	{ title: "选择租户", description: "选择加入或创建租户" },
	{ title: "设置账号", description: "填写用户名与密码" },
];

export type TenantOption = "join" | "create";

export default function RegisterForm(props: RegisterFormProps) {
	const navigate = useNavigate();
	const { token } = props;
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [tenantOption, setTenantOption] = useState<TenantOption>("join");

	const onNextStep = async () => {
		try {
			await form.validateFields(["tenantOption"]);
			if (tenantOption === "create") {
				await form.validateFields(["tenantName"]);
			} else {
				await form.validateFields(["tenantCode"]);
			}
			setCurrentStep(1);
		} catch (error) {
			// 校验失败由 Form 展示
		}
	};

	const onPrevStep = () => {
		setCurrentStep(0);
	};

	const onFinish = async (values: {
		username: string;
		password: string;
		confirm: string;
		tenantOption: TenantOption;
		tenantName?: string;
		tenantCode?: string;
	}) => {
		try {
			setLoading(true);
			const { password, username, tenantOption: option, tenantName, tenantCode } = values;
			await userRegisterByToken({
				token,
				password,
				username,
				tenantOption: option,
				tenantName: option === "create" ? tenantName : undefined,
				tenantCode: option === "join" ? tenantCode : undefined,
			});
			await sleep(4500);
			navigate("/landing/login");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex justify-center items-center h-screen w-screen">
			<Card style={{ width: 440 }}>
				<Steps current={currentStep} items={stepItems} style={{ marginBottom: 24 }} />
				<Form
					style={{ width: "100%" }}
					{...formItemLayout}
					form={form}
					name="activate-register"
					onFinish={onFinish}
					initialValues={registerFormInitialValues}
					scrollToFirstError
					layout="vertical"
				>
					{/* 两步字段始终保持挂载，用 display 切换，避免卸载导致 onFinish 丢失第一步租户字段 */}
					<div style={{ display: currentStep === 0 ? "block" : "none" }}>
						<Form.Item
							name="tenantOption"
							label="租户选择"
							rules={[{ required: true, message: "请选择租户类型！" }]}
						>
							<Radio.Group
								onChange={e => setTenantOption(e.target.value)}
								className="w-full"
							>
								<Radio value="join" className="block mb-3">
									<div className="font-medium">申请加入租户</div>
									<div className="text-gray-500 text-sm">
										加入已有的租户组织，由管理员审核通过后使用
									</div>
								</Radio>
								<Radio value="create" className="block">
									<div className="font-medium">自建租户</div>
									<div className="text-gray-500 text-sm">
										创建一个新的租户组织，您将成为该租户的管理员
									</div>
								</Radio>
							</Radio.Group>
						</Form.Item>
						{tenantOption === "join" && (
							<Form.Item
								name="tenantCode"
								label="租户编码"
								rules={[{ required: true, message: "请输入租户编码！" }]}
							>
								<Input placeholder="请输入要加入的租户编码" />
							</Form.Item>
						)}
						{tenantOption === "create" && (
							<Form.Item
								name="tenantName"
								label="租户名称"
								rules={[{ required: true, message: "请输入租户名称！" }]}
							>
								<Input placeholder="请输入租户名称" />
							</Form.Item>
						)}
						<Form.Item {...tailFormItemLayout}>
							<Button block type="primary" onClick={onNextStep}>
								下一步
							</Button>
						</Form.Item>
					</div>
					<div style={{ display: currentStep === 1 ? "block" : "none" }}>
						<Form.Item
							name="username"
							label="用户名"
							rules={[
								{ required: true, message: "请输入用户名！" },
								{ max: 8, message: "用户名长度不能大于8位" },
							]}
						>
							<Input placeholder="请输入用户名" />
						</Form.Item>
						<Form.Item
							name="password"
							label="密码"
							rules={[
								{ required: true, message: "请输入密码！" },
								{
									pattern: passwordRegex,
									message: "密码长度为6-8位，只能包含数字、字母、特殊字符",
								},
							]}
							hasFeedback
						>
							<Input.Password placeholder="请输入密码" />
						</Form.Item>
						<Form.Item
							name="confirm"
							label="确认密码"
							dependencies={["password"]}
							hasFeedback
							rules={[
								{ required: true, message: "请确认密码！" },
								({ getFieldValue }) => ({
									validator(_, value) {
										if (!value || getFieldValue("password") === value) {
											return Promise.resolve();
										}
										return Promise.reject(new Error("两次输入的密码不一致！"));
									},
								}),
							]}
						>
							<Input.Password placeholder="请再次输入密码" />
						</Form.Item>
						<Form.Item {...tailFormItemLayout}>
							<div className="flex justify-center items-center gap-4">
								<Button onClick={onPrevStep}>上一步</Button>
								<Button type="primary" htmlType="submit" loading={loading}>
									提交
								</Button>
							</div>
						</Form.Item>
					</div>
				</Form>
			</Card>
		</div>
	);
}
