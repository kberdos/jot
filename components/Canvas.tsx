"use client"

import { useCameraStore } from "@/util/objects/camera"
import { useNoteStore } from "@/util/objects/note"
import { handlePointerDown, handlePointerUp } from "@/util/pointerfunctions"
import NoteObj from "./NoteCard"
import { useBoardStore } from "@/util/objects/board"
import { useAuthStore } from "@/util/auth/auth"
import { useRouter } from "next/navigation"

const ZOOM_MIN = 0.5
const ZOOM_MAX = 3

const Canvas = () => {
	const { camera, setCamera, resetCamera } = useCameraStore()
	const { notes, newNote } = useNoteStore()
	const { board, createBoard } = useBoardStore()
	const { user } = useAuthStore()
	const router = useRouter()


	const handlePointerMove = (e: React.PointerEvent) => {
		if (e.buttons !== 1) return;
		setCamera({
			x: camera.x + e.movementX / camera.zoom,
			y: camera.y + e.movementY / camera.zoom,
		})
	}

	const handleNewBoard = async () => {
		// XXX: allow user to specify name
		const name = "New Board"
		const board = await createBoard(name, user!)
		router.push(`/boards/${board.id}`)
	}

	return (
		<div className="w-full h-full overflow-hidden"
			style={{
				backgroundImage: "radial-gradient(circle, #888, 1px, transparent 1px)",
				backgroundSize: `${30 * camera.zoom}px ${30 * camera.zoom}px`,
				backgroundPosition: `${camera.x % (30 * camera.zoom)}px ${camera.y % (30 * camera.zoom)}px`,
			}}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onWheel={(e) => {
				const zoomFactor = e.deltaY * 0.001
				const newZoom = Math.min(ZOOM_MAX, Math.max(camera.zoom - zoomFactor, ZOOM_MIN))

				setCamera({
					zoom: newZoom,
					x: e.clientX - (e.clientX - camera.x) * (newZoom / camera.zoom),
					y: e.clientY - (e.clientY - camera.y) * (newZoom / camera.zoom),
				})
			}}
		>
			<div style={{
				transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
				transformOrigin: "0 0",
			}}
				className="relative"
			>
				{notes.map(note => (
					<NoteObj key={note.id} note={note} />
				))}
			</div>

			<div style={{
				position: "absolute",
				left: 20,
				bottom: 20,
			}}
				className="h-[50px] bg-white border p-3 text-center"
			>
				{`Camera X: ${Math.round(camera.x * 100) / 100}, Y: ${Math.round(camera.y * 100) / 100}, Zoom: ${Math.round(camera.zoom * 100) / 100}`}
			</div>

			<button style={{
				position: "absolute",
				right: 20,
				bottom: 20,
			}}
				className={`border p-3 transition-opacity duration-500 ${camera.x !== 0 || camera.y !== 0 || camera.zoom !== 1 ? "opacity-100" : "opacity-0 pointer-events-none"
					}`}
				onClick={resetCamera}
				onPointerDown={(e) => e.stopPropagation()}
			>
				Reset View
			</button>

			<div className="absolute top-10 left-1/2 -translate-x-1/2 "
				onPointerDown={(e) => e.stopPropagation()}
			>
				<div className="text-2xl font-normal">
					{board ? board.name : "Untitled Board"}
				</div>
				{user ?
					!board &&
					<button
						className="text-center"
						onClick={handleNewBoard}
					>
						Save
					</button>
					:
					<div>
						Sign in to save
					</div>
				}
			</div>

			<div style={{
				position: "absolute",
				left: 20,
				top: 20,
			}}
			>
				<button
					// XXX: where should new coords be?
					onClick={() => newNote(0, 0)}
					onPointerDown={(e) => e.stopPropagation()}
					className="border p-3"
				>
					New Note
				</button>
			</div>
		</div >
	)
}

export default Canvas
