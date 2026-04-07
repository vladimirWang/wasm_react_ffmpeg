import React, { useEffect, useRef } from "react";
import { message, Spin } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exchangeGithubOAuthToken } from "../api/user";
import { clearUserCache } from "../routes";

/** GitHub OAuth 回跳页：用一次性 exchange 换 JWT 并写入 localStorage */
const GitHubOAuthCallback: React.FC = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const ran = useRef(false);

	useEffect(() => {
		if (ran.current) return;
		ran.current = true;

		const oauthError = searchParams.get("oauth_error");
		if (oauthError) {
			message.error(oauthError);
			navigate("/landing/login", { replace: true });
			return;
		}

		const exchange = searchParams.get("exchange");
		if (!exchange) {
			message.error("缺少授权参数");
			navigate("/landing/login", { replace: true });
			return;
		}

		let cancelled = false;
		(async () => {
			try {
				const res = await exchangeGithubOAuthToken(exchange);
				if (cancelled) return;
				localStorage.setItem("access_token", res.token);
				clearUserCache();
				const target =
					res.redirect && res.redirect.startsWith("/") && !res.redirect.startsWith("//")
						? res.redirect
						: "/";
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
	}, [navigate, searchParams]);

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
			<span style={{ color: "rgba(0,0,0,0.45)" }}>正在完成 GitHub 登录…</span>
		</div>
	);
};

export default GitHubOAuthCallback;
