import { Button, Form, Input } from "antd";
import React, { useState } from "react";
import { checkEmailNotExisted, ParamEmail } from "../../api/user";
import { RegisterCommonProps } from "./VerifyEmail";
import { emailRegex } from "./Register";
import { sendInviteCode } from "../../api/applicant";

const initialValues = {
	email: "aachen2012@outlook.com",
};

export default function GetInviteCode(props: RegisterCommonProps) {
	const { onNextStep } = props;
	const [loading, setLoading] = useState(false);
	const onGetInviteCode = async (values: ParamEmail) => {
		try {
			setLoading(true);
			await sendInviteCode(values);
		} finally {
			setLoading(false);
		}
	};
	return (
		<Form onFinish={onGetInviteCode} className="w-full" initialValues={initialValues}>
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
			>
				<Input placeholder="请输入邀请码" />
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
