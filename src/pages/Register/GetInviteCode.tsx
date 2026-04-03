import { Button, Form, Input } from "antd";
import React, { useMemo, useState } from "react";
import { checkEmailExisted, ParamEmail } from "../../api/user";
import { RegisterCommonProps } from "./VerifyEmail";
import { emailRegex } from "./Register";
import { checkApplicantExisted, sendInviteCode } from "../../api/applicant";
import { debounce } from "lodash";

const initialValues = {
	email: "",
};

export default function GetInviteCode(props: RegisterCommonProps) {
	const { onNextStep } = props;
	const [loading, setLoading] = useState(false);
	const [form] = Form.useForm();
	const onGetInviteCode = async (values: ParamEmail) => {
		try {
			setLoading(true);
			await sendInviteCode(values);
		} finally {
			setLoading(false);
		}
	};

	const debounceCheckEmail = useMemo(() => {
		return debounce(async (email: string) => {
			if (email === "") return Promise.reject(new Error("请输入邮箱！"));
			if (!emailRegex.test(email)) return Promise.reject(new Error("请输入有效邮箱地址！"));
			const existed = await checkEmailExisted(email);
			if (existed) return Promise.reject(new Error("邮箱已被注册"));
			const applicantExisted = await checkApplicantExisted(email);
			if (applicantExisted) return Promise.reject(new Error("该邮箱已提交系统权限申请"));
		}, 500);
	}, [form]);
	return (
		<Form form={form} onFinish={onGetInviteCode} className="w-full" initialValues={initialValues}>
			<Form.Item
				name="email"
				label="邮箱"
				validateTrigger={["onBlur", "onSubmit"]}
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
				<Input placeholder="请输入邀请码" onChange={e => debounceCheckEmail(e.target.value)} />
			</Form.Item>
			<div className="flex justify-center items-center gap-4 mt-4">
				<Button type="primary" block htmlType="submit" loading={loading}>
					获取邀请码
				</Button>
				<Button onClick={onNextStep}>已有邀请码，下一步</Button>
			</div>
		</Form>
	);
}
