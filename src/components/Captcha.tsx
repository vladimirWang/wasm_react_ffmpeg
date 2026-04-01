import React, { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { getCaptcha } from "../api/util";
import { useLocation } from "react-router-dom";

export type CaptchaHandle = {
	refreshCaptcha: () => void;
};

interface CaptchaProps {
	onChange: (captchaId: string) => void;
	pathname: string;
	pathnamesRefresh: string[];
}

function Captcha(
	{ onChange, pathname, pathnamesRefresh }: CaptchaProps,
	ref: React.Ref<CaptchaHandle>
): React.ReactElement {
	const [captchaSrc, setCaptchaSrc] = useState<string>();

	useImperativeHandle(ref, () => ({
		refreshCaptcha: loadCaptcha,
	}));

	const loadCaptcha = async () => {
		const src = await getCaptcha();
		setCaptchaSrc(src.image);
		// setCaptchaId(src.captchaId);
		onChange(src.captchaId);
	};

	useEffect(() => {
		if (!pathnamesRefresh.includes(pathname)) {
			loadCaptcha();
		}
	}, [pathname]);

	useEffect(() => {
		function loadCaptchaWhenVisible() {
			if (document.visibilityState !== "visible") return;
			loadCaptcha();
		}
		document.addEventListener("visibilitychange", loadCaptchaWhenVisible, false);
		return () => {
			document.removeEventListener("visibilitychange", loadCaptchaWhenVisible, false);
			// window.removeEventListener("load", loadCaptcha, false);
		};
	}, []);
	return (
		<img
			src={captchaSrc}
			width={100}
			height={40}
			alt="验证码"
			onClick={loadCaptcha}
			style={{ background: "white" }}
		/>
	);
}

export default forwardRef<CaptchaHandle, CaptchaProps>(Captcha);
