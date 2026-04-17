"use client"
import Overlay from "@/components/Overlay"
import { useBoardStore } from "@/util/objects/board"
import { useParams } from "next/navigation"
import { useEffect } from "react"

export default function Home() {
  const params = useParams()
  const board_id = String(params.board_id)
  const { setBoard } = useBoardStore()

  useEffect(() => {
    setBoard(board_id)
  }, [])

  return (
    <Overlay />
  )
}
