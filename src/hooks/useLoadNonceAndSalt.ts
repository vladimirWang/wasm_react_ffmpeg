import { useState, useEffect } from "react";
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
		// 商户用户密码由 SSO 管理，无本地 salt；仅管理员加载本地 salt
		if (user.role === "merchant") {
			const nonce = await getNonce();
			setNonce(nonce);
			setUserSalt(undefined);
			return;
		}
		const res = await Promise.all([
			getNonce(),
			adminGetUserSaltByEmail(user.email),
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
