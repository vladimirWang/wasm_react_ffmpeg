import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * 激活流程已下线：审核通过即创建 User（无密码），用户通过 SSO 登录。
 * 此页面仅做重定向，保留路径兼容旧链接。
 */
export default function RegisterForm() {
	const navigate = useNavigate();
	useEffect(() => {
		navigate("/landing/login", { replace: true });
	}, [navigate]);
	return null;
}
