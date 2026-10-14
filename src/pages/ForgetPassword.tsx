import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * 密码管理已统一由 SSO 负责，本地不再存储密码。
 * 此页面仅做重定向，保留路径兼容旧链接。
 */
export default function ForgetPassword() {
	const navigate = useNavigate();
	useEffect(() => {
		navigate("/landing/login", { replace: true });
	}, [navigate]);
	return null;
}
