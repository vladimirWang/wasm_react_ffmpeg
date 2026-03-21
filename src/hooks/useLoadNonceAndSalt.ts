import { useState, useEffect } from "react";
import { getNonce, getUserSaltByEmail } from "../api/user";
import { useUserStore } from "../store/userStore";

export const useLoadNonceAndSalt = () => {
	const { user } = useUserStore();

	const [nonce, setNonce] = useState<string>();
	const [userSalt, setUserSalt] = useState<string>();

	const loadNonce = async () => {
		const nonce = await getNonce();
		setNonce(nonce);
	};

	const loadNonceAndSalt = async () => {
		const res = await Promise.all([getNonce(), getUserSaltByEmail(user.email)]);
		setNonce(res[0]);
		setUserSalt(res[1]);
	};

	useEffect(() => {
		if (!user || !user.email) return;
		loadNonceAndSalt();
	}, []);

	return { nonce, userSalt, loadNonce };
};
