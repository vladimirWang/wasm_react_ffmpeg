import React, { useEffect, useRef } from "react";
import { message, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import { ssoExchange, getSsoRedirectUri } from "../api/user";
import { clearUserCache } from "../routes";

/**
 * SSO 统一登录回跳页：校验 state 防 CSRF → 用授权码换本系统 token → 进入应用
 * SSO 302 落地形态：/{?code=xxx&state=yyy}#/landing/sso/callback
 * code/state 在真实 query string 上（hash 之前）；react-router 的 useSearchParams
 * 读的是 hash 内参数，因此这里用 window.location.search 取参
 */
const SSOOAuthCallback: React.FC = () => {
	const navigate = useNavigate();
	const ran = useRef(false);

	useEffect(() => {
		if (ran.current) return;
		ran.current = true;

		const search = new URLSearchParams(window.location.search);
		const code = search.get("code");
		const state = search.get("state");

		const fail = (msg?: string) => {
			if (msg) message.error(msg);
			navigate("/landing/login", { replace: true });
		};

		if (!code) {
			fail("缺少 SSO 授权参数");
			return;
		}

		// CSRF 校验：state 必须与跳转前存入 sessionStorage 的随机值一致
		const savedState = sessionStorage.getItem("sso_state");
		if (!state || !savedState || state !== savedState) {
			fail("SSO 登录状态校验失败，请重新登录");
			return;
		}
		const redirect = sessionStorage.getItem("sso_redirect") || "/";
		sessionStorage.removeItem("sso_state");
		sessionStorage.removeItem("sso_redirect");

		let cancelled = false;
		(async () => {
			try {
				// 错误提示由响应拦截器统一弹出（如邮箱未在本系统开通）
			const token = await ssoExchange(code, getSsoRedirectUri());
				if (cancelled) return;
				localStorage.setItem("access_token", token);
				clearUserCache();
				const target =
					redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/";
				navigate(target, { replace: true });
			} catch {
				if (!cancelled) {
					navigate("/landing/login", { replace: true });
				}
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [navigate]);

	return (
		<div
			style={{
				minHeight: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				flexDirection: "column",
				gap: 16,
			}}
		>
			<Spin size="large" />
			<span style={{ color: "rgba(0,0,0,0.45)" }}>正在完成 SSO 登录…</span>
		</div>
	);
};

export default SSOOAuthCallback;
