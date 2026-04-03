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
	email: string;
	password: string;
	username: string;
	verifyCode: string;
}

export const userLogin = (
	data: LoginParams,
	config?: { showSuccessMessage?: boolean }
): Promise<string> => {
	return nodejsRequest.post<string>("/user/login", data, {
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
