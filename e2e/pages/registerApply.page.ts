import type { Locator, Page } from "@playwright/test";
import { routes } from "../support/env";

/**
 * 注册第一步「获取邀请码 / 提交申请」页（/#/landing/register）Page Object。
 * 对应前端 GetInviteCode 组件；完整链路为：
 * 提交申请 -> 管理员审核 -> 邮件收到激活链接 -> /#/applicant/activate 设置账号。
 */
export class RegisterApplyPage {
	readonly page: Page;
	readonly emailInput: Locator;
	/** 「加入已有租户」单选项 */
	readonly joinRadio: Locator;
	/** 「新建租户」单选项 */
	readonly createRadio: Locator;
	readonly tenantCodeInput: Locator;
	readonly tenantNameInput: Locator;
	readonly submitButton: Locator;
	readonly hasInviteCodeButton: Locator;
	/** 第二步：邀请码输入框 */
	readonly inviteCodeInput: Locator;
	/** 第二步：邮箱验证码输入框 */
	readonly verifyCodeInput: Locator;

	constructor(page: Page) {
		this.page = page;
		this.emailInput = page.locator("#email");
		this.joinRadio = page.locator(".ant-radio-wrapper").filter({ hasText: "加入已有租户" });
		this.createRadio = page.locator(".ant-radio-wrapper").filter({ hasText: "新建租户" });
		this.tenantCodeInput = page.locator("#tenantCode");
		this.tenantNameInput = page.locator("#tenantName");
		this.submitButton = page.getByRole("button", { name: "提交申请" });
		this.hasInviteCodeButton = page.getByRole("button", { name: "已有邀请码，下一步" });
		this.inviteCodeInput = page.locator("#inviteCode");
		// 邮箱验证码被 Space.Compact 包裹，input 无 id，用 placeholder
		this.verifyCodeInput = page.getByPlaceholder("请输入验证码");
	}

	/** Steps 步骤条标题（title 与 description 文案相同，不能直接用 getByText，否则命中多个） */
	stepTitle(text: string): Locator {
		return this.page.locator(".ant-steps-item-title").filter({ hasText: text });
	}

	async goto(): Promise<void> {
		await this.page.goto(routes.register);
	}

	async chooseCreateTenant(): Promise<void> {
		await this.createRadio.click();
	}

	async goToStepTwo(): Promise<void> {
		await this.hasInviteCodeButton.click();
	}

	toast(text: string): Locator {
		return this.page.locator(".ant-message").getByText(text);
	}

	fieldError(text: string): Locator {
		return this.page.locator(".ant-form-item-explain-error").getByText(text);
	}
}
