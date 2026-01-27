import axios, { type AxiosInstance, type AxiosResponse, type AxiosRequestConfig } from "axios";
import { message } from "antd";
import { sleep } from "./utils/common";

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

// 响应拦截器：返回 response.data，但保持类型安全
axiosInstance.interceptors.response.use(
	<T = any>(response: AxiosResponse<T>) => {
		return response.data as T;
	},
	async error => {
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
			}

			// 如果后端返回的数据已经是统一格式（有 code 和 message），直接返回
			if (data && typeof data === "object" && "code" in data && "message" in data) {
				return Promise.reject(data);
			}

			// 否则，构造统一格式的错误响应
			return Promise.reject({
				code: status,
				message: data?.message || error.message || "请求失败",
				data: null,
			});
		}

		// 网络错误或其他错误
		return Promise.reject({
			code: 0,
			message: error.message || "网络错误",
			data: null,
		});
	}
);

// 将 axiosInstance 断言为 CustomAxiosInstance 类型
const request = axiosInstance as unknown as CustomAxiosInstance;

export default request;
