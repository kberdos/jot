"use client"

import { useAuthStore } from "@/util/auth/auth"
import { getNodeOffsets } from "@/util/noteCoordinates"
import { Arrow, GhostArrow, useArrowStore } from "@/util/objects/arrow"
import { useBoardStore } from "@/util/objects/board"
import { useCameraStore } from "@/util/objects/camera"
import { Note, NoteSide, saveNote, useNoteStore } from "@/util/objects/note"
import { handlePointerDown } from "@/util/pointerfunctions"


const NoteObj = ({ note }: { note: Note }) => {
	const updateNote = useNoteStore(state => state.updateNote)
	const camera = useCameraStore(state => state.camera)

	const { board } = useBoardStore()
	const { user } = useAuthStore()
	const { createArrow, addMode, setAddMode, setGhost, ghost } = useArrowStore()

	const handleGhostArrow = (noteSide: NoteSide) => {
		if (addMode === "ACTIVE") {
			const newGhost: GhostArrow = {
				start_note_id: note.id,
				start_note_side: noteSide,
			}
			setGhost(newGhost)
			setAddMode("ADDING")
		} else {
			const arrow: Arrow = {
				id: "",
				board_id: board!.id,
				author_id: user!.id,
				start_note_id: ghost!.start_note_id,
				start_note_side: ghost!.start_note_side,
				end_note_id: note.id,
				end_note_side: noteSide,
			}
			setGhost(undefined)
			setAddMode("NONE")
			createArrow(arrow)
		}
	}

	const ArrowTrigger = (props: { noteSide: NoteSide }) => {
		const { x, y } = getNodeOffsets(note, props.noteSide)

		return (
			<button
				style={{
					position: "absolute",
					left: x - 9,
					top: y - 9
				}}
				className="z-50 rounded-full bg-[var(--blue)] w-5 h-5"
				onPointerDown={(e) => e.stopPropagation()}
				onPointerUp={(e) => e.stopPropagation()}
				onClick={(e) => {
					e.stopPropagation()
					handleGhostArrow(props.noteSide)
				}}
			/>
		)
	}


	const handlePointerUp = (e: React.PointerEvent) => {
		e.currentTarget.releasePointerCapture(e.pointerId)
		saveNote(note)
	}

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
			>
				{addMode !== "NONE" &&
					<div className="relative">
						<ArrowTrigger noteSide="TOP" />
						<ArrowTrigger noteSide="RIGHT" />
						<ArrowTrigger noteSide="LEFT" />
						<ArrowTrigger noteSide="BOTTOM" />
					</div>
				}
			</div>
		</div>
	)
}

export default NoteObj
