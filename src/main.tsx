import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ModalComponent } from "./components/GlobalModal.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { ConfigProvider, App as AntdApp } from "antd";

// 主题色与 src/index.css 中 Tailwind @theme 定义保持一致
const antdTheme = {
	cssVar: { key: "app-theme" },
	token: {
		colorPrimary: "#2196F3",
		colorLink: "#2196F3",
		colorInfo: "#2196F3",
	},
};

// 注册插件
dayjs.extend(utc);
dayjs.extend(timezone);

// 设置时区为上海
dayjs.tz.setDefault("Asia/Shanghai");

// test：① vite --mode test ② 或构建/部署时设置 VITE_APP_ENV=test（仍为 production 构建时）
if (import.meta.env.MODE === "test" || import.meta.env.VITE_APP_ENV === "test") {
	document.title = `[test] ${document.title}`;
}
// import { mock, result } from './mazeUtils/1.ts'

// console.log('isconnected: ', mock, result);
ReactDOM.createRoot(document.getElementById("root")!).render(
	<ErrorBoundary>
		<ConfigProvider theme={antdTheme}>
			<AntdApp>
				<>
					<App />
					<ModalComponent />
				</>
			</AntdApp>
		</ConfigProvider>
	</ErrorBoundary>
);
