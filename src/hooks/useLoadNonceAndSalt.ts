import { useState, useEffect } from "react";
import { getUserSaltByEmail } from "../api/user";
import { useUserStore } from "../store/userStore";
import { message } from "antd";
import { adminGetUserSaltByEmail } from "../api/adminUser";
import { getNonce } from "../api/util";

export const useLoadNonceAndSalt = () => {
	const { user } = useUserStore();

	const [nonce, setNonce] = useState<string>();
	const [userSalt, setUserSalt] = useState<string>();

	const loadNonce = async () => {
		const nonce = await getNonce();
		setNonce(nonce);
	};

	const loadNonceAndSalt = async () => {
		if (!user) {
			message.error("用户信息获取异常");
			return;
		}
		const res = await Promise.all([
			getNonce(),
			user.role === "merchant"
				? getUserSaltByEmail(user.email)
				: adminGetUserSaltByEmail(user.email),
		]);
		setNonce(res[0]);
		setUserSalt(res[1]);
	};

	useEffect(() => {
		if (!user || !user.email) return;
		loadNonceAndSalt();
	}, []);

	return { nonce, userSalt, loadNonce };
};
