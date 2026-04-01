import { nodejsRequest } from "../request";
import { IResponse } from "./commonDef";
import { IUser, LoginParams, RegisterParams, RegisterResponse } from "./user";
const prefix = "/admin/user";

export const adminUserLogin = (
	data: LoginParams,
	config?: { showSuccessMessage?: boolean }
): Promise<string> => {
	return nodejsRequest.post<string>(`${prefix}/login`, data, {
		showSuccessMessage: config?.showSuccessMessage, // 登录成功默认显示提示
	});
};

export const adminUserRegister = (data: RegisterParams): Promise<RegisterResponse> => {
	return nodejsRequest.post<RegisterResponse>(`${prefix}/register`, data);
};

export const adminCheckEmailExisted = (email: string): Promise<boolean> => {
	return nodejsRequest.get<boolean>(`${prefix}/checkEmailExisted/${email}`);
};

export const adminCheckEmailNotExisted = (email: string): Promise<boolean> => {
	return nodejsRequest.get<boolean>(`${prefix}/checkEmailNotExisted/${email}`);
};

export const adminGetUserSaltByEmail = (email: string): Promise<string> => {
	return nodejsRequest.get<string>(`${prefix}/getSalt/${email}`);
};

// 重置密码
export const adminResetPassword = (data: { email: string }): Promise<void> => {
	return nodejsRequest.post<void>(`${prefix}/resetPassword`, data);
};

export interface IUpdatePasswordParams {
	current: string;
	password: string;
	nonce: string;
}
// 修改密码
export const adminUpdatePassword = (data: IUpdatePasswordParams): Promise<void> => {
	return nodejsRequest.post<void>(`${prefix}/updatePassword`, data);
};
