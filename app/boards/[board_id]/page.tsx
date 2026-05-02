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
import { useParams } from "next/navigation"
import { useEffect, useRef, useMemo } from "react"

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

  const cameraRef = useRef(camera)
  useEffect(() => { cameraRef.current = camera }, [camera])

  const userRef = useRef(user)
  useEffect(() => { userRef.current = user }, [user])

  const cursorChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const sendCursor = useMemo(() => throttle((x: number, y: number) => {
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
  }, 500), [])

  useEffect(() => {
    if (!userId) {
      return
    }

    const cursorChannel = supabase.channel(`board-${board_id}`, {
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

    const dbChannel = supabase.channel(`board-db-${board_id}`)

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

    setBoard(board_id)
    loadSections(board_id).then(() => loadNotes(board_id)).then(() => loadArrows(board_id))

    const handleMouseMove = (e: MouseEvent) => sendCursor(e.clientX, e.clientY)
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cursorChannel.unsubscribe()
      dbChannel.unsubscribe()
      cursorChannelRef.current = null
      sendCursor.cancel()
    }
  }, [board_id, userId])

  return <Overlay />
}
