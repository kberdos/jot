"use client"

import { useCameraStore } from "@/util/objects/camera"
import { useNoteStore } from "@/util/objects/note"
import { handlePointerDown, handlePointerUp } from "@/util/pointerfunctions"
import NoteObj from "./NoteCard"
import { useBoardStore } from "@/util/objects/board"
import { useAuthStore } from "@/util/auth/auth"
import { ArrowLayer } from "./Arrow"
import { useArrowStore } from "@/util/objects/arrow"
import CollabLayer from "./Collab"

const ZOOM_MIN = 0.5
const ZOOM_MAX = 3


const Canvas = () => {
	const { camera, setCamera, resetCamera } = useCameraStore()
	const { notes, newNote } = useNoteStore()
	const { board, renameBoard } = useBoardStore()
	const { arrows, setAddMode, ghost } = useArrowStore()

	const { user } = useAuthStore()


	const handlePointerMove = (e: React.PointerEvent) => {
		if (e.buttons !== 1) return;
		setCamera({
			x: camera.x + e.movementX / camera.zoom,
			y: camera.y + e.movementY / camera.zoom,
		})
	}


	const handleRenameBoard = async () => {
		let name = prompt("Enter new name")
		if (name) {
			console.log(name)
			await renameBoard(name)
		}
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
				<ArrowLayer />
				<CollabLayer />

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
					{board &&
						<>
							<div>
								{board.name}
							</div>
							<button onClick={() => handleRenameBoard()}>
								Rename
							</button>
						</>
					}
				</div>
			</div>

			<div
				className="absolute left-10 top-10 flex flex-col gap-2 "
			>
				<button
					// XXX: change coords of new note to not be 0, 0 
					onClick={() => newNote(0, 0, board!.id, user!.id)}
					onPointerDown={(e) => e.stopPropagation()}
					className="border p-3"
				>
					New Note
				</button>
				<button
					// XXX: change coords of new note to not be 0, 0 
					onClick={() => setAddMode("ACTIVE")}
					onPointerDown={(e) => e.stopPropagation()}
					className="border p-3"
				>
					Draw Arrow
				</button>
			</div>
		</div >
	)
}

export default Canvas
