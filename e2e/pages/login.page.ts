import type { Locator, Page } from "@playwright/test";
import { routes, type ApiEnvelope } from "../support/env";

interface CaptchaPayload {
	image: string;
	captchaId: string;
}

/**
 * 商户端登录页（/#/landing/login）Page Object。
 * 字段 id 来自 antd Form.Item 的 name：email / password / captchaText。
 */
export class LoginPage {
	readonly page: Page;
	readonly emailInput: Locator;
	readonly passwordInput: Locator;
	readonly captchaInput: Locator;
	readonly submitButton: Locator;
	readonly registerLink: Locator;

	constructor(page: Page) {
		this.page = page;
		this.emailInput = page.locator("#email");
		this.passwordInput = page.locator("#password");
		// 验证码 Form.Item 的直接子节点是 Flex，id 被注入到包装元素而非 input，故用 placeholder
		this.captchaInput = page.getByPlaceholder("请输入验证码");
		// antd 会给两个中文字的按钮自动插入空格（「登 录」），用正则兼容
		this.submitButton = page.getByRole("button", { name: /登\s*录/ });
		this.registerLink = page.getByRole("link", { name: "去注册" });
	}

	/** 打开登录页，同时截获本次加载的图形验证码 captchaId */
	async goto(): Promise<string> {
		const captchaPromise = this.page.waitForResponse((r) =>
			r.url().includes("/util/captcha"),
		);
		await this.page.goto(routes.login);
		const response = await captchaPromise;
		if (!response.ok()) {
			throw new Error(`验证码接口返回 ${response.status()}，请确认后端（/nodejs_api 代理目标）已启动`);
		}
		const body = (await response.json()) as ApiEnvelope<CaptchaPayload>;
		if (!body.data) throw new Error("验证码接口未返回 data");
		return body.data.captchaId;
	}

	async fillForm(email: string, password: string, captchaText: string): Promise<void> {
		await this.emailInput.fill(email);
		await this.passwordInput.fill(password);
		await this.captchaInput.fill(captchaText);
	}

	async login(email: string, password: string, captchaText: string): Promise<void> {
		await this.fillForm(email, password, captchaText);
		await this.submitButton.click();
	}

	/** antd message 全局提示（成功/失败） */
	toast(text: string): Locator {
		return this.page.locator(".ant-message").getByText(text);
	}

	/** 表单项校验错误文案 */
	fieldError(text: string): Locator {
		return this.page.locator(".ant-form-item-explain-error").getByText(text);
	}
}
