import useSWR from "swr";
import axios, { type AxiosInstance, type AxiosResponse } from "axios";

// 1. 先封装全局 axios 实例（带拦截器、超时等配置）
const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// 请求拦截器：统一添加 Token
request.interceptors.request.use((config) => {
  const token = localStorage.getItem("warehouse_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 响应拦截器：返回 response.data，但保持类型安全
request.interceptors.response.use(<T = any>(response: AxiosResponse<T>) => {
  return response.data as T;
});

export default request;
