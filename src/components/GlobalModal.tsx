import { Alert, AlertProps } from "antd";
import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface IAlertState {
	visible: boolean;
	title: string;
	// content: React.ReactNode;
	onClose: () => void;
	type: AlertProps["type"];
	duration?: number;
}

// 1. 定义全局弹窗的默认配置（独立于组件，维护全局状态）
let modalState: IAlertState = {
	visible: false, // 弹窗显示/隐藏
	title: "默认标题", // 弹窗标题
	type: "success",
	duration: 4000,
	// content: "默认内容", // 弹窗内容
	onClose: () => {}, // 关闭后的回调函数
};

// 2. 定义状态更新回调（用于通知组件更新状态）
let onModalStateChange = (newState: IAlertState) => {};

// 3. 暴露全局命令式 API（核心：供外部调用，修改全局状态）
export const GlobalModal = {
	// 打开弹窗（支持传入配置项覆盖默认值）
	open: (config = {}) => {
		modalState = {
			...modalState,
			visible: true,
			...config, // 传入的配置项优先级更高（如自定义标题、内容）
		};
		// 通知组件更新状态，触发重新渲染
		onModalStateChange(modalState);
	},

	// 关闭弹窗
	close: () => {
		modalState.visible = false;
		onModalStateChange(modalState);
		// 执行关闭回调
		modalState.onClose?.();
	},

	// 关闭并清空回调（避免内存泄漏）
	destroy: () => {
		modalState = {
			visible: false,
			title: "默认标题",
			type: undefined,
			// content: "默认内容",
			onClose: () => {},
		};
		onModalStateChange(modalState);
	},
};

// 1. 定义 Portal 组件（封装 createPortal 的使用）
export const ModalComponent = () => {
	const [localState, setLocalState] = useState<IAlertState>(modalState);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		// 注册回调：当全局 modalState 变化时，更新组件内状态
		onModalStateChange = newState => {
			setLocalState({ ...newState });
		};
		return () => {
			timerRef.current && clearTimeout(timerRef.current);
		};
	}, []);

	useEffect(() => {
		if (localState.visible) return;

		timerRef.current = setTimeout(() => {
			localState.visible = false;
			onModalStateChange(localState);
		}, localState.duration);
	}, [localState.visible]);

	// 获取 Portal 挂载目标 DOM 节点（对应 index.html 中的 portal-root）
	const portalRoot = document.getElementById("portal-root");

	// 边界处理：如果 DOM 节点不存在，返回 null 避免报错
	if (!portalRoot || !localState.visible) return null;

	// 2. 核心：调用 createPortal 渲染内容
	// 第一个参数：要渲染的内容（JSX/组件）
	// 第二个参数：目标 DOM 节点（必须是真实 DOM 元素）
	return createPortal(
		<div
			style={{
				position: "fixed",
				top: 0,
				bottom: 0,
				left: 0,
				right: 0,
				backgroundColor: "#0000007f",
			}}
			onClick={() => GlobalModal.close()}
		>
			<div
				style={{
					position: "fixed",
					top: "10%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					padding: "20px",
					// backgroundColor: "#fff",
					// border: "1px solid #ccc",
					zIndex: 9999,
				}}
				onClick={e => e.stopPropagation()}
			>
				{/* {children} */}
				<Alert title={localState.title} type={localState.type} />
			</div>
		</div>,
		portalRoot
	);
};
