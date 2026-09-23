import { test, expect } from "../fixtures/test";
import { AdminLoginPage } from "../pages/adminLogin.page";
import { getCaptchaText } from "../support/redis";
import { env } from "../support/env";

test.describe("平台管理员登录 /#/admin/login", () => {
	test("页面渲染后管登录表单", async ({ page }) => {
		const adminLoginPage = new AdminLoginPage(page);
		await adminLoginPage.goto();

		await expect(page.getByRole("heading", { name: "后管平台" })).toBeVisible();
		await expect(adminLoginPage.emailInput).toBeVisible();
		await expect(adminLoginPage.passwordInput).toBeVisible();
		await expect(adminLoginPage.captchaInput).toBeVisible();
	});

	test("空表单提交时展示必填校验", async ({ page }) => {
		const adminLoginPage = new AdminLoginPage(page);
		await adminLoginPage.goto();

		await adminLoginPage.submitButton.click();

		await expect(adminLoginPage.fieldError("请输入邮箱")).toBeVisible();
		await expect(adminLoginPage.fieldError("请输入密码")).toBeVisible();
		await expect(adminLoginPage.fieldError("请输入验证码")).toBeVisible();
	});

	test("未注册邮箱登录时给出明确提示", async ({ page }) => {
		const adminLoginPage = new AdminLoginPage(page);
		await adminLoginPage.goto();

		await adminLoginPage.login(`not-exists-${Date.now()}@example.com`, "whatever1", "0000");

		// AdminLogin.loadUserSalt 捕获异常后返回 undefined，页面提示该文案
		await expect(adminLoginPage.toast("邮箱未注册，请确认后重试")).toBeVisible();
	});

	test("管理员账号密码正确时登录成功", async ({ page }) => {
		test.skip(!env.adminEmail || !env.adminPassword, "需设置 E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD");

		const adminLoginPage = new AdminLoginPage(page);
		const captchaId = await adminLoginPage.goto();
		const captchaText = await getCaptchaText(captchaId);
		await adminLoginPage.login(env.adminEmail, env.adminPassword, captchaText);

		await page.waitForURL(/#\/$/);
		const token = await page.evaluate(() => localStorage.getItem("access_token"));
		expect(token).toBeTruthy();
	});
});
