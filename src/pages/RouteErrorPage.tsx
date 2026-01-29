import { Button, Result, Space, Typography } from "antd";
import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router-dom";

export default function RouteErrorPage() {
	const err = useRouteError();
	const navigate = useNavigate();

	let title = "页面出错了";
	let subTitle = "发生了未知错误";

	if (isRouteErrorResponse(err)) {
		title = `请求失败（${err.status}）`;
		subTitle = err.statusText || subTitle;
	} else if (err instanceof Error) {
		subTitle = err.message || subTitle;
	}

	return (
		<div style={{ padding: 24 }}>
			<Result
				status="error"
				title={title}
				subTitle={subTitle}
				extra={
					<Space>
						<Button type="primary" onClick={() => window.location.reload()}>
							刷新页面
						</Button>
						<Button onClick={() => navigate(-1)}>返回上一页</Button>
						<Button onClick={() => navigate("/")}>回到首页</Button>
					</Space>
				}
			>
				<Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
					如果该问题持续出现，请联系管理员并提供复现路径/截图。
				</Typography.Paragraph>
			</Result>
		</div>
	);
}
