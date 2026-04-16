"use client"
import Canvas from "@/components/Canvas"
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
    <div className="w-screen h-screen">
      <Canvas />
    </div>
  )
}
