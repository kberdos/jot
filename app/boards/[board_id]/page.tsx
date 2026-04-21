"use client"
import Overlay from "@/components/Overlay"
import { useAuthStore } from "@/util/auth/auth"
import { useArrowStore } from "@/util/objects/arrow"
import { useBoardStore } from "@/util/objects/board"
import { useCameraStore } from "@/util/objects/camera"
import { useNoteStore } from "@/util/objects/note"
import { supabase } from "@/util/supabase/supabase"
import { throttle } from "lodash"
import { useParams } from "next/navigation"
import { useEffect } from "react"

export default function Home() {
  const params = useParams()
  const board_id = String(params.board_id)
  const { setBoard } = useBoardStore()
  const { loadNotes } = useNoteStore()
  const { loadArrows } = useArrowStore()
  const { user } = useAuthStore()
  const { camera } = useCameraStore()

  const channel = supabase.channel(`board-${board_id}`)

  channel.on('broadcast', { event: 'cursor' }, ({ payload }) => {
    console.log('received cursor: ', payload)
  })
    .subscribe()

  const sendCursor = throttle((x: number, y: number) => {
    if (!user) return
    channel.send({
      type: 'broadcast',
      event: 'cursor',
      payload: {
        user_id: user.id,
        x: (x - camera.x) / camera.zoom,
        y: (y - camera.y) / camera.zoom,
      }
    })
  }, 1000)


  // need to wait to load arrows after loading notes
  const loadObjects = async () => {
    await loadNotes(board_id)
    await loadArrows(board_id)
  }

  useEffect(() => {
    window.addEventListener('mousemove', (e) => sendCursor(e.clientX, e.clientY))
  })

  useEffect(() => {
    setBoard(board_id)
    loadObjects()
  }, [])

  return (
    <Overlay />
  )
}
