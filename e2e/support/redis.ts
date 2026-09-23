import { createClient, type RedisClientType } from "@redis/client";
import { env } from "./env";

/**
 * 测试专用 Redis 访问：
 * 后端 generateCaptchaHandler 会把图形验证码答案以
 * `captcha:login:{captchaId}` 写入 Redis（5 分钟过期），
 * E2E 无法识别图片，直接从 Redis 读取答案。
 */

let clientPromise: Promise<RedisClientType> | null = null;

function getClient(): Promise<RedisClientType> {
	const existing = clientPromise;
	if (existing) return existing;
	const client = createClient({ url: env.redisUrl }) as RedisClientType;
	const connecting = client.connect().then(() => client);
	clientPromise = connecting;
	return connecting;
}

/** 按 captchaId 读取图形验证码答案（小写） */
export async function getCaptchaText(captchaId: string): Promise<string> {
	const client = await getClient();
	const text = await client.get(`captcha:login:${captchaId}`);
	if (!text) {
		throw new Error(`Redis 中未找到验证码，captchaId=${captchaId}，请确认 E2E_REDIS_URL 指向测试环境 Redis`);
	}
	return text;
}

export async function closeRedis(): Promise<void> {
	if (!clientPromise) return;
	const client = await clientPromise;
	await client.quit();
	clientPromise = null;
}
