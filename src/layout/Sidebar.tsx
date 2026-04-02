import { Layout, Menu } from "antd";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { adminRouteConfig, routeConfig } from "../routes";
import { useUserStore } from "../store/userStore";
import { generateMenuItems } from "../utils/routeMenu";

const { Sider } = Layout;

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const role = useUserStore((s) => s.user?.role);
  const isAdmin = role === "admin";

  // 从路由配置生成菜单项
  const menuItems = useMemo(() => {
    return generateMenuItems(isAdmin ? adminRouteConfig : routeConfig);
  }, [isAdmin]);

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
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
    >
      <div className="demo-logo-vertical" />
      <Menu
        theme="dark"
        selectedKeys={selectedKeys}
        mode="inline"
        items={menuItems}
        onClick={handleMenuClick}
      />
    </Sider>
  )
}
