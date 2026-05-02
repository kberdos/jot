"use client"
import Overlay from "@/components/Overlay"
import { useAuthStore } from "@/util/auth/auth"
import { Arrow, useArrowStore } from "@/util/objects/arrow"
import { useBoardStore } from "@/util/objects/board"
import { useCameraStore } from "@/util/objects/camera"
import { CollabCursor, useCollabStore } from "@/util/objects/collab"
import { Note, useNoteStore } from "@/util/objects/note"
import { Section, useSectionStore } from "@/util/objects/section"
import { supabase } from "@/util/supabase/supabase"
import { throttle } from "lodash"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

export default function Home() {
  const params = useParams()
  const board_id = String(params.board_id)
  const { setBoard } = useBoardStore()
  const { addNote, deleteNote, loadNotes, updateNote } = useNoteStore()
  const { loadArrows, addArrow, deleteArrow, deleteArrowsForNote, updateArrow } = useArrowStore()
  const { addSection, deleteSection, loadSections, updateSection } = useSectionStore()
  const { user } = useAuthStore()
  const userId = user?.id
  const { camera } = useCameraStore()
  const { upsertCursor } = useCollabStore()
  const [accessState, setAccessState] = useState<"loading" | "ready" | "denied">("loading")

  const cameraRef = useRef(camera)
  useEffect(() => { cameraRef.current = camera }, [camera])

  const userRef = useRef(user)
  useEffect(() => { userRef.current = user }, [user])

  const cursorChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!userId) {
      return
    }

    let isCurrent = true
    let cursorChannel: ReturnType<typeof supabase.channel> | null = null
    let dbChannel: ReturnType<typeof supabase.channel> | null = null
    let handleMouseMove: ((e: MouseEvent) => void) | null = null
    let sendCursor: ReturnType<typeof throttle> | null = null

    const setupBoard = async () => {
      setAccessState("loading")

      try {
        await setBoard(board_id)
        await loadSections(board_id)
        await loadNotes(board_id)
        await loadArrows(board_id)
      } catch {
        if (isCurrent) setAccessState("denied")
        return
      }

      if (!isCurrent) return

      setAccessState("ready")

      cursorChannel = supabase.channel(`board-${board_id}`, {
        config: { broadcast: { self: false } }
      })
      cursorChannelRef.current = cursorChannel

      cursorChannel
        .on('broadcast', { event: 'cursor' }, ({ payload }) => {
          if (payload.user_id === userRef.current?.id) return
          const cursor: Partial<CollabCursor> = {
            user_id: payload.user_id,
            user_email: payload.user_email,
            x: payload.x,
            y: payload.y,
          }
          upsertCursor(cursor)
        })
        .subscribe()

      dbChannel = supabase.channel(`board-db-${board_id}`)

      dbChannel
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'notes', filter: `board_id=eq.${board_id}` },
          ({ eventType, new: newRow, old: oldRow }) => {
            if (eventType === 'DELETE') {
              const noteId = (oldRow as Pick<Note, "id">).id
              if (!noteId) return

              deleteArrowsForNote(noteId)
              deleteNote(noteId)
              return
            }

            const note = newRow as Note
            if (eventType === 'INSERT') {
              if (note.last_modified_by === userRef.current?.id) {
                return
              }
              addNote(note)
            }
            if (eventType === 'UPDATE') {
              updateNote(note.id, note)
            }
            // if (eventType === 'DELETE') removeNote(oldRow.id)
          }
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'arrows', filter: `board_id=eq.${board_id}` },
          ({ eventType, new: newRow, old: oldRow }) => {
            if (eventType === 'DELETE') {
              const arrowId = (oldRow as Pick<Arrow, "id">).id
              if (!arrowId) return

              deleteArrow(arrowId)
              return
            }

            const arrow = newRow as Arrow
            if (eventType === 'INSERT') {
              if (arrow.last_modified_by === userRef.current?.id) {
                return
              }
              addArrow(arrow)
            }
            if (eventType === 'UPDATE') {
              updateArrow(arrow.id, arrow)
            }
            // if (eventType === 'DELETE') removeNote(oldRow.id)
          }
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'sections', filter: `board_id=eq.${board_id}` },
          ({ eventType, new: newRow, old: oldRow }) => {
            if (eventType === 'DELETE') {
              const sectionId = (oldRow as Pick<Section, "id">).id
              if (!sectionId) return

              deleteSection(sectionId)
              return
            }

            const section = newRow as Section
            if (eventType === 'INSERT') {
              if (section.last_modified_by === userRef.current?.id) {
                return
              }
              addSection(section)
            }
            if (eventType === 'UPDATE') {
              updateSection(section.id, section)
            }
          }
        )
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'boards', filter: `id=eq.${board_id}` },
          ({ new: newRow }) => {
            const board = newRow as { id: string; last_modified_by: string | null }
            setBoard(board.id)
          }
        )
        .subscribe()

      sendCursor = throttle((x: number, y: number) => {
        if (!userRef.current || !cursorChannelRef.current) return
        const cam = cameraRef.current
        cursorChannelRef.current.send({
          type: 'broadcast',
          event: 'cursor',
          payload: {
            user_id: userRef.current.id,
            user_email: userRef.current.email,
            x: (x - cam.x) / cam.zoom,
            y: (y - cam.y) / cam.zoom,
          }
        })
        // XXX: this has to be throttled or else realtime usage will spike hard
      }, 500)

      handleMouseMove = (e: MouseEvent) => sendCursor?.(e.clientX, e.clientY)
      window.addEventListener('mousemove', handleMouseMove)
    }

    setupBoard()

    return () => {
      isCurrent = false
      if (handleMouseMove) window.removeEventListener('mousemove', handleMouseMove)
      cursorChannel?.unsubscribe()
      dbChannel?.unsubscribe()
      cursorChannelRef.current = null
      sendCursor?.cancel()
    }
  }, [board_id, userId])

  if (accessState === "denied") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <div className="max-w-[360px] rounded-[8px] border border-[var(--grey)] bg-white p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
          <h1 className="mb-3 text-[32px]">Jot</h1>
          <p className="mb-4 text-xl">You do not have access to this board.</p>
          <Link className="button blue-button inline-block text-xl" href="/">
            Back to boards
          </Link>
        </div>
      </div>
    )
  }

  if (accessState === "loading") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white text-xl">
        Loading board...
      </div>
    )
  }

  return <Overlay />
}
