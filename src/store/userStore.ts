import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IUser } from "../api/user";

interface UserState {
	user: IUser | null;
	setUser: (user: IUser | null) => void;
	clearUser: () => void;
}

export const useUserStore = create<UserState>()(
	persist(
		(set) => ({
			user: null,
			setUser: (user) => set({ user }),
			clearUser: () => set({ user: null }),
		}),
		{
			name: "user-storage", // localStorage key
		}
	)
);
