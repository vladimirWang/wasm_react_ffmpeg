import { nodejsRequest } from "../request";
import { IResponse } from "./commonDef";

export type IUser = {
	id: string;
	email: string;
	username?: string;
	createdAt: string;
	role: "merchant" | "admin";
};
// 定义注册响应类型
export type RegisterResponse = IResponse<IUser>;

// 定义登录请求参数类型
export interface LoginParams {
	email: string;
	password: string;
	captchaText: string;
	captchaId: string;
	nonce: string;
}

// 定义注册请求参数类型
export interface RegisterParams {
	// email: string;
	// verifyCode: string;
	token: string;
	password: string;
	username: string;
}

export const userLogin = (
	data: LoginParams,
	config?: { showSuccessMessage?: boolean }
): Promise<string> => {
	return nodejsRequest.post<string>("/user/login", data, {
		showSuccessMessage: config?.showSuccessMessage, // 登录成功默认显示提示
	});
};

/** 构建「开始 GitHub 授权」的完整 URL（须整页跳转，不能走 AJAX） */
export function buildGithubOAuthStartUrl(redirectAfterLogin?: string): string {
	const params = new URLSearchParams();
	if (redirectAfterLogin) {
		params.set("redirect", redirectAfterLogin);
	}
	const qs = params.toString() ? `?${params.toString()}` : "";

	/** 生产若 OAuth 走 /api/auth/github（与 GITHUB_REDIRECT_URI 同站点路径风格一致），可配置完整 URL */
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

export const userRegister = (data: RegisterParams): Promise<RegisterResponse> => {
	return nodejsRequest.post<RegisterResponse>("/user/register", data);
};

export const getCurrentUser = (): Promise<IUser> => {
	return nodejsRequest.get<IUser>("/user/current");
};

export const logout = (): Promise<void> => {
	return nodejsRequest.post<void>("/user/logout");
};

export const checkEmailExisted = (email: string): Promise<boolean> => {
	return nodejsRequest.get<boolean>("/user/checkEmailExisted/" + email);
};

export const getUserSaltByEmail = (email: string): Promise<string> => {
	return nodejsRequest.get<string>("/user/getSalt/" + email);
};

export type ParamEmail = {
	email: string;
};
// 重置密码
export const resetPassword = (data: ParamEmail): Promise<void> => {
	return nodejsRequest.post<void>("/user/resetPassword", data);
};

export interface IUpdatePasswordParams {
	current: string;
	password: string;
	nonce: string;
}
// 修改密码
export const updatePassword = (data: IUpdatePasswordParams): Promise<void> => {
	return nodejsRequest.post<void>("/user/updatePassword", data);
};

interface RegisterByTokenParams {
	token: string;
	password: string;
	username: string;
}

export const userRegisterByToken = (data: RegisterByTokenParams): Promise<RegisterResponse> => {
	return nodejsRequest.post<RegisterResponse>("/user/registerByToken", data);
};
