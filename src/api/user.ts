import { nodejsRequest } from "../request";
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
	nonce: string;
}

// 定义注册请求参数类型
export interface RegisterParams {
	email: string;
	password: string;
	username: string;
	verifyCode: string;
}

export const userLogin = (
	data: LoginParams,
	config?: { showSuccessMessage?: boolean }
): Promise<string> => {
	return nodejsRequest.post<LoginResponse>("/user/login", data, {
		showSuccessMessage: config?.showSuccessMessage, // 登录成功默认显示提示
	});
};

export const userRegister = (data: RegisterParams): Promise<RegisterResponse> => {
	console.log("userRegister data: ", data);
	return nodejsRequest.post<RegisterResponse>("/user/register", data);
};

export const getCurrentUser = (): Promise<IUser> => {
	return nodejsRequest.get<IUser>("/user/current");
};

export interface ICaptcha {
	image: string;
	captchaId: string;
}
export const getCaptcha = (): Promise<ICaptcha> => {
	const rnd = Math.random();
	const rndStr = (rnd + "").slice(2);
	return nodejsRequest.get<ICaptcha>("/user/captcha?q=" + rndStr);
};

// 发送邮箱验证码
export const sendEmailVerificationCode = (email: string): Promise<void> => {
	return nodejsRequest.post<void>("/util/sendEmailVerificationCode", { email });
};

interface ICheckEmailVerificationCodeResponse {
	email: string;
	verified: boolean;
}
// 验证邮箱
export const checkEmailVerificationCode = (data: {
	email: string;
	verifyCode: string;
}): Promise<ICheckEmailVerificationCodeResponse> => {
	return nodejsRequest.post<ICheckEmailVerificationCodeResponse>(
		"/util/checkEmailValidation",
		data
	);
};

export const logout = (): Promise<void> => {
	return nodejsRequest.post<void>("/user/logout");
};

export const checkEmailExisted = (email: string): Promise<boolean> => {
	return nodejsRequest.get<boolean>("/user/checkEmailExisted/" + email);
};

export const getNonce = (): Promise<string> => {
	return nodejsRequest.get<string>("/user/get-nonce");
};

export const getUserSaltByEmail = (email: string): Promise<string> => {
	return nodejsRequest.get<string>("/user/getSalt/" + email);
};

// 重置密码
export const resetPassword = (data: { email: string }): Promise<void> => {
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
