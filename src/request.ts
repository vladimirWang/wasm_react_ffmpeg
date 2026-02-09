import axios, { type AxiosInstance, type AxiosResponse, type AxiosRequestConfig } from "axios";
import { message } from "antd";
import { sleep } from "./utils/common";
import { type IResponse } from "./api/commonDef";
import { requestGenerator } from "./utils/requestGenerator";

// 将 axiosInstance 断言为 CustomAxiosInstance 类型
export const nodejsRequest = requestGenerator(import.meta.env.VITE_API_BASE_URL || "/nodejs_api");
export const goRequest = requestGenerator(import.meta.env.VITE_API_BASE_URL || "/go_api");
