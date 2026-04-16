"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/util/supabase/supabase"

export default function AuthCallback() {
	const router = useRouter()

	useEffect(() => {
		const code = new URLSearchParams(window.location.search).get("code")
		if (!code) return router.push("/")

		supabase.auth.exchangeCodeForSession(code).then(() => {
			router.push("/")
		})
	}, [])

	return <div>Signing in...</div>
}
