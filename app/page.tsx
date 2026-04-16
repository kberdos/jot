"use client"
import { supabase } from "@/util/supabase/supabase"
import { useEffect } from "react"
import Canvas from "@/components/Canvas"
import { useAuthStore } from "@/util/auth/auth"


export default function Home() {
  const { setUser } = useAuthStore()
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? undefined)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return (
    <div>
      <Canvas />
    </div>
  );
}
