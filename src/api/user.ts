import { nodejsRequest } from "../request";
import { IResponse } from "./commonDef";

export type IUser = {
	id: string;
	email: string;
	username?: string;
	createdAt: string;
	role: "merchant" | "admin";
	/** 商户用户的租户 ID；admin 跨租户为 undefined */
	tenantId?: number;
	/** 是否为租户超级管理员（Tenant.superUserId 指向该用户） */
	isSuperUser?: boolean;
};

// 以下类型保留给 adminUser.ts 引用（管理员密码登录仍使用）
export type LoginParams = {
	email: string;
	password: string;
	captchaText: string;
	captchaId: string;
	nonce: string;
};

export type RegisterParams = {
	email: string;
	verifyCode: string;
	password: string;
	username: string;
};

export type RegisterResponse = IResponse<IUser>;

// ==================== SSO 统一登录（sso_login 项目，OAuth2 授权码模式） ====================

/** SSO 授权回跳地址：按当前部署 origin 自动派生（多端口/多域名部署无需改 env） */
export const SSO_CALLBACK_PATH = "/#/landing/sso/callback";
export function getSsoRedirectUri(): string {
	return `${location.origin}${SSO_CALLBACK_PATH}`;
}

/**
 * 构建「开始 SSO 授权」的完整 URL（须整页跳转，不能走 AJAX）
 * 随机 state 存 sessionStorage 兼做 CSRF 校验；登录后回跳地址由调用方另存 sso_redirect
 * 未配置 VITE_SSO_BASE_URL / VITE_SSO_CLIENT_ID 时返回 null（入口按钮应隐藏/降级）
 */
export function buildSsoAuthorizeUrl(): string | null {
	const base = import.meta.env.VITE_SSO_BASE_URL;
	const clientId = import.meta.env.VITE_SSO_CLIENT_ID;
	if (!base || !clientId) {
		return null;
	}
	const state = crypto.randomUUID().replace(/-/g, "");
	sessionStorage.setItem("sso_state", state);
	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: getSsoRedirectUri(),
		response_type: "code",
		state,
	});
	return `${String(base).replace(/\/$/, "")}/oauth/authorize?${params.toString()}`;
}

/**
 * SSO 授权码换本系统 token（后端调 SSO /oauth/token 换 userinfo 后按邮箱匹配本地用户）
 * redirectUri 必须与发起授权时完全一致（OAuth2 规范要求），故由前端一并提交
 */
export const ssoExchange = (code: string, redirectUri: string): Promise<string> => {
	return nodejsRequest.post<string>(
		"/user/sso/exchange",
		{ code, redirectUri },
		{ showSuccessMessage: false },
	);
};

/**
 * 构建「SSO 单点登出」URL（须整页跳转：浏览器导航到 SSO 域才能清掉 httpOnly 的 sso_token cookie）
 * 登出后 SSO 302 回跳到本系统登录页；未配置 SSO 返回 null
 */
export function buildSsoLogoutUrl(): string | null {
	const base = import.meta.env.VITE_SSO_BASE_URL;
	if (!base) return null;
	const redirect = `${location.origin}/#/landing/login`;
	const params = new URLSearchParams({ redirect });
	return `${String(base).replace(/\/$/, "")}/oauth/logout?${params.toString()}`;
}

export const getCurrentUser = (config?: {
	showErrorMessage?: boolean;
}): Promise<IUser> => {
	return nodejsRequest.get<IUser>("/user/current", config);
};

export const logout = (): Promise<void> => {
	return nodejsRequest.post<void>("/user/logout");
};

export const checkEmailExisted = (email: string): Promise<boolean> => {
	return nodejsRequest.get<boolean>("/user/checkEmailExisted/" + email);
};

/** 构建「开始 GitHub 授权」的完整 URL（须整页跳转，不能走 AJAX） */
export function buildGithubOAuthStartUrl(redirectAfterLogin?: string): string {
	const params = new URLSearchParams();
	if (redirectAfterLogin) {
		params.set("redirect", redirectAfterLogin);
	}
	const qs = params.toString() ? `?${params.toString()}` : "";

	const explicitStart = import.meta.env.VITE_GITHUB_OAUTH_START_URL;
	if (explicitStart && String(explicitStart).trim()) {
		return `${String(explicitStart).replace(/\/$/, "")}${qs}`;
	}

	const base = (import.meta.env.VITE_API_BASE_URL || "/nodejs_api").replace(/\/$/, "");
	const path = "/user/oauth/github";
	const suffix = `${path}${qs}`;
	if (base.startsWith("http://") || base.startsWith("https://")) {
		return `${base}${suffix}`;
	}
	const origin = typeof window !== "undefined" ? window.location.origin : "";
	const prefix = base.startsWith("/") ? base : `/${base}`;
	return `${origin}${prefix}${suffix}`;
}

export type GithubOAuthExchangeResult = {
	token: string;
	redirect?: string;
};

export const exchangeGithubOAuthToken = (exchange: string): Promise<GithubOAuthExchangeResult> => {
	return nodejsRequest.post<GithubOAuthExchangeResult>(
		"/user/oauth/github/exchange",
		{ exchange },
		{ showSuccessMessage: false }
	);
};
