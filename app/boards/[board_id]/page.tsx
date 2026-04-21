"use client"
import Overlay from "@/components/Overlay"
import { useArrowStore } from "@/util/objects/arrow"
import { useBoardStore } from "@/util/objects/board"
import { useNoteStore } from "@/util/objects/note"
import { useParams } from "next/navigation"
import { useEffect } from "react"

export default function Home() {
  const params = useParams()
  const board_id = String(params.board_id)
  const { setBoard } = useBoardStore()
  const { loadNotes } = useNoteStore()
  const { loadArrows } = useArrowStore()

  useEffect(() => {
    setBoard(board_id)
    loadNotes(board_id)
    loadArrows(board_id)
  }, [])

  return (
    <Overlay />
  )
}
