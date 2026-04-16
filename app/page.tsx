"use client"
import { supabase } from "@/util/supabase/supabase"
import { useEffect } from "react"
import Canvas from "@/components/Canvas"
import { login, logout, useAuthStore } from "@/util/auth/auth"

// TODO: make this a component and import it to the slug page as well

export default function Home() {
  const { user, setUser } = useAuthStore()
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? undefined)
      }
    )

    return () => {
      // teardown
      listener.subscription.unsubscribe()
    }
  }, [])


  return (
    <div className="w-screen h-screen">
      <div style={{
        position: "absolute",
        right: 20,
        top: 20,
      }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {user ?
          <>
            <div>
              {`Hello, ${user.email}`}
            </div>
            <button onClick={logout}>
              Sign Out
            </button>
          </>
          :
          <button onClick={login}>
            Sign In
          </button>
        }
      </div>
      <Canvas />
    </div >
  );
}
