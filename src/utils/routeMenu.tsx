import { ReactNode } from "react";
import type { MenuProps } from "antd";
import { ExtendedRouteObject } from "../routes";

type MenuItem = Required<MenuProps>["items"][number];

/**
 * 从路由配置中提取菜单项
 * @param routes 路由配置数组
 * @param parentPath 父路径，用于构建完整路径
 * @returns 菜单项数组
 */
export function generateMenuItems(
  routes: ExtendedRouteObject[],
  parentPath: string = ""
): MenuItem[] {
  const menuItems: MenuItem[] = [];

  routes.forEach((route) => {
    // 跳过隐藏的路由
    if (route.meta?.hidden) {
      return;
    }

    // 构建完整路径
    // 处理 index 路由（path 为 undefined）
    let fullPath: string;
    if (route.index) {
      // index 路由使用父路径
      fullPath = parentPath || "/";
    } else if (route.path) {
      // 普通路由
      fullPath = parentPath
        ? `${parentPath}/${route.path}`.replace(/\/+/g, "/")
        : route.path;
    } else {
      // 没有 path 的路由，使用父路径
      fullPath = parentPath || "/";
    }

    // 如果有子路由，递归处理
    if (route.children && route.children.length > 0) {
      const childrenMenuItems = generateMenuItems(route.children, fullPath);
      
      // 如果当前路由有 meta 信息，创建父菜单项
      if (route.meta?.title) {
        menuItems.push({
          key: fullPath,
          icon: route.meta.icon,
          label: route.meta.title,
          children: childrenMenuItems.length > 0 ? childrenMenuItems : undefined,
        });
      } else {
        // 如果没有 meta 信息，直接添加子菜单项
        menuItems.push(...childrenMenuItems);
      }
    } else if (route.meta?.title) {
      // 叶子节点且有 meta 信息，创建菜单项
      menuItems.push({
        key: fullPath,
        icon: route.meta.icon,
        label: route.meta.title,
      });
    }
  });

  // 按 order 排序
  return menuItems.sort((a, b) => {
    const aRoute = findRouteByPath(routes, a.key as string);
    const bRoute = findRouteByPath(routes, b.key as string);
    const aOrder = aRoute?.meta?.order ?? 999;
    const bOrder = bRoute?.meta?.order ?? 999;
    return aOrder - bOrder;
  });
}

/**
 * 根据路径查找路由配置
 */
function findRouteByPath(
  routes: ExtendedRouteObject[],
  path: string,
  parentPath: string = ""
): ExtendedRouteObject | null {
  for (const route of routes) {
    let fullPath: string;
    if (route.index) {
      fullPath = parentPath || "/";
    } else if (route.path) {
      fullPath = parentPath
        ? `${parentPath}/${route.path}`.replace(/\/+/g, "/")
        : route.path;
    } else {
      fullPath = parentPath || "/";
    }

    if (fullPath === path) {
      return route;
    }

    if (route.children) {
      const found = findRouteByPath(route.children, path, fullPath);
      if (found) {
        return found;
      }
    }
  }
  return null;
}
