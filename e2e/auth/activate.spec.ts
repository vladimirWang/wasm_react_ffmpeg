import { test, expect } from "../fixtures/test";
import { ActivatePage } from "../pages/activate.page";

/**
 * 申请人激活页（/#/applicant/activate?token=xxx）：
 * 管理员审核通过后，用户从邮件链接进入本页设置用户名和密码。
 */
test.describe("注册 - 激活页设置账号", () => {
	test("缺少 token 参数时给出提示", async ({ page }) => {
		await page.goto("/#/applicant/activate");
		await expect(page.getByText("Token is required")).toBeVisible();
	});

	test("空表单提交时展示必填校验", async ({ page }) => {
		const activatePage = new ActivatePage(page);
		await activatePage.goto("dummy-token");

		await activatePage.submit();

		await expect(activatePage.fieldError("请输入用户名！")).toBeVisible();
		await expect(activatePage.fieldError("请输入密码！")).toBeVisible();
		await expect(activatePage.fieldError("请确认密码！")).toBeVisible();
	});

	test("密码长度不满足 6-8 位时给出规则提示", async ({ page }) => {
		const activatePage = new ActivatePage(page);
		await activatePage.goto("dummy-token");

		await activatePage.fillForm("e2euser", "123", "123");
		await activatePage.submit();

		await expect(
			activatePage.fieldError("密码长度为6-8位，只能包含数字、字母、特殊字符"),
		).toBeVisible();
	});

	test("两次密码不一致时给出提示", async ({ page }) => {
		const activatePage = new ActivatePage(page);
		await activatePage.goto("dummy-token");

		await activatePage.usernameInput.fill("e2euser");
		await activatePage.passwordInput.fill("Test123");
		await activatePage.confirmInput.fill("Test124");
		await activatePage.submit();

		await expect(activatePage.fieldError("两次输入的密码不一致！")).toBeVisible();
	});

	test("使用不存在的 token 提交时后端返回业务错误", async ({ page }) => {
		const activatePage = new ActivatePage(page);
		// token 按原样参与 hash 查询，随机值保证不会命中已使用的真实 token
		const invalidToken = `invalid-token-${Date.now()}`;
		await activatePage.goto(invalidToken);

		await activatePage.fillForm("e2euser", "Test123");

		// 直接拦截 /user/registerByToken 响应：后端对不存在 token 返回
		// HTTP 200 + { code: 10002, message: "token 不存在" }
		const resPromise = page.waitForResponse(
			(r) => r.url().includes("/user/registerByToken") && r.status() === 200,
			{ timeout: 15_000 },
		);
		await activatePage.submit();
		const res = await resPromise;
		const body = (await res.json()) as { code: number; message: string };
		expect(body.code).toBe(10002);
		expect(body.message).toContain("token");
	});
});
