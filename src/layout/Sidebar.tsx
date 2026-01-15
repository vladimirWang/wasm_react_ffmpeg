import { Layout, Menu } from 'antd'
import React, { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { routeConfig } from '../routes'
import { generateMenuItems } from '../utils/routeMenu'

const { Sider } = Layout;

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 从路由配置生成菜单项
  const menuItems = useMemo(() => {
    return generateMenuItems(routeConfig);
  }, []);

  // 处理菜单点击
  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  // 根据当前路径设置选中的菜单项
  const selectedKeys = useMemo(() => {
    const path = location.pathname;
    // 找到匹配的菜单项
    const findSelectedKey = (items: typeof menuItems): string[] => {
      for (const item of items) {
        const itemKey = item.key as string;
        // 精确匹配
        if (itemKey === path) {
          return [itemKey];
        }
        // 路径前缀匹配（处理动态路由的情况，如 /product/123 匹配 /product）
        if (path.startsWith(itemKey + "/") || path === itemKey) {
          if (item.children) {
            const found = findSelectedKey(item.children);
            if (found.length > 0) {
              return [itemKey, ...found];
            }
          }
          // 如果没有子菜单项匹配，返回当前项
          return [itemKey];
        }
        if (item.children) {
          const found = findSelectedKey(item.children);
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
