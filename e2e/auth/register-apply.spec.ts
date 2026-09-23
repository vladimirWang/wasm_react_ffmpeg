import { test, expect } from "../fixtures/test";
import { RegisterApplyPage } from "../pages/registerApply.page";

/**
 * 注册流程第一步：提交申请（/#/landing/register）。
 * 完整链路：提交申请 -> 管理员审核 -> 邮件激活链接 -> 激活页设置账号（见 activate.spec.ts）。
 */
test.describe("注册 - 第一步提交申请", () => {
	test("默认展示邮箱与加入已有租户表单", async ({ page }) => {
		const registerPage = new RegisterApplyPage(page);
		await registerPage.goto();

		await expect(registerPage.stepTitle("获取邀请码")).toBeVisible();
		await expect(registerPage.emailInput).toBeVisible();
		await expect(registerPage.joinRadio).toBeVisible();
		await expect(registerPage.tenantCodeInput).toBeVisible();
	});

	test("空表单提交时展示必填校验", async ({ page }) => {
		const registerPage = new RegisterApplyPage(page);
		await registerPage.goto();

		await registerPage.submitButton.click();

		await expect(registerPage.fieldError("请输入邮箱！")).toBeVisible();
		await expect(registerPage.fieldError("请输入租户编码！")).toBeVisible();
	});

	test("邮箱格式非法时给出校验提示", async ({ page }) => {
		const registerPage = new RegisterApplyPage(page);
		await registerPage.goto();

		await registerPage.emailInput.fill("abc");
		await registerPage.emailInput.blur();

		await expect(registerPage.fieldError("请输入有效的邮箱地址！")).toBeVisible();
	});

	test("选择新建租户时切换为租户名称输入框", async ({ page }) => {
		const registerPage = new RegisterApplyPage(page);
		await registerPage.goto();

		await registerPage.chooseCreateTenant();

		await expect(registerPage.tenantNameInput).toBeVisible();
		await expect(registerPage.tenantCodeInput).toHaveCount(0);
	});

	test("点击「已有邀请码，下一步」进入验证邮箱步骤", async ({ page }) => {
		const registerPage = new RegisterApplyPage(page);
		await registerPage.goto();

		await registerPage.goToStepTwo();

		await expect(registerPage.stepTitle("验证邮箱")).toBeVisible();
		await expect(registerPage.inviteCodeInput).toBeVisible();
		await expect(registerPage.verifyCodeInput).toBeVisible();
		await expect(page.getByRole("button", { name: "发送验证码" })).toBeVisible();
	});

	test("新建租户：提交申请成功（写入测试环境数据）", async ({ page }) => {
		const registerPage = new RegisterApplyPage(page);
		await registerPage.goto();

		const suffix = Date.now().toString().slice(-8);
		const email = `e2e.${suffix}@example.com`;
		const tenantName = `E2E租户${suffix}`;

		await registerPage.chooseCreateTenant();
		await registerPage.emailInput.fill(email);
		await registerPage.tenantNameInput.fill(tenantName);

		// 直接拦截后端 sendInviteCode 响应：HTTP 200 + code=200
		const resPromise = page.waitForResponse(
			(r) => r.url().includes("sendInviteCode") && r.status() === 200,
			{ timeout: 20_000 },
		);
		await registerPage.submitButton.click();
		const res = await resPromise;
		const body = (await res.json()) as { code: number; message: string };
		expect(body.code).toBe(200);
		expect(body.message).toContain("申请成功");
	});
});
