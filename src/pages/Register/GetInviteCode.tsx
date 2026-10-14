import { useState } from "react";
import { Button, Form, Input, Radio, Result } from "antd";
import { checkEmailExisted } from "../../api/user";
import { emailRegex } from "./Register";
import { checkApplicantExisted, sendInviteCode } from "../../api/applicant";
import { useNavigate } from "react-router-dom";

const initialValues = {
	email: "",
	tenantOption: "join" as "join" | "create",
};

export default function GetInviteCode() {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [form] = Form.useForm();
	const [tenantOption, setTenantOption] = useState<"join" | "create">("join");

	const onGetInviteCode = async (values: {
		email: string;
		tenantOption: "join" | "create";
		tenantCode?: string;
		tenantName?: string;
	}) => {
		try {
			setLoading(true);
			await sendInviteCode({
				email: values.email,
				tenantCode: values.tenantOption === "join" ? values.tenantCode : undefined,
				tenantName: values.tenantOption === "create" ? values.tenantName : undefined,
			});
			setSubmitted(true);
		} finally {
			setLoading(false);
		}
	};

	if (submitted) {
		return (
			<Result
				status="success"
				title="申请已提交"
				subTitle="请等待管理员审核，审核通过后即可通过 SSO 统一登录。"
				extra={[
					<Button type="primary" key="login" onClick={() => navigate("/landing/login")}>
						前往登录
					</Button>,
				]}
			/>
		);
	}

	return (
		<Form
			form={form}
			onFinish={onGetInviteCode}
			className="w-full"
			initialValues={initialValues}
			layout="vertical"
		>
			<Form.Item
				name="email"
				label="邮箱"
				validateTrigger={["onBlur", "onSubmit"]}
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
							if (existed) return Promise.reject(new Error("邮箱已被注册"));
							const applicantExisted = await checkApplicantExisted(value);
							if (applicantExisted) {
								return Promise.reject(new Error("该邮箱已提交系统权限申请"));
							}
							return Promise.resolve();
						},
					},
				]}
			>
				<Input placeholder="请输入邮箱（需与 SSO 注册邮箱一致）" />
			</Form.Item>
			<Form.Item name="tenantOption" label="租户选择">
				<Radio.Group
					onChange={e => setTenantOption(e.target.value)}
					className="w-full"
				>
					<Radio value="join" className="block mb-2">
						加入已有租户（由租户管理员审核）
					</Radio>
					<Radio value="create">
						新建租户（由系统管理员审核）
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
					<Input placeholder="请输入新建租户的名称" />
				</Form.Item>
			)}
			<Form.Item>
				<Button type="primary" block htmlType="submit" loading={loading}>
					提交申请
				</Button>
			</Form.Item>
		</Form>
	);
}
