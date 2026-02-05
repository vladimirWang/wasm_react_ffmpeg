import { createBrowserRouter, type RouteObject, redirect } from "react-router-dom";
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
import VendorView from "../pages/Vendor/VendorView";
import StockIns from "../pages/StockIns/StockIns";
import RouteErrorPage from "../pages/RouteErrorPage";
// import ProductCreate from "../pages/Product/ProductCreate";
// import ProductUpdate from "../pages/Product/ProductUpdate";
const Products = lazy(() => import("../pages/Products"));
const Vendors = lazy(() => import("../pages/Vendors"));
// const VendorDetail = lazy(() => import("../pages/Vendor/VendorDetail"));
const ProductCreate = lazy(() => import("../pages/Product/ProductCreate"));
const ProductUpdate = lazy(() => import("../pages/Product/ProductUpdate"));
const StockInsCreate = lazy(() => import("../pages/StockIn/StockInCreate"));
const StockInsUpdate = lazy(() => import("../pages/StockIn/StockInUpdate"));
const StockInsView = lazy(() => import("../pages/StockIn/StockInView"));
const StockOutCreate = lazy(() => import("../pages/stockOut/StockOutCreate"));
const StockOutView = lazy(() => import("../pages/stockOut/StockOutView"));
const StockOutUpdate = lazy(() => import("../pages/stockOut/StockOutUpdate"));
const StockOuts = lazy(() => import("../pages/StockOuts/StockOuts"));
import { getCurrentUser, type IUser } from "../api/user";
import { useUserStore } from "../store/userStore";

// 用户信息缓存
let cachedUser: IUser | null = null;
let userPromise: Promise<IUser> | null = null;
const CACHE_KEY = "cached_user";
const CACHE_EXPIRY_KEY = "cached_user_expiry";
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 检查是否有登录态
const hasAuth = (): boolean => {
	const token = localStorage.getItem("access_token");
	return !!token;
};

// 从 localStorage 恢复缓存的用户信息
const restoreCachedUser = (): IUser | null => {
	try {
		const cached = localStorage.getItem(CACHE_KEY);
		const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
		if (cached && expiry && Date.now() < Number(expiry)) {
			return JSON.parse(cached);
		}
	} catch (e) {
		console.error("Failed to restore cached user:", e);
	}
	return null;
};

// 保存用户信息到缓存
const saveCachedUser = (user: IUser) => {
	try {
		cachedUser = user;
		localStorage.setItem(CACHE_KEY, JSON.stringify(user));
		localStorage.setItem(CACHE_EXPIRY_KEY, String(Date.now() + CACHE_DURATION));
	} catch (e) {
		console.error("Failed to save cached user:", e);
	}
};

// 清除用户信息缓存
export const clearUserCache = () => {
	cachedUser = null;
	userPromise = null;
	localStorage.removeItem(CACHE_KEY);
	localStorage.removeItem(CACHE_EXPIRY_KEY);
	// 清除 zustand store
	useUserStore.getState().clearUser();
};

// 获取当前用户信息（带缓存）
const fetchCurrentUser = async (): Promise<IUser | null> => {
	// 如果已有缓存的用户信息，直接返回
	if (cachedUser) {
		return cachedUser;
	}

	// 尝试从 localStorage 恢复
	const restored = restoreCachedUser();
	if (restored) {
		cachedUser = restored;
		return cachedUser;
	}

	// 如果已有正在进行的请求，复用该请求
	if (userPromise) {
		try {
			return await userPromise;
		} catch (e) {
			// 请求失败，清除 promise，允许重试
			userPromise = null;
			return null;
		}
	}

	// 发起新请求
	try {
		userPromise = getCurrentUser()
			.then(res => {
				console.log("fetchCurrentUser res: ", res);

				// 检查是否是 IResponse 格式（有 code 和 data）
				if (res && typeof res === "object" && "code" in res && "data" in res) {
					// IResponse 格式
					if (res.code === 200 && res.data) {
						console.log("fetchCurrentUser res.data: ", res.data);
						saveCachedUser(res.data);
						// 更新 zustand store
						useUserStore.getState().setUser(res.data);
						return res.data;
					}
					// 如果 code 不是 200，抛出错误
					const error = new Error(res.message || "Failed to get user");
					(error as any).code = res.code;
					throw error;
				}

				// 检查是否是直接的 user 对象（有 userId 或 email 等用户属性）
				if (res && typeof res === "object" && ("userId" in res || "email" in res || "id" in res)) {
					// 直接的 user 对象
					console.log("fetchCurrentUser direct user object: ", res);
					// 处理字段映射：如果 API 返回的是 userId，需要映射到 id
					const user: IUser = {
						id: (res as any).userId?.toString() || (res as any).id || "",
						email: (res as any).email || "",
						username: (res as any).username,
						createdAt: (res as any).createdAt || new Date().toISOString(),
					};
					saveCachedUser(user);
					// 更新 zustand store
					useUserStore.getState().setUser(user);
					return user;
				}

				// 格式不符合预期
				const error = new Error("Invalid response format");
				(error as any).code = 0;
				throw error;
			})
			.catch(error => {
				// 处理被 reject 的 Promise（来自响应拦截器）
				console.error("getCurrentUser catch error: ", error);

				// 错误可能是对象（来自响应拦截器）或 Error 实例
				const errorCode = error?.code || (error instanceof Error ? 0 : error.code);
				const errorMessage =
					error?.message || (error instanceof Error ? error.message : "获取用户信息失败");

				// 如果是 401 或其他认证错误，清除 token 和缓存
				if (errorCode === 401 || errorCode === 403) {
					localStorage.removeItem("access_token");
					clearUserCache();
				}

				// 抛出统一格式的错误
				const finalError = new Error(errorMessage);
				(finalError as any).code = errorCode;
				throw finalError;
			});

		const user = await userPromise;
		userPromise = null;
		return user;
	} catch (error) {
		userPromise = null;
		console.error("fetchCurrentUser final catch: ", error);
		// 确保错误被正确抛出
		throw error;
	}
};

