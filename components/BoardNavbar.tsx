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
				<div className="nav-actions">
					<button
						className="text-xl button blue-button nav-icon-button"
						aria-label="Export board data as JSON"
						title="Export board data as JSON"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
						>
							<path
								d="M7.82833 6.65585L10.5 3.97252V15.1608C10.5 15.4703 10.6229 15.767 10.8417 15.9858C11.0605 16.2046 11.3572 16.3275 11.6667 16.3275C11.9761 16.3275 12.2728 16.2046 12.4916 15.9858C12.7104 15.767 12.8333 15.4703 12.8333 15.1608V3.97252L15.505 6.65585C15.6135 6.7652 15.7425 6.85199 15.8847 6.91122C16.0268 6.97045 16.1793 7.00095 16.3333 7.00095C16.4873 7.00095 16.6398 6.97045 16.782 6.91122C16.9242 6.85199 17.0532 6.7652 17.1617 6.65585C17.271 6.54739 17.3578 6.41836 17.417 6.27619C17.4763 6.13402 17.5068 5.98153 17.5068 5.82752C17.5068 5.6735 17.4763 5.52101 17.417 5.37884C17.3578 5.23667 17.271 5.10764 17.1617 4.99918L12.495 0.332516C12.384 0.226302 12.2532 0.143043 12.11 0.0875158C11.826 -0.0291719 11.5074 -0.0291719 11.2233 0.0875158C11.0801 0.143043 10.9493 0.226302 10.8383 0.332516L6.17167 4.99918C6.06289 5.10796 5.9766 5.2371 5.91773 5.37923C5.85886 5.52135 5.82856 5.67368 5.82856 5.82752C5.82856 5.98135 5.85886 6.13368 5.91773 6.27581C5.9766 6.41793 6.06289 6.54707 6.17167 6.65585C6.28044 6.76463 6.40958 6.85092 6.55171 6.90979C6.69383 6.96866 6.84616 6.99896 7 6.99896C7.15384 6.99896 7.30617 6.96866 7.44829 6.90979C7.59042 6.85092 7.71955 6.76463 7.82833 6.65585ZM22.1667 13.9942C21.8572 13.9942 21.5605 14.1171 21.3417 14.3359C21.1229 14.5547 21 14.8514 21 15.1608V19.8275C21 20.1369 20.8771 20.4337 20.6583 20.6525C20.4395 20.8713 20.1428 20.9942 19.8333 20.9942H3.5C3.19058 20.9942 2.89383 20.8713 2.67504 20.6525C2.45625 20.4337 2.33333 20.1369 2.33333 19.8275V15.1608C2.33333 14.8514 2.21042 14.5547 1.99162 14.3359C1.77283 14.1171 1.47609 13.9942 1.16667 13.9942C0.857247 13.9942 0.560501 14.1171 0.341709 14.3359C0.122916 14.5547 0 14.8514 0 15.1608V19.8275C0 20.7558 0.368749 21.646 1.02513 22.3024C1.6815 22.9588 2.57174 23.3275 3.5 23.3275H19.8333C20.7616 23.3275 21.6518 22.9588 22.3082 22.3024C22.9646 21.646 23.3333 20.7558 23.3333 19.8275V15.1608C23.3333 14.8514 23.2104 14.5547 22.9916 14.3359C22.7728 14.1171 22.4761 13.9942 22.1667 13.9942Z"
								fill="black"
							/>
						</svg>

					</button>

					<button
						className="text-xl button blue-button"
						onClick={() => setIsShareDialogOpen(true)}
					>
						Share
					</button>
				</div>
			)}

			{isShareDialogOpen && board && user && (
				<BoardShareDialog
					board={board}
					user={user}
					onClose={() => setIsShareDialogOpen(false)}
				/>
			)}
		</div>
	)
}
