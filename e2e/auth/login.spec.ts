import { test, expect } from "../fixtures/test";
import { LoginPage } from "../pages/login.page";
import { getCaptchaText } from "../support/redis";
import { env, routes } from "../support/env";

test.describe("商户端登录 /#/landing/login", () => {
	test("页面渲染登录表单", async ({ page }) => {
		await new LoginPage(page).goto();

		await expect(page.getByRole("heading", { name: "账号登录" })).toBeVisible();
		const loginPage = new LoginPage(page);
		await expect(loginPage.emailInput).toBeVisible();
		await expect(loginPage.passwordInput).toBeVisible();
		await expect(loginPage.captchaInput).toBeVisible();
		await expect(loginPage.submitButton).toBeVisible();
		await expect(loginPage.registerLink).toBeVisible();
	});

	test("空表单提交时展示必填校验", async ({ page }) => {
		const loginPage = new LoginPage(page);
		await loginPage.goto();

		await loginPage.submitButton.click();

		await expect(loginPage.fieldError("请输入邮箱")).toBeVisible();
		await expect(loginPage.fieldError("请输入密码")).toBeVisible();
		await expect(loginPage.fieldError("请输入验证码")).toBeVisible();
	});

	test("未登录访问受保护页面时重定向到登录页", async ({ page }) => {
		await page.goto(routes.dashboard);
		await expect(page).toHaveURL(/\/#\/landing\/login/);
	});

	test("未注册邮箱登录时提示邮箱错误（流程在取 salt 阶段终止，不消费验证码）", async ({ page }) => {
		const loginPage = new LoginPage(page);
		await loginPage.goto();

		await loginPage.login(`not-exists-${Date.now()}@example.com`, "whatever1", "0000");

		// 后端 /user/getSalt 对不存在邮箱返回「邮箱未注册」，由响应拦截器统一弹错
		await expect(loginPage.toast("邮箱未注册")).toBeVisible();
		await expect(page).toHaveURL(/#\/landing\/login/);
	});

	test("账号密码正确时登录成功并跳转首页", async ({ page }) => {
		test.skip(!env.userEmail || !env.userPassword, "需设置 E2E_USER_EMAIL / E2E_USER_PASSWORD");

		const loginPage = new LoginPage(page);
		const captchaId = await loginPage.goto();
		const captchaText = await getCaptchaText(captchaId);
		await loginPage.login(env.userEmail, env.userPassword, captchaText);

		await page.waitForURL(/#\/$/);
		const token = await page.evaluate(() => localStorage.getItem("access_token"));
		expect(token).toBeTruthy();
		await expect(page.getByText("仪表盘").first()).toBeVisible();
	});
});
