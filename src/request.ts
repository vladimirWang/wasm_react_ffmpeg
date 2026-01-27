import axios, { type AxiosInstance, type AxiosResponse, type AxiosRequestConfig } from "axios";
import { message } from "antd";
import { sleep } from "./utils/common";
import { type IResponse } from "./api/commonDef";

// 扩展 AxiosRequestConfig，添加自定义配置字段
declare module "axios" {
	export interface AxiosRequestConfig {
		// 是否显示成功提示，默认 false（不显示）
		showSuccessMessage?: boolean;
		// 是否显示失败提示，默认 true（显示）
		showErrorMessage?: boolean;
	}
}

// 自定义请求接口，返回 T 而不是 AxiosResponse<T>
interface CustomAxiosInstance {
	get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
	post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
	put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
	patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
	delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
	interceptors: AxiosInstance["interceptors"];
}

// 1. 先封装全局 axios 实例（带拦截器、超时等配置）
const axiosInstance: AxiosInstance = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL,
	timeout: 10000,
	headers: { "Content-Type": "application/json" },
});

// 请求拦截器：统一添加 Token
axiosInstance.interceptors.request.use(config => {
	const token = localStorage.getItem("access_token");
	console.log("interceptor token: ", token);
	if (token) config.headers.Authorization = `${token}`;
	// if (config.method === "GET" && config.params.includeDeleted === 1) {
	// 	delete config.params.includeDeleted;
	// 	config.params.deletedAt = true;
	// }
	return config;
});

// 响应拦截器：统一处理响应结果提示
axiosInstance.interceptors.response.use(
	<T = any>(response: AxiosResponse<T>) => {
		const config = response.config;
		const data = response.data;

		// 检查响应是否符合 IResponse 格式
		if (data && typeof data === "object" && "code" in data && "message" in data && "data" in data) {
			const responseData = data as IResponse<any>;
			const { code, message: msg } = responseData;

			// 判断是否成功（通常 code === 200 表示成功）
			if (code === 200) {
				// 成功：根据配置决定是否显示提示
				const showSuccessMessage = config.showSuccessMessage ?? false;
				if (showSuccessMessage && msg) {
					message.success(msg);
				}
				// 返回 data 字段
				return responseData.data as T;
			} else {
				// 业务失败（HTTP 200 但 code !== 200）：根据配置决定是否显示提示
				const showErrorMessage = config.showErrorMessage ?? true;
				if (showErrorMessage && msg) {
					message.error(msg);
				}
				// 抛出错误（不会进入错误拦截器，因为 HTTP 状态码是 200）
				return Promise.reject(responseData);
			}
		}

		// 如果不是 IResponse 格式，直接返回原始数据
		return data as T;
	},
	async error => {
		const config = error.config || {};
		const showErrorMessage = config.showErrorMessage ?? true;

		// 处理错误响应
		if (error.response) {
			// 服务器返回了错误状态码
			const status = error.response.status;
			const data = error.response.data;

			// 如果是 401 未授权，清除 token 并跳转到登录页
			if (status === 401) {
				localStorage.removeItem("access_token");

				// 获取当前路径，用于登录后回跳
				const currentPath = window.location.pathname + window.location.search;
				const redirectUrl = encodeURIComponent(currentPath);

				// 避免在登录页时重复跳转
				if (currentPath !== "/landing/login" && !currentPath.startsWith("/landing/login")) {
					message.error("登录过期，请重新登录");
					// 使用 setTimeout 延迟跳转，确保消息提示有时间显示
					await sleep(2000);
					window.location.href = `/landing/login?redirect=${redirectUrl}`;
				}
				// 401 错误已经处理，直接 reject
				return Promise.reject({
					code: 401,
					message: "登录过期，请重新登录",
					data: null,
				});
			}

			// 如果后端返回的数据已经是统一格式（有 code 和 message）
			if (data && typeof data === "object" && "code" in data && "message" in data) {
				const responseData = data as IResponse<any>;
				// 如果配置允许显示，则显示错误提示
				if (showErrorMessage && responseData.message) {
					message.error(responseData.message);
				}
				return Promise.reject(responseData);
			}

			// 否则，构造统一格式的错误响应
			const errorMessage = data?.message || error.message || "请求失败";
			if (showErrorMessage) {
				message.error(errorMessage);
			}
			return Promise.reject({
				code: status,
				message: errorMessage,
				data: null,
			});
		}

		// 网络错误或其他错误
		const errorMessage = error.message || "网络错误";
		if (showErrorMessage) {
			message.error(errorMessage);
		}
		return Promise.reject({
			code: 0,
			message: errorMessage,
			data: null,
		});
	}
);

// 将 axiosInstance 断言为 CustomAxiosInstance 类型
const request = axiosInstance as unknown as CustomAxiosInstance;

export default request;
