"use client"
import Overlay from "@/components/Overlay"
import { useAuthStore } from "@/util/auth/auth"
import { useArrowStore } from "@/util/objects/arrow"
import { useBoardStore } from "@/util/objects/board"
import { useCameraStore } from "@/util/objects/camera"
import { CollabCursor, useCollabStore } from "@/util/objects/collab"
import { useNoteStore } from "@/util/objects/note"
import { supabase } from "@/util/supabase/supabase"
import { throttle } from "lodash"
import { useParams } from "next/navigation"
import { useEffect, useRef, useMemo } from "react"

export default function Home() {
  const params = useParams()
  const board_id = String(params.board_id)
  const { setBoard } = useBoardStore()
  const { loadNotes } = useNoteStore()
  const { loadArrows } = useArrowStore()
  const { user } = useAuthStore()
  const { camera } = useCameraStore()
  const { newCursor, moveCursor } = useCollabStore()

  const cameraRef = useRef(camera)
  useEffect(() => { cameraRef.current = camera }, [camera])

  const userRef = useRef(user)
  useEffect(() => { userRef.current = user }, [user])

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const sendCursor = useMemo(() => throttle((x: number, y: number) => {
    if (!userRef.current || !channelRef.current) return
    const cam = cameraRef.current
    channelRef.current.send({
      type: 'broadcast',
      event: 'cursor',
      payload: {
        user_id: userRef.current.id,
        x: (x - cam.x) / cam.zoom,
        y: (y - cam.y) / cam.zoom,
      }
    })
  }, 100), [])

  useEffect(() => {
    const channel = supabase.channel(`board-${board_id}`, {
      config: { broadcast: { self: false } }
    })
    channelRef.current = channel

    channel
      .on('broadcast', { event: 'board-hello' }, ({ payload }) => {
        console.log("hello")
        const cursor: CollabCursor = {
          user_id: payload.user_id,
          color: "#00FF00",
          x: 0,
          y: 0,
        }
        newCursor(cursor)
      })
      .on('broadcast', { event: 'cursor' }, ({ payload }) => {
        console.log("move")
        moveCursor(payload.user_id, payload.x, payload.y)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && userRef.current) {
          channel.send({
            type: 'broadcast',
            event: 'board-hello',
            payload: { user_id: userRef.current.id }
          })
        }
      })

    setBoard(board_id)
    loadNotes(board_id).then(() => loadArrows(board_id))

    const handleMouseMove = (e: MouseEvent) => sendCursor(e.clientX, e.clientY)
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      channel.unsubscribe()
      channelRef.current = null
      sendCursor.cancel()
    }
  }, [])

  return <Overlay />
}
