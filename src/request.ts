import useSWR from "swr";
import axios from "axios";

// 1. 先封装全局 axios 实例（带拦截器、超时等配置）
const request = axios.create({
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

request.interceptors.response.use((response) => {
  return response.data;
});

export default request;
