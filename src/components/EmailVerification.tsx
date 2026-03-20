import { Button, Input, Space } from "antd";
import React, { useMemo, useState } from "react";
import { GlobalModal } from "./GlobalModal";

interface EmailVerificationProps {
	email: string;
}

export default function EmailVerification(props: EmailVerificationProps) {
	const [countdown, setCountdown] = useState(0);
	const sendVerifyCode = async () => {
		GlobalModal.open({
			title: "发送验证码",
			content: "请输入邮箱",
			onClose: () => {
				console.log("onClose");
			},
		});
		// if (countdown > 0) return;
		// // await sendEmailVerificationCode(props.email);
		// setCountdown(60);
		// const timer = setInterval(() => {
		// 	setCountdown(prev => {
		// 		if (prev <= 1) {
		// 			clearInterval(timer);
		// 			return 0;
		// 		}
		// 		return prev - 1;
		// 	});
		// }, 1000);
	};
	const text = useMemo(() => {
		return countdown > 0 ? `${countdown}秒后重发` : "发送验证码";
	}, [props.email]);
	return (
		<div>
			<Space.Compact block>
				<Input placeholder="请输入邮箱" />
				<Button onClick={sendVerifyCode} disabled={countdown > 0}>
					{text}
				</Button>
			</Space.Compact>
		</div>
	);
}
