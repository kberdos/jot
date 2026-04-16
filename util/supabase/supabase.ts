
import { createClient, type Provider } from "@supabase/supabase-js"

export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const provider = 'google' as Provider


async function login() {
	await supabase.auth.signInWithOAuth({
		provider,
	})
}