// 路由守卫 loader
export const authLoader = (meta?: RouteMeta) => {
	return async ({ request }: { request: Request }) => {
		const url = new URL(request.url);
		const pathname = url.pathname;

		// 如果是登录页或注册页，直接放行，避免死循环
		if (pathname === "/landing/login" || pathname === "/landing/register") {
			return null;
		}

		// auth: false 或 'free' 表示无需登录
		if (meta?.auth === false || meta?.auth === "free") {
			return null;
		}

		// 默认需要登录，如果没有 token 则重定向到登录页
		if (!hasAuth()) {
			const currentPath = pathname + url.search;
			const redirectUrl = encodeURIComponent(currentPath);
			return redirect(`/landing/login?redirect=${redirectUrl}`);
		}

		// 验证 token 有效性并获取用户信息（带缓存，避免重复请求）
		try {
			const user = await fetchCurrentUser();
			if (!user) {
				// 获取用户信息失败，可能是 token 无效
				const currentPath = pathname + url.search;
				const redirectUrl = encodeURIComponent(currentPath);
				return redirect(`/landing/login?redirect=${redirectUrl}`);
			}
			// 返回用户信息，可以在组件中通过 useLoaderData 获取
			return { user };
		} catch (error) {
			// 请求失败，重定向到登录页
			console.error("Auth check failed:", error);
			const currentPath = pathname + url.search;
			const redirectUrl = encodeURIComponent(currentPath);
			return redirect(`/landing/login?redirect=${redirectUrl}`);
		}
	};
};

// 扩展路由类型，添加 meta 信息
export interface RouteMeta {
	title?: string; // 菜单标题
	icon?: ReactNode; // 菜单图标
	hidden?: boolean; // 是否在菜单中隐藏
	order?: number; // 菜单排序
	auth?: boolean | "free"; // 是否需要登录，false 或 'free' 表示无需登录
}

export interface ExtendedRouteObject extends Omit<RouteObject, "children"> {
	meta?: RouteMeta;
	children?: ExtendedRouteObject[];
}

// 递归函数：为路由配置添加 loader
const addAuthLoader = (routes: ExtendedRouteObject[]): RouteObject[] => {
	return routes.map(route => {
		const { meta, children, ...rest } = route;
		const newRoute: RouteObject = {
			...rest,
			loader: authLoader(meta),
		};

		if (children) {
			newRoute.children = addAuthLoader(children);
		}

		return newRoute;
	});
};

