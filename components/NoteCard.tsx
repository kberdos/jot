"use client"

import { useCameraStore } from "@/util/objects/camera"
import { Note, useNoteStore } from "@/util/objects/note"
import { handlePointerDown, handlePointerUp } from "@/util/pointerfunctions"

const NoteObj = ({ note }: { note: Note }) => {
	const updateNote = useNoteStore(state => state.updateNote)
	const camera = useCameraStore(state => state.camera)

	const handlePointerMove = (e: React.PointerEvent) => {
		e.stopPropagation()
		if (e.buttons !== 1) return;
		updateNote(note.id, {
			x: note.x + e.movementX / camera.zoom,
			y: note.y + e.movementY / camera.zoom,
		})
	}

	return (
		<div style={{
			position: "absolute",
			left: note.x,
			top: note.y,
		}}
			onPointerDown={(e) => {
				e.stopPropagation()
				handlePointerDown(e)
			}}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
		>
			<div style={{
				backgroundColor: note.color,
				width: `${note.width}px`,
				height: `${note.height}px`,
			}}
			/>
		</div>
	)
}

export default NoteObj
