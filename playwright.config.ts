import { defineConfig, devices } from "@playwright/test";

/**
 * E2E 环境变量（均有默认值，可用 shell 环境变量覆盖）：
 * - E2E_BASE_URL    前端地址，默认本地 Vite dev server（http://127.0.0.1:5174）
 *                   指向测试/远端部署时例如：http://localhost:8080
 * - E2E_API_URL     后端 API 基址，默认 http://127.0.0.1:4000（Hono 直接监听端口）
 *                   Vite dev 模式下由 /nodejs_api 代理到此地址
 * - E2E_REDIS_URL   后端 Redis，用于 E2E 直连读取图形验证码答案
 *                   默认 16379（与 repo_backend/.env.test 的 REDIS_URL 一致）
 *                   若启用 docker-compose.test.yml 的独立 Redis 端口为 6380
 * - E2E_USER_EMAIL / E2E_USER_PASSWORD         商户端已激活账号（登录 happy path 用）
 * - E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD       平台管理员账号（后管登录 happy path 用）
 *
 * 启动方式：
 *   后端（常驻进程，脱离 shell）：
 *     cd repo_backend && bash scripts/start-backend-test-daemon.sh
 *     停止：pkill -f "bun run src/index.ts"
 *   前端：Playwright webServer 自动拉起 Vite dev server
 *
 * 前提：后端依赖的 MySQL(13306) + Redis(16379) + RabbitMQ(5672)
 *       需由 docker-infrastructure compose 提前启动。
 * 若 E2E_BASE_URL 指向 8080/9443 等已部署地址，则自动跳过拉起。
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:5174";
const apiURL = process.env.E2E_API_URL ?? "http://127.0.0.1:4000";
const isLocalDev = /https?:\/\/(127\.0\.0\.1|localhost):(5174|4000)/.test(baseURL);

// storageState 文件路径；setup 项目一定会生成（无可用账号时写入空状态）
const authStateFile = "playwright/.auth/user.json";

// 后端启动 wrapper：double-fork 让后端脱离 Playwright 进程组，
// wrapper 立即退出 → Playwright 后续杀 wrapper 时后端已不在进程组里。
const backendWrapper = "cd ../repo_backend && bash scripts/start-backend-test-daemon.sh";

export default defineConfig({
	testDir: "./e2e",
	expect: { timeout: 10_000 },
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: 1,
	reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
	use: {
		baseURL,
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
	},
	projects: [
		{ name: "setup", testMatch: /auth\.setup\.ts/ },
		{ name: "chromium", testMatch: /e2e\/auth\/.*\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
		{
			name: "authenticated-chromium",
			testMatch: /e2e\/authenticated\/.*\.spec\.ts/,
			dependencies: ["setup"],
			use: { ...devices["Desktop Chrome"], storageState: authStateFile },
		},
	],
	webServer: isLocalDev
		? [
				{
					command: "pnpm dev",
					url: baseURL,
					timeout: 60_000,
					reuseExistingServer: true,
					stderr: "pipe",
				},
				{
					command: backendWrapper,
					url: `${apiURL}/ping`,
					timeout: 60_000,
					reuseExistingServer: true,
				},
			]
		: undefined,
});
