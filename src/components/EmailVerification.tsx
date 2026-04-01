import { Button, Flex, Form, Input, message, Modal, Space } from "antd";
import type { FormInstance } from "antd/es/form";
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { checkEmailExisted } from "../api/user";
import { CheckCircleFilled } from "@ant-design/icons";
import { checkEmailVerificationCode, sendEmailVerificationCode } from "../api/util";

export type EmailVerificationHandle = {
	/** 当前邮箱是否已在弹窗内通过服务端校验 */
	isEmailVerified: () => boolean;
	/**
	 * 与父级 `form.validateFields()` 配合：在自定义 rule 里调用，或单独 await；
	 * 未验证时会 reject。
	 */
	validateEmailVerified: () => Promise<void>;
};

export interface EmailVerificationProps {
	api?: (email: string) => Promise<boolean>;
	/** 父级 `Form.Item name="email"` 注入 */
	value?: string;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	/** 未包在 Form.Item 里时可手动传邮箱 */
	email?: string;
	/**
	 * 将验证结果写入父级表单字段（如 `emailVerified`），父级需增加同名 hidden `Form.Item` + `rules`
	 */
	verifiedFieldName?: string;
	/** 显式传入父级 form（推荐与 `verifiedFieldName` 同用）；不传则尝试 `Form.useFormInstance()` */
	form?: FormInstance;
}

const EmailVerification = forwardRef<EmailVerificationHandle, EmailVerificationProps>(
	function EmailVerification(props, ref) {
		const { value, onChange, email: emailProp, verifiedFieldName, form: formProp } = props;

		const [isVerified, setIsVerified] = useState(false);
		const [countdown, setCountdown] = useState(0);
		const [modalForm] = Form.useForm();
		const [open, setOpen] = useState(false);
		const [loading, setLoading] = useState(false);
		const [sendCodeLoading, setSendCodeLoading] = useState(false);

		const formFromContext = Form.useFormInstance();
		const parentForm = formProp ?? formFromContext;

		const emailStr = value ?? emailProp ?? "";

		useImperativeHandle(
			ref,
			() => ({
				isEmailVerified: () => isVerified,
				validateEmailVerified: async () => {
					if (!isVerified) {
						return Promise.reject(new Error("请先完成邮箱验证"));
					}
				},
			}),
			[isVerified]
		);

		/** 邮箱变更时重置验证状态，并同步父级隐藏字段（parentForm 由父级传入，视为稳定） */
		useEffect(() => {
			setIsVerified(false);
			if (verifiedFieldName && parentForm) {
				parentForm.setFieldValue(verifiedFieldName, false);
			}
		}, [value, emailProp, verifiedFieldName]);

		const handleOk = async () => {
			try {
				setLoading(true);
				await modalForm.validateFields();
				const values = modalForm.getFieldsValue();
				const { verified } = await checkEmailVerificationCode({
					email: emailStr,
					verifyCode: values.verifyCode,
				});
				if (!verified) {
					// message.error("验证码错误或已过期");
					parentForm.setFieldValue(verifiedFieldName, false);
					return;
				}
				setIsVerified(true);
				if (verifiedFieldName && parentForm) {
					console.log("setFieldValue: ", verifiedFieldName);
					// parentForm.setFieldValue(verifiedFieldName, true);
					parentForm.setFieldValue(verifiedFieldName, true);
				}
				setOpen(false);
			} catch {
				// 表单项校验或请求失败
			} finally {
				setLoading(false);
			}
		};

		const handleCancel = () => {
			setOpen(false);
		};

		const sendVerifyCode = async () => {
			if (!emailStr) {
				message.warning("请先填写邮箱");
				return;
			}
			try {
				setSendCodeLoading(true);
				await sendEmailVerificationCode(emailStr);
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
			} catch {
				message.error("发送验证码失败");
			} finally {
				setSendCodeLoading(false);
			}
		};

		const text = useMemo(() => {
			if (sendCodeLoading) return "发送中...";
			return countdown > 0 ? `${countdown}秒后重发` : "发送验证码";
		}, [sendCodeLoading, countdown]);

		const handleVerify = async () => {
			if (!emailStr) {
				message.warning("请先填写邮箱");
				return;
			}
			const api = props.api ?? checkEmailExisted;
			const existed = await api(emailStr);
			if (!existed) {
				message.warning("该邮箱未注册");
				return;
			}
			if (isVerified) return;
			setOpen(true);
		};

		return (
			<div>
				<Space.Compact block>
					<Input placeholder="请输入邮箱" value={emailStr} onChange={e => onChange?.(e)} />
					<Button type="text" onClick={handleVerify}>
						{isVerified ? (
							<CheckCircleFilled style={{ color: "#52c41a" }} />
						) : (
							<span className="text-red-600">未验证</span>
						)}
					</Button>
				</Space.Compact>
				<Modal
					open={open}
					title={"邮箱验证: " + emailStr}
					onOk={handleOk}
					onCancel={handleCancel}
					footer={[
						<Button key="back" onClick={handleCancel}>
							返回
						</Button>,
						<Button
							key="submit"
							type="primary"
							loading={loading || sendCodeLoading}
							onClick={handleOk}
						>
							确定
						</Button>,
					]}
				>
					<Form form={modalForm}>
						<Form.Item name="verifyCode" rules={[{ required: true, message: "请输入验证码" }]}>
							<Flex gap={10}>
								<Input placeholder="请输入验证码" />
								<Button type="text" onClick={sendVerifyCode} disabled={countdown > 0}>
									{text}
								</Button>
							</Flex>
						</Form.Item>
					</Form>
				</Modal>
			</div>
		);
	}
);

export default EmailVerification;
