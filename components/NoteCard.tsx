"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useAuthStore } from "@/util/auth/auth"
import { getNodeOffsets } from "@/util/noteCoordinates"
import { Arrow, GhostArrow, useArrowStore } from "@/util/objects/arrow"
import { useBoardStore } from "@/util/objects/board"
import { useCameraStore } from "@/util/objects/camera"
import { useChatContextStore } from "@/util/objects/chat"
import { DEFAULT_NOTE_HEIGHT, Note, NoteSide, saveNote, useNoteStore } from "@/util/objects/note"
import { noteIsInSection, useSectionStore } from "@/util/objects/section"
import { handlePointerDown } from "@/util/pointerfunctions"

const NOTE_TEXT_PADDING = 12
const NOTE_AUTHOR_HEIGHT = 22


const NoteObj = ({ note }: { note: Note }) => {
	const updateNote = useNoteStore(state => state.updateNote)
	const activeNoteId = useNoteStore(state => state.activeNoteId)
	const highlightedNoteIds = useNoteStore(state => state.highlightedNoteIds)
	const setActiveNote = useNoteStore(state => state.setActiveNote)
	const camera = useCameraStore(state => state.camera)

	const { board, isChatOpen } = useBoardStore()
	const { user } = useAuthStore()
	const { addNoteContext, noteContextIds } = useChatContextStore()
	const { createArrow, addArrowMode, setAddArrowMode, setGhostArrow, ghostArrow, setActiveArrow } = useArrowStore()
	const { sections, setActiveSection } = useSectionStore()
	const isActive = activeNoteId === note.id
	const isHighlighted = highlightedNoteIds.includes(note.id)
	const isInChatContext = noteContextIds.includes(note.id)
	const [isEditingText, setIsEditingText] = useState(false)
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	const growNoteForText = useCallback(() => {
		const textarea = textareaRef.current
		if (!textarea) return

		textarea.style.height = "auto"
		const nextHeight = Math.max(DEFAULT_NOTE_HEIGHT, textarea.scrollHeight + NOTE_AUTHOR_HEIGHT)
		textarea.style.height = `calc(100% - ${NOTE_AUTHOR_HEIGHT}px)`

		if (nextHeight !== note.height) {
			updateNote(note.id, {
				height: nextHeight,
				last_modified_by: user!.id,
			})
		}
	}, [note.height, note.id, updateNote, user])

	useEffect(() => {
		if (!isEditingText) return

		textareaRef.current?.focus()
		textareaRef.current?.setSelectionRange(note.text.length, note.text.length)
		growNoteForText()
	}, [growNoteForText, isEditingText, note.text.length])

	useEffect(() => {
		growNoteForText()
	}, [growNoteForText, note.text, note.width])

	const handleGhostArrow = (noteSide: NoteSide) => {
		if (addArrowMode === "ACTIVE") {
			const newGhostArrow: GhostArrow = {
				start_note_id: note.id,
				start_note_side: noteSide,
			}
			setGhostArrow(newGhostArrow)
			setAddArrowMode("ADDING")
		} else {
			const arrow: Arrow = {
				id: "",
				board_id: board!.id,
				author_id: user!.id,
				last_modified_by: user!.id,
				start_note_id: ghostArrow!.start_note_id,
				start_note_side: ghostArrow!.start_note_side,
				end_note_id: note.id,
				end_note_side: noteSide,
			}
			setGhostArrow(undefined)
			setAddArrowMode("NONE")
			createArrow(arrow)
		}
	}

	const ArrowTrigger = (props: { noteSide: NoteSide }) => {
		const { x, y } = getNodeOffsets(note, props.noteSide)

		return (
			// XXX: this placement is really sus lol
			<button
				style={{
					position: "absolute",
					left: x - 22,
					top: y - 22
				}}
				className="z-50 w-11 h-11 flex items-center justify-center pointer-events-auto"
				onPointerDown={(e) => e.stopPropagation()}
				onPointerUp={(e) => e.stopPropagation()}
				onClick={(e) => {
					e.stopPropagation()
					setActiveNote(null)
					setActiveArrow(null)
					setActiveSection(null)
					handleGhostArrow(props.noteSide)
				}}
			>
				<span className="rounded-full bg-[var(--blue)] w-5 h-5" />
			</button>
		)
	}


	const handlePointerUp = async (e: React.PointerEvent) => {
		e.currentTarget.releasePointerCapture(e.pointerId)
		// XXX: maybe make this a zustand function
		const currentNote = useNoteStore.getState().notes.find(n => n.id === note.id) ?? note
		const section = sections.find(s => noteIsInSection(currentNote, s))
		const nextNote = {
			...currentNote,
			section_id: section?.id ?? null,
			last_modified_by: user!.id,
		}
		updateNote(note.id, {
			section_id: nextNote.section_id,
			last_modified_by: nextNote.last_modified_by,
		})
		try {
			await saveNote(nextNote)
		} catch (error) {
			console.error("[notes] failed to save note after drag", {
				noteId: note.id,
				error,
			})
		}
	}

	const handlePointerMove = (e: React.PointerEvent) => {
		e.stopPropagation()
		if (isEditingText) return
		if (e.buttons !== 1) return;
		updateNote(note.id, {
			x: note.x + e.movementX / camera.zoom,
			y: note.y + e.movementY / camera.zoom,
			last_modified_by: user!.id,
		})
	}

	return (
		<div style={{
			position: "absolute",
			left: note.x,
			top: note.y,
			zIndex: 500,
		}}
			onPointerDown={(e) => {
				e.stopPropagation()
				setActiveNote(note.id)
				setActiveArrow(null)
				setActiveSection(null)
				handlePointerDown(e)
			}}
			onDoubleClick={(e) => {
				e.stopPropagation()
				setIsEditingText(true)
			}}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
		>
			{isChatOpen && isActive && (
				<button
					style={{
						position: "absolute",
						right: 0,
						top: -34,
					}}
					className="z-[502] rounded-[8px] bg-white px-3 py-2 text-sm shadow-[0_2px_8px_rgba(0,0,0,0.18)] hover:bg-[var(--light-grey)]"
					onPointerDown={(e) => e.stopPropagation()}
					onPointerUp={(e) => e.stopPropagation()}
					onClick={(e) => {
						e.stopPropagation()
						addNoteContext(note.id)
					}}
				>
					{isInChatContext ? "Added" : "Add to chat"}
				</button>
			)}
			<div 
				className={`note ${note.type}`}
				style={{
					// backgroundColor: note.color,
					border: isActive
						? "3px solid var(--blue)"
						: isHighlighted
							? "3px solid #000"
							: "3px solid transparent",
					width: `${note.width}px`,
					height: `${note.height}px`,
					boxSizing: "border-box",
					position: "relative",
				}}
			>
				<textarea
					ref={textareaRef}
					value={note.text}
					readOnly={!isEditingText}
					tabIndex={isEditingText ? 0 : -1}
					spellCheck={false}
					style={{
						color: "#000",
						fontFamily: "Roboto",
						fontSize: "12px",
						fontStyle: "normal",
						fontWeight: 400,
						lineHeight: "normal",
						textAlign: "left",
						background: isEditingText ? "rgba(255, 255, 255, 0.22)" : "transparent",
						border: "none",
						borderRadius: "3px",
						outline: isEditingText ? "1px solid rgba(0, 122, 255, 0.28)" : "none",
						outlineOffset: "-1px",
						resize: "none",
						overflow: "hidden",
						width: "100%",
						height: `calc(100% - ${NOTE_AUTHOR_HEIGHT}px)`,
						padding: `${NOTE_TEXT_PADDING}px`,
						boxSizing: "border-box",
						cursor: isEditingText ? "text" : "default",
						pointerEvents: isEditingText ? "auto" : "none",
						transition: "background 140ms ease, outline-color 140ms ease",
					}}
					onPointerDown={(e) => {
						if (isEditingText) e.stopPropagation()
					}}
					onPointerMove={(e) => {
						if (isEditingText) e.stopPropagation()
					}}
					onPointerUp={(e) => {
						if (isEditingText) e.stopPropagation()
					}}
					onDoubleClick={(e) => {
						e.stopPropagation()
						setIsEditingText(true)
					}}
					onChange={(e) => {
						const text = e.target.value
						updateNote(note.id, { text, last_modified_by: user!.id })
						requestAnimationFrame(growNoteForText)
					}}
					onBlur={() => {
						setIsEditingText(false)
						const currentNote = useNoteStore.getState().notes.find(n => n.id === note.id)
						saveNote({
							...(currentNote ?? { ...note, text: note.text ?? "" }),
							last_modified_by: user!.id,
						})
					}}
				/>
				<div
					style={{
						position: "absolute",
						left: NOTE_TEXT_PADDING,
						right: NOTE_TEXT_PADDING,
						bottom: 8,
						color: "#7B7B7B",
						textAlign: "left",
						fontFamily: "Roboto",
						fontSize: "10px",
						fontStyle: "normal",
						fontWeight: 400,
						lineHeight: "normal",
						pointerEvents: "none",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					{note.author_name}
				</div>
				{addArrowMode !== "NONE" &&
					<div className="absolute inset-0 pointer-events-none">
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
