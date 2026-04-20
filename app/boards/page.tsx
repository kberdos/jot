"use client"
import { useAuthStore } from "@/util/auth/auth"
import { Board } from "@/util/objects/board"
import { supabase } from "@/util/supabase/supabase"
import { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

async function getBoards(user: User): Promise<Board[]> {
  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .eq("author", user.id)
  if (error) throw error
  return data as Board[]
}

export default function Home() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [boards, setBoards] = useState<Board[]>([])
  useEffect(() => {
    if (!user) return
    const load = async () => {
      const b = await getBoards(user)
      setBoards(b)
    }
    load()
  }, [user])

  return (
    <>
      {
        user ?
          <div>
            {
              boards.map((b) => {
                return (
                  <div key={b.id} className="">
                    <button
                      onClick={() => router.push(`/boards/${b.id}`)}>
                      {b.name}
                    </button>
                  </div>
                )
              })
            }
          </div>
          :
          <div>sign in to view your boards </div>
      }
    </>
  )
}

