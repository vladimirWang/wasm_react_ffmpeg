import React, { useMemo } from "react";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import { Button, Flex, message } from "antd";
import {
	buildSsoAuthorizeUrl,
	buildSsoLogoutUrl,
} from "../api/user";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { clearUserCache } from "../routes";

const Login: React.FC = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const ssoEnabled = useMemo(() => buildSsoAuthorizeUrl() !== null, []);

	const startSsoLogin = () => {
		const url = buildSsoAuthorizeUrl();
		console.log('url: ', url)
		if (!url) {
			message.error("SSO 登录未配置，请联系管理员");
			return;
		}
		sessionStorage.setItem("sso_redirect", searchParams.get("redirect") || "/");
		window.location.href = url;
	};

	return (
		<div className="flex items-stretch rounded-xl overflow-hidden bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)] min-h-[480px] w-[min(92vw,860px)] max-md:max-w-[420px]">
			{/* 品牌面板 - 移动端隐藏 */}
			<div
				className="hidden md:flex w-[280px] shrink-0 bg-primary text-white flex-col justify-center items-center gap-5 px-8 py-10 text-center"
				aria-hidden="true"
			>
				<div className="w-16 h-16 rounded-[14px] bg-white/18 flex items-center justify-center text-[28px] font-bold tracking-[0.05em]">
					R
				</div>
				<div>
					<div className="text-[22px] font-semibold leading-[1.3]">仓库管理系统</div>
					<div className="text-[13px] leading-[1.6] opacity-[0.82]">
						RepoCMS · 简洁高效的库存管理平台
					</div>
				</div>
			</div>

			{/* 表单区 */}
			<div className="flex-1 flex flex-col justify-center px-7 pt-9 pb-6 md:px-11 md:pt-12 md:pb-9">
				<div className="mb-7">
					<h2 className="mb-1.5 text-[22px] font-semibold text-[rgba(0,0,0,0.85)]">账号登录</h2>
					<p className="text-[13px] text-[rgba(0,0,0,0.45)]">使用 SSO 统一登录</p>
				</div>

				{ssoEnabled ? (
					<>
						<Button
							block
							type="primary"
							size="large"
							icon={<SafetyCertificateOutlined />}
							onClick={startSsoLogin}
						>
							使用 SSO 统一登录
						</Button>
						<Flex justify="center" className="mt-2">
							<Link
								to={buildSsoLogoutUrl() ?? "#"}
								className="text-[12px] text-[rgba(0,0,0,0.35)] hover:text-[rgba(0,0,0,0.65)]"
							>
								退出所有系统（SSO 登出）
							</Link>
						</Flex>
					</>
				) : (
					<p className="text-[14px] text-[rgba(0,0,0,0.45)]">
						SSO 登录未配置，请联系管理员。
					</p>
				)}

				<Flex justify="center" className="mt-6">
					<Link
						to="/landing/register"
						className="text-[13px] text-[rgba(0,0,0,0.45)] hover:text-[rgba(0,0,0,0.65)]"
					>
						去注册
					</Link>
				</Flex>
			</div>
		</div>
	);
};

export default Login;
