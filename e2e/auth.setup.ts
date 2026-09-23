import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { test as setup } from "@playwright/test";
import { LoginPage } from "./pages/login.page";
import { closeRedis, getCaptchaText } from "./support/redis";
import { env } from "./support/env";

/**
 * 全局登录前置：
 * 通过 UI 完成一次商户端登录（图形验证码答案直接从测试环境 Redis 读取），
 * 保存 storageState 供 authenticated-chromium 项目复用。
 *
 * 未配置 E2E_USER_EMAIL / E2E_USER_PASSWORD 时写入空登录态并跳过，
 * 不阻塞认证类用例（login/register）执行。
 */
const authFile = "playwright/.auth/user.json";

setup("登录并保存 storageState", async ({ page }) => {
	if (!env.userEmail || !env.userPassword) {
		mkdirSync(dirname(authFile), { recursive: true });
		writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }));
		setup.skip(true, "未设置 E2E_USER_EMAIL / E2E_USER_PASSWORD，跳过登录态准备");
	}

	const loginPage = new LoginPage(page);
	const captchaId = await loginPage.goto();
	const captchaText = await getCaptchaText(captchaId);
	await loginPage.login(env.userEmail, env.userPassword, captchaText);

	// 登录成功后跳转首页 /#/
	await page.waitForURL(/#\/$/);
	await page.context().storageState({ path: authFile });
	await closeRedis();
});
