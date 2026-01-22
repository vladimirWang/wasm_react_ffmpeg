import axios, { type AxiosInstance, type AxiosResponse, type AxiosRequestConfig } from "axios";

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
	(error) => {
		// 处理错误响应
		if (error.response) {
			// 服务器返回了错误状态码
			const status = error.response.status;
			const data = error.response.data;

			// 如果是 401 未授权，清除 token
			if (status === 401) {
				localStorage.removeItem("access_token");
			}

			// 如果后端返回的数据已经是统一格式（有 code 和 message），直接返回
			if (data && typeof data === 'object' && 'code' in data && 'message' in data) {
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
