import { supabase } from "@/util/supabase/supabase"
import { create } from "zustand"
import { User } from "@supabase/supabase-js"

export async function login() {
	await supabase.auth.signInWithOAuth({
		provider: 'google',
	})
}

export async function logout() {
	await supabase.auth.signOut()
}

interface AuthStore {
	user: User | undefined
	setUser(user: User | undefined): void;
}


export const useAuthStore = create<AuthStore>((set) => ({
	user: undefined,
	setUser: (user: User | undefined) => set(state => ({
		user: user,
	})),
}))
