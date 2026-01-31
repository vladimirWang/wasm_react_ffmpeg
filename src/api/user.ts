import request from "../request";
import { IResponse } from "./commonDef";

// 定义登录响应类型
export type LoginResponse = IResponse<string>;

export type IUser = {
	id: string;
	email: string;
	username?: string;
	createdAt: string;
};
// 定义注册响应类型
export type RegisterResponse = IResponse<IUser>;

// 定义登录请求参数类型
export interface LoginParams {
	email: string;
	password: string;
	captchaText: string;
	captchaId: string;
}

// 定义注册请求参数类型
export interface RegisterParams {
	email: string;
	password: string;
	username?: string;
	verifyCode?: string;
}

export const userLogin = (
	data: LoginParams,
	config?: { showSuccessMessage?: boolean }
): Promise<string> => {
	return request.post<LoginResponse>("/api/user/login", data, {
		showSuccessMessage: config?.showSuccessMessage ?? true, // 登录成功默认显示提示
	});
};

export const userRegister = (data: RegisterParams): Promise<RegisterResponse> => {
	return request.post<RegisterResponse>("/api/user/register", data);
};

export const getCurrentUser = (): Promise<RegisterResponse> => {
	return request.get<RegisterResponse>("/api/user/current");
};

export interface ICaptcha {
	image: string;
	captchaId: string;
}
export const getCaptcha = (): Promise<ICaptcha> => {
	const rnd = Math.random();
	const rndStr = (rnd + "").slice(2);
	return request.get<ICaptcha>("/api/user/captcha?q=" + rndStr);
};

// 发送邮箱验证码
export const sendEmailVerificationCode = (email: string): Promise<void> => {
	return request.post<void>("/api/util/sendEmailVerificationCode", { email });
};

// 验证邮箱
export const checkEmailVerificationCode = (data: {
	email: string;
	verifyCode: string;
}): Promise<void> => {
	return request.post<void>("/api/util/checkEmailValidation", data);
};
