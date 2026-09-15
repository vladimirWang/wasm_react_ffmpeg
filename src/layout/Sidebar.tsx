import { Layout, Menu } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { adminRouteConfig, routeConfig } from "../routes";
import { useUserStore } from "../store/userStore";
import { generateMenuItems } from "../utils/routeMenu";
import { ClusterOutlined } from "@ant-design/icons";
import { getTenantInfo, type ITenantInfo } from "../api/tenant";

const { Sider } = Layout;

export default function Sidebar() {
	const [collapsed, setCollapsed] = useState(false);
	const navigate = useNavigate();
	const location = useLocation();
	const role = useUserStore(s => s.user?.role);
	const tenantId = useUserStore(s => s.user?.tenantId);
	const isSuperUser = useUserStore(s => s.user?.isSuperUser);
	const isAdmin = role === "admin";

	const [tenant, setTenant] = useState<ITenantInfo | null>(null);

	// 加载租户基本信息（名称/code/logo），admin 无 tenantId 不加载
	useEffect(() => {
		if (!tenantId) return;
		let cancelled = false;
		(async () => {
			try {
				const info = await getTenantInfo();
				if (!cancelled) setTenant(info);
			} catch {
				// 静默失败，侧边栏回退到默认品牌展示
			}
		})();
		return () => { cancelled = true; };
	}, [tenantId]);

	// 从路由配置生成菜单项
	const menuItems = useMemo(() => {
		return generateMenuItems(isAdmin ? adminRouteConfig : routeConfig, "", isSuperUser);
	}, [isAdmin, isSuperUser]);

	// 处理菜单点击
	const handleMenuClick = ({ key }: { key: string }) => {
		navigate(key);
	};

	// 根据当前路径设置选中的菜单项
	const selectedKeys = useMemo(() => {
		const path = location.pathname;
		// 找到匹配的菜单项
		const findSelectedKey = (items: any[]): string[] => {
			for (const item of items ?? []) {
				if (!item || typeof item !== "object") continue;
				const itemKey = (item as any).key as string;
				const children = (item as any).children as any[] | undefined;
				// 精确匹配
				if (itemKey === path) {
					return [itemKey];
				}
				// 路径前缀匹配（处理动态路由的情况，如 /product/123 匹配 /product）
				if (path.startsWith(itemKey + "/") || path === itemKey) {
					if (children) {
						const found = findSelectedKey(children);
						if (found.length > 0) {
							return [itemKey, ...found];
						}
					}
					// 如果没有子菜单项匹配，返回当前项
					return [itemKey];
				}
				if (children) {
					const found = findSelectedKey(children);
					if (found.length > 0) {
						return [itemKey, ...found];
					}
				}
			}
			return [];
		};
		return findSelectedKey(menuItems);
	}, [location.pathname, menuItems]);

	return (
		<Sider collapsible collapsed={collapsed} onCollapse={value => setCollapsed(value)}>
			{/* 侧边栏头部：展示租户 logo / 名称 / code，无租户时回退到品牌默认 */}
			<div
				className="h-16 flex items-center gap-2 px-4 border-b border-gray-100 select-none"
				title={tenant ? `${tenant.name}（${tenant.code}）` : undefined}
			>
				{tenant?.logo ? (
					<img
						src={tenant.logo}
						alt={tenant.name}
						className="h-8 w-8 rounded-lg object-cover flex-shrink-0"
					/>
				) : (
					<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF7A00] text-white flex-shrink-0">
						<ClusterOutlined />
					</span>
				)}
				{!collapsed && (
					<div className="flex flex-col leading-tight min-w-0">
						<span className="text-sm font-bold text-gray-900 truncate">
							{tenant?.name ?? "StockFlow"}
						</span>
						<span className="text-[11px] text-gray-400">
							{tenant ? tenant.code : "WMS 管理后台"}
						</span>
					</div>
				)}
			</div>
			<Menu
				theme="light"
				selectedKeys={selectedKeys}
				mode="inline"
				items={menuItems}
				onClick={handleMenuClick}
			/>
		</Sider>
	);
}