// 路由配置
export const routeConfig: ExtendedRouteObject[] = [
	{
		path: "/",
		Component: LayoutComponent,
		errorElement: <RouteErrorPage />,
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
					title: "编辑产品",
					hidden: true, // 详情页不在菜单中显示
				},
			},
			{
				path: "product/create",
				Component: ProductCreate,
				meta: {
					title: "新建产品",
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
				Component: VendorView,
				meta: {
					title: "供应商详情",
					hidden: true, // 详情页不在菜单中显示
				},
			},
			{
				path: "vendor/update/:id",
				Component: VendorUpdate,
				meta: {
					title: "编辑供应商",
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
					title: "新建进货记录",
					icon: <DesktopOutlined />,
					order: 4,
					hidden: true,
				},
			},
			{
				path: "stockin/update/:id",
				Component: StockInsUpdate,
				meta: {
					title: "编辑进货记录",
					icon: <DesktopOutlined />,
					order: 4,
					hidden: true,
				},
			},
			{
				path: "stockin/:id",
				Component: StockInsView,
				meta: {
					title: "进货记录详情",
					icon: <DesktopOutlined />,
					order: 4,
					hidden: true,
				},
			},
			{
				path: "stockout",
				Component: StockOuts,
				meta: {
					title: "出货记录",
					icon: <DesktopOutlined />,
					order: 5,
				},
			},
			{
				path: "stockout/create",
				Component: StockOutCreate,
				meta: {
					hidden: true,
					icon: <DesktopOutlined />,
					order: 4,
					title: "新建出货记录",
				},
			},
			{
				path: "stockout/update/:id",
				Component: StockOutUpdate,
				meta: {
					hidden: true,
					icon: <DesktopOutlined />,
					order: 4,
					title: "编辑出货记录",
				},
			},
			{
				path: "stockout/:id",
				Component: StockOutView,
				meta: {
					hidden: true,
					icon: <DesktopOutlined />,
					order: 4,
					title: "出货记录详情",
				},
			},
		],
	},
	{
		path: "/landing",
		Component: Landing,
		errorElement: <RouteErrorPage />,
		meta: {
			auth: "free", // 父路由也需要设置为 free，避免死循环
		},
		children: [
			{
				path: "login",
				Component: Login,
				meta: {
					hidden: true,
					auth: "free",
				},
			},
			{
				path: "register",
				Component: Register,
				meta: {
					hidden: true,
					auth: "free",
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
			auth: "free",
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

// 创建路由（应用 auth loader）
export const router = createBrowserRouter(addAuthLoader(routeConfig));

// 主布局下的子路由（用于面包屑）
const layoutChildren = routeConfig[0].children ?? [];

export type BreadcrumbItem = { key?: string; title: ReactNode; href?: string };

/** 将 pathname 拆成层级路径，如 "/product/123" -> ["/", "/product", "/product/123"] */
function pathnameToHierarchy(pathname: string): string[] {
	const segments = pathname
		.replace(/^\/+|\/+$/g, "")
		.split("/")
		.filter(Boolean);
	const list: string[] = ["/"];
	for (let i = 0; i < segments.length; i++) {
		list.push("/" + segments.slice(0, i + 1).join("/"));
	}
	return list;
}

/** 判断 pathname 是否匹配 route 的完整路径模式（支持 :id 等动态段） */
function pathnameMatchesRoute(path: string | undefined, index: boolean, pathname: string): boolean {
	if (index) return pathname === "/" || pathname === "";
	const normalized = pathname.replace(/^\/+/, "") || "";
	const pathSegs = (path ?? "").split("/").filter(Boolean);
	const nameSegs = normalized.split("/").filter(Boolean);
	if (pathSegs.length !== nameSegs.length) return false;
	return pathSegs.every((seg, i) => seg.startsWith(":") || seg === nameSegs[i]);
}

/** 在扁平子路由中查找匹配 pathname 的路由（优先更长、更具体的 path） */
function findMatchingRoute(
	routes: ExtendedRouteObject[],
	pathname: string
): ExtendedRouteObject | null {
	const candidates = routes.filter(r => {
		if (r.index) return pathname === "/" || pathname === "";
		return pathnameMatchesRoute(r.path, false, pathname);
	});
	if (candidates.length === 0) return null;
	// 优先匹配 path 更长的（更具体）
	candidates.sort((a, b) => (b.path ?? "").length - (a.path ?? "").length);
	return candidates[0];
}

/** 根据 route 的 path 得到面包屑标题（无 meta.title 时的回退） */
function getRouteBreadcrumbTitle(route: ExtendedRouteObject): string {
	if (route.meta?.title) return route.meta.title;
	const p = (route.path ?? "").toLowerCase();
	if (p.includes("create")) return "新建";
	if (p.includes("update")) return "编辑";
	if (p.includes(":id") && p.split("/").filter(Boolean).length <= 2) return "详情";
	// 如 stockin/update/:id 仍显示「编辑」
	return "详情";
}

/**
 * 根据当前 pathname 和主布局子路由配置生成面包屑项
 */
export function getBreadcrumbItems(pathname: string): BreadcrumbItem[] {
	const hierarchy = pathnameToHierarchy(pathname);
	const items: BreadcrumbItem[] = [];
	for (let i = 0; i < hierarchy.length; i++) {
		const path = hierarchy[i];
		const route = findMatchingRoute(layoutChildren, path);
		if (!route) continue;
		const title = getRouteBreadcrumbTitle(route);
		const isLast = i === hierarchy.length - 1;
		items.push({
			key: path,
			title,
			href: isLast ? undefined : path,
		});
	}
	return items.length > 0 ? items : [{ title: "首页", key: "/" }];
}
