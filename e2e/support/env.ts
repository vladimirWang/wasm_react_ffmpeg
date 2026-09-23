/**
 * E2E 集中配置：所有环境差异（地址、账号、Redis）只在这里读取一次。
 */

export const env = {
	/** 前端站点地址（playwright.config 已注入 baseURL，这里仅给需要直连的场景用） */
	baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:5174",
	/** 后端 API 基址（直连场景用；Vite dev 模式下代理到 /nodejs_api） */
	apiURL: process.env.E2E_API_URL ?? "http://127.0.0.1:4000",
	/**
	 * 后端 Redis：图形验证码答案存在 `captcha:login:{captchaId}`
	 * 默认 16379（repo_backend/.env.test 的 REDIS_URL 指向现有 docker-infrastructure）
	 * 若启用 docker-compose.test.yml 的独立 Redis 则端口为 6380
	 */
	redisUrl: process.env.E2E_REDIS_URL ?? "redis://127.0.0.1:16379",
	/** 商户端测试账号 */
	userEmail: process.env.E2E_USER_EMAIL ?? "",
	userPassword: process.env.E2E_USER_PASSWORD ?? "",
	/** 平台管理员测试账号 */
	adminEmail: process.env.E2E_ADMIN_EMAIL ?? "",
	adminPassword: process.env.E2E_ADMIN_PASSWORD ?? "",
};

/** hash 路由地址（项目使用 createHashRouter，所有路由都在 # 之后） */
export const routes = {
	login: "/#/landing/login",
	register: "/#/landing/register",
	adminLogin: "/#/admin/login",
	activate: (token?: string) =>
		token ? `/#/applicant/activate?token=${encodeURIComponent(token)}` : "/#/applicant/activate",
	dashboard: "/#/dashboard",
};

/** 后端统一响应包装 */
export interface ApiEnvelope<T> {
	code: number;
	message: string;
	data: T | null;
}
