import { DownOutlined, UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { Avatar, Dropdown, MenuProps, Space } from "antd";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";
import { clearUserCache } from "../routes";

export default function Drop() {
	const [rotate, setRotate] = React.useState(false);
	const navigate = useNavigate();
	const { user, clearUser } = useUserStore();

	const handleLogout = () => {
		// 清除 token
		localStorage.removeItem("access_token");
		// 清除用户缓存
		clearUserCache();
		// 清除 zustand store
		clearUser();
		// 跳转到登录页
		navigate("/landing/login", { replace: true });
	};

	const items: MenuProps["items"] = [
		{
			label: "个人中心",
			key: "profile",
			icon: <UserOutlined />,
		},
		{
			type: "divider",
		},
		{
			label: "登出",
			key: "logout",
			icon: <LogoutOutlined />,
			danger: true,
			onClick: handleLogout,
		},
	];

	return (
		<Dropdown
			menu={{ items }}
			trigger={["click"]}
			onOpenChange={val => {
				setRotate(val);
			}}
		>
			<a
				onClick={e => {
					e.preventDefault();
				}}
			>
				<Space>
					<section>
						<Avatar icon={<UserOutlined />} />
						<span className="mx-2">{user?.username || "未登录"}</span>
					</section>
					<DownOutlined className={rotate ? "rotate-180" : ""} />
				</Space>
			</a>
		</Dropdown>
	);
}
