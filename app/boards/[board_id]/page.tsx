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


  // need to wait to load arrows after loading notes
  const loadObjects = async () => {
    await loadNotes(board_id)
    await loadArrows(board_id)
  }

  useEffect(() => {
    setBoard(board_id)
    loadObjects()
  }, [])

  return (
    <Overlay />
  )
}
