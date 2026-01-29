import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ModalComponent } from "./components/GlobalModal.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// 注册插件
dayjs.extend(utc);
dayjs.extend(timezone);

// 设置时区为上海
dayjs.tz.setDefault("Asia/Shanghai");
// import { mock, result } from './mazeUtils/1.ts'

// console.log('isconnected: ', mock, result);
ReactDOM.createRoot(document.getElementById("root")!).render(
	<ErrorBoundary>
		<>
			<App />
			<ModalComponent />
		</>
	</ErrorBoundary>
);
