import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { ReactNode, lazy } from "react";
import { PieChartOutlined, DesktopOutlined, TeamOutlined, FileOutlined } from "@ant-design/icons";
import Home from "../pages/Home";
import About from "../pages/About";
import NotFound from "../pages/NotFound";
import Login from "../pages/Login";
import Register from "../pages/Register";
// import Products from "../pages/Products";
// import Vendors from "../pages/Vendors";
// import ProductDetail from "../pages/Product/ProductDetail";
// import VendorDetail from "../pages/VendorDetail";
import Landing from "../pages/Landing";
import { LayoutComponent } from "../layout";
import VendorCreate from "../pages/Vendor/VendorCreate";
import VendorUpdate from "../pages/Vendor/VendorUpdate";
import StockIns from "../pages/StockIns";
// import ProductCreate from "../pages/Product/ProductCreate";
// import ProductUpdate from "../pages/Product/ProductUpdate";
const Products = lazy(() => import("../pages/Products"));
const Vendors = lazy(() => import("../pages/Vendors"));
// const VendorDetail = lazy(() => import("../pages/Vendor/VendorDetail"));
const ProductCreate = lazy(() => import("../pages/Product/ProductCreate"));
const ProductUpdate = lazy(() => import("../pages/Product/ProductUpdate"));
const StockInsCreate = lazy(() => import("../pages/StockIn/StockInCreate"));
const StockInsUpdate = lazy(() => import("../pages/StockIn/StockInUpdate"));

// 扩展路由类型，添加 meta 信息
export interface RouteMeta {
	title?: string; // 菜单标题
	icon?: ReactNode; // 菜单图标
	hidden?: boolean; // 是否在菜单中隐藏
	order?: number; // 菜单排序
}

export interface ExtendedRouteObject extends Omit<RouteObject, "children"> {
	meta?: RouteMeta;
	children?: ExtendedRouteObject[];
}

// 路由配置
export const routeConfig: ExtendedRouteObject[] = [
	{
		path: "/",
		Component: LayoutComponent,
		children: [
			{
				index: true,
				Component: Home,
				meta: {
					title: "仪表盘",
					icon: <PieChartOutlined />,
					order: 1,
				},
			},
			{
				path: "product",
				Component: Products,
				meta: {
					title: "产品",
					icon: <DesktopOutlined />,
					order: 2,
				},
			},
			{
				path: "product/:id",
				Component: ProductUpdate,
				meta: {
					hidden: true, // 详情页不在菜单中显示
				},
			},
			{
				path: "product/create",
				Component: ProductCreate,
				meta: {
					hidden: true, // 详情页不在菜单中显示
				},
			},
			{
				path: "vendor",
				Component: Vendors,
				meta: {
					title: "供应商",
					icon: <TeamOutlined />,
					order: 3,
				},
			},
			{
				path: "vendor/create",
				Component: VendorCreate,
				meta: {
					hidden: true, // 详情页不在菜单中显示
				},
			},
			{
				path: "vendor/:id",
				Component: VendorUpdate,
				meta: {
					hidden: true, // 详情页不在菜单中显示
				},
			},
			{
				path: "stockin",
				Component: StockIns,
				meta: {
					title: "进货记录",
					icon: <DesktopOutlined />,
					order: 4,
				},
			},
			{
				path: "stockin/create",
				Component: StockInsCreate,
				meta: {
					icon: <DesktopOutlined />,
					order: 4,
				},
			},
			{
				path: "stockin/:id",
				Component: StockInsUpdate,
				meta: {
					icon: <DesktopOutlined />,
					order: 4,
				},
			},
		],
	},
	{
		path: "/landing",
		Component: Landing,
		children: [
			{
				path: "login",
				Component: Login,
				meta: {
					hidden: true,
				},
			},
			{
				path: "register",
				Component: Register,
				meta: {
					hidden: true,
				},
			},
		],
	},
	{
		path: "/about",
		Component: About,
		meta: {
			title: "关于",
			icon: <FileOutlined />,
			order: 4,
			hidden: true,
		},
	},
	{
		path: "*",
		Component: NotFound,
		meta: {
			hidden: true,
		},
	},
];

// 创建路由
export const router = createBrowserRouter(routeConfig as RouteObject[]);
