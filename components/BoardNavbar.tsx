"use client"

import Link from "next/link"
import { useState } from "react"

import { type BoardViewMode, useBoardStore } from "@/util/objects/board"
import { useAuthStore } from "@/util/auth/auth"
import BoardShareDialog from "./BoardShareDialog"

const viewButtons: { mode: BoardViewMode; label: string }[] = [
	{ mode: "BOARD", label: "Board" },
	{ mode: "TABLE", label: "Table" },
]

export default function BoardNavbar() {
	const {
		board,
		renameBoard,
		isChatOpen,
		viewMode,
		setViewMode,
	} = useBoardStore()
	const { user } = useAuthStore()
	const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
	const [isRenaming, setIsRenaming] = useState(false)
	const [newName, setNewName] = useState("")



	const handleRenameBoard = async () => {
		if (!newName.trim()) return

		await renameBoard(newName)
		setIsRenaming(false)
		setNewName("")
	}

	return (
		<div className="navbar" onPointerDown={(e) => e.stopPropagation()}>
			<div className="nav-pill">
				<Link href="/" className="nav-logo cursor-pointer hoverable">
					Jot
				</Link>

				<span className="text-xxl">•</span>

				<span
					className="text-xl cursor-pointer hoverable"
					onClick={() => {
						setIsRenaming(true)
						setNewName(board?.name || "")
					}}
				>
					{board?.name || "Jot Design Brainstorm"}
				</span>
			</div>

			<div className="nav-center">
				{viewButtons.map(({ mode, label }) => (
					<button
						key={mode}
						className={`text-xl button shadow-[0_10px_20px_rgba(0,0,0,0.50)] ${viewMode === mode ? "grey-button-active" : "white-button"
							}`}
						onClick={() => setViewMode(mode)}
					>
						{label}
					</button>
				))}
			</div>

			{!isChatOpen && (
				<button
					className="text-xl button blue-button"
					onClick={() => setIsShareDialogOpen(true)}
				>
					Share
				</button>
			)}

			{isShareDialogOpen && board && user && (
				<BoardShareDialog
					board={board}
					user={user}
					onClose={() => setIsShareDialogOpen(false)}
				/>
			)}

			{isRenaming && (
				<div
					className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
					onClick={() => setIsRenaming(false)}
				>
					<div
						className="bg-white rounded-xl shadow-lg p-3 flex items-center gap-2 w-[320px]"
						onClick={(e) => e.stopPropagation()} 
					>
						<input
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							placeholder="Untitled"
							className="flex-1 px-3 py-2 rounded-md border outline-none text-sm"
							style={{
								borderColor: "var(--grey)",
								outline: "none"
							  }}
							autoFocus
							onKeyDown={(e) => {
								if (e.key === "Enter") handleRenameBoard()
							}}
						/>

						<button
							onClick={handleRenameBoard}
							className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-sm"
						>
							Done
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
