import { test as base, expect } from "@playwright/test";
import { closeRedis } from "../support/redis";

/**
 * 统一从这里导入 test/expect。
 * Redis 客户端为模块级懒连接（仅读取验证码的用例会触发），
 * worker 结束后统一退出，避免 Node 进程挂住。
 */
export const test = base;

test.afterAll(async () => {
	await closeRedis();
});

export { expect };
