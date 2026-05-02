"use client"

import Link from "next/link"

import { type BoardViewMode, useBoardStore } from "@/util/objects/board"

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

	const handleRenameBoard = async () => {
		const name = prompt("Enter new name")
		if (name) {
			await renameBoard(name)
		}
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
					onClick={handleRenameBoard}
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
				<button className="text-xl button blue-button">
					Share
				</button>
			)}
		</div>
	)
}
