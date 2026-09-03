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

// 主题色与 src/index.css 中 Tailwind @theme 定义保持一致（对齐 StockFlow 落地页橙色风）
const ORANGE_PRIMARY = "#FF7A00"; // hsl(24, 100%, 50%) — 落地页主色
const ORANGE_HOVER = "#E66F00"; // 略深
const antdTheme = {
	cssVar: { key: "app-theme" },
	token: {
		colorPrimary: ORANGE_PRIMARY,
		colorLink: ORANGE_PRIMARY,
		colorInfo: ORANGE_PRIMARY,
		// 圆角：落地页统一 0.75rem = 12px
		borderRadius: 12,
		borderRadiusLG: 12,
		borderRadiusSM: 6,
	},
	components: {
		Layout: {
			headerBg: "#FFFFFF",
			siderBg: "#FFFFFF",
		},
		Menu: {
			// 浅色主题下选中项用橙色系高亮（对齐落地页 "免费试用" 按钮）
			itemSelectedBg: "rgba(255, 122, 0, 0.12)",
			itemSelectedColor: "#FF7A00",
			itemHoverBg: "rgba(255, 122, 0, 0.06)",
			itemHoverColor: "#FF7A00",
			subMenuItemBg: "#FFFFFF",
		},
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
