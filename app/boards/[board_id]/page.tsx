"use client"
import Overlay from "@/components/Overlay"
import { useAuthStore } from "@/util/auth/auth"
import { useArrowStore } from "@/util/objects/arrow"
import { useBoardStore } from "@/util/objects/board"
import { useCameraStore } from "@/util/objects/camera"
import { CollabCursor, useCollabStore } from "@/util/objects/collab"
import { Note, useNoteStore } from "@/util/objects/note"
import { supabase } from "@/util/supabase/supabase"
import { throttle } from "lodash"
import { useParams } from "next/navigation"
import { useEffect, useRef, useMemo } from "react"

export default function Home() {
  const params = useParams()
  const board_id = String(params.board_id)
  const { setBoard } = useBoardStore()
  const { loadNotes, updateNote } = useNoteStore()
  const { loadArrows } = useArrowStore()
  const { user } = useAuthStore()
  const { camera } = useCameraStore()
  const { upsertCursor } = useCollabStore()

  const cameraRef = useRef(camera)
  useEffect(() => { cameraRef.current = camera }, [camera])

  const userRef = useRef(user)
  useEffect(() => { userRef.current = user }, [user])

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const sendCursor = useMemo(() => throttle((x: number, y: number) => {
    if (!userRef.current || !channelRef.current) return
    const cam = cameraRef.current
    console.log("send")
    channelRef.current.send({
      type: 'broadcast',
      event: 'cursor',
      payload: {
        user_id: userRef.current.id,
        user_email: userRef.current.email,
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
      .on('broadcast', { event: 'cursor' }, ({ payload }) => {
        console.log("move")
        const cursor: CollabCursor = {
          user_id: payload.user_id,
          user_email: payload.user_email,
          color: "#00FF00",
          x: payload.x,
          y: payload.y,
        }
        upsertCursor(cursor)
      })
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notes', filter: `board_id=eq.${board_id}` },
        ({ eventType, new: newRow, old: oldRow }) => {
          console.log("change?")
          // if (eventType === 'INSERT') addNote(newRow)
          if (eventType === 'UPDATE') updateNote(newRow["id"], newRow as Note)
          // if (eventType === 'DELETE') removeNote(oldRow.id)
        }
      )
      .subscribe()

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
