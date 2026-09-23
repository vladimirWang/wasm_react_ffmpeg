import type { Locator, Page } from "@playwright/test";
import { routes } from "../support/env";

/**
 * 申请人激活页（/#/applicant/activate?token=xxx）Page Object。
 * 审核通过后用户从邮件链接进入，设置用户名和密码，对应后端 /user/registerByToken。
 */
export class ActivatePage {
	readonly page: Page;
	readonly usernameInput: Locator;
	readonly passwordInput: Locator;
	readonly confirmInput: Locator;
	readonly submitButton: Locator;

	constructor(page: Page) {
		this.page = page;
		// antd Form 设置了 name="activate-register"，字段 id 会带表单名前缀
		this.usernameInput = page.locator("#activate-register_username");
		this.passwordInput = page.locator("#activate-register_password");
		this.confirmInput = page.locator("#activate-register_confirm");
		// antd 会给两个中文字的按钮自动插入空格（「提 交」），用正则兼容
		this.submitButton = page.getByRole("button", { name: /提\s*交/ });
	}

	async goto(token?: string): Promise<void> {
		await this.page.goto(routes.activate(token));
	}

	async fillForm(username: string, password: string, confirm?: string): Promise<void> {
		await this.usernameInput.fill(username);
		await this.passwordInput.fill(password);
		await this.confirmInput.fill(confirm ?? password);
	}

	async submit(): Promise<void> {
		await this.submitButton.click();
	}

	toast(text: string): Locator {
		return this.page.locator(".ant-message").getByText(text);
	}

	fieldError(text: string): Locator {
		return this.page.locator(".ant-form-item-explain-error").getByText(text);
	}
}
