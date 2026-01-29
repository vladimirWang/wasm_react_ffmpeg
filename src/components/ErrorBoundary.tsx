import React from "react";
import { Button, Result, Typography } from "antd";

type ErrorBoundaryProps = {
	children: React.ReactNode;
	/** 自定义兜底 UI（不传则使用默认 Result） */
	fallback?: React.ReactNode;
	/** 捕获到错误时的回调（例如上报 Sentry） */
	onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
};

type ErrorBoundaryState = {
	error: Error | null;
	errorInfo: React.ErrorInfo | null;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	state: ErrorBoundaryState = {
		error: null,
		errorInfo: null,
	};

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		return { error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		this.setState({ errorInfo });
		// eslint-disable-next-line no-console
		console.error("ErrorBoundary caught an error:", error, errorInfo);
		this.props.onError?.(error, errorInfo);
	}

	private reset = () => {
		this.setState({ error: null, errorInfo: null });
	};

	render() {
		const { error } = this.state;
		if (!error) return this.props.children;

		if (this.props.fallback) return this.props.fallback;

		return (
			<div style={{ padding: 24 }}>
				<Result
					status="error"
					title="页面出错了"
					subTitle={error.message || "发生了未知错误"}
					extra={[
						<Button key="reload" type="primary" onClick={() => window.location.reload()}>
							刷新页面
						</Button>,
						<Button key="reset" onClick={this.reset}>
							尝试恢复
						</Button>,
					]}
				>
					<Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
						如果该问题持续出现，请联系管理员并提供复现路径。
					</Typography.Paragraph>
				</Result>
			</div>
		);
	}
}
