export async function sha256(str: string) {
	const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
	return Array.from(new Uint8Array(hashBuffer))
		.map(b => b.toString(16).padStart(2, "0")) // 转小写十六进制（和后端一致）
		.join("");
}

export async function hashPassword(password: string, nonce: string, salt: string) {
	if (!salt || !nonce) {
		throw new Error("salt或nonce不能为空");
	}
	// 第一步：和注册逻辑一致，计算 password + "_" + salt 的哈希
	const passwordWithSalt = `${password}_${salt}`;

	const hash1 = await sha256(passwordWithSalt);

	// 第二步：拼接nonce，计算最终哈希（和后端对齐）
	const hashWithNonce = `${hash1}_${nonce}`;

	const hash2 = await sha256(hashWithNonce);

	return hash2;
}
