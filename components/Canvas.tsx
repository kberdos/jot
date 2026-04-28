"use client"

import { useCameraStore } from "@/util/objects/camera"
import { saveNote, useNoteStore } from "@/util/objects/note"
import { handlePointerUp, toCamera } from "@/util/pointerfunctions"
import NoteObj from "./NoteCard"
import { useBoardStore } from "@/util/objects/board"
import { useAuthStore } from "@/util/auth/auth"
import { ArrowLayer } from "./Arrow"
import { useArrowStore } from "@/util/objects/arrow"
import CollabLayer from "./Collab"
import { DEFAULT_SECTION_COLOR, GhostSection, noteIsInSection, saveSection, Section, useSectionStore } from "@/util/objects/section"
import { GhostSectionComponent, SectionComponent } from "./Section"
import { useEffect } from "react"

const ZOOM_MIN = 0.5
const ZOOM_MAX = 3


const Canvas = () => {
	const { camera, setCamera, resetCamera } = useCameraStore()
	const { notes, createNote, updateNote } = useNoteStore()
	const { sections } = useSectionStore()
	const { board, renameBoard } = useBoardStore()
	const { setAddArrowMode, setGhostArrow } = useArrowStore()
	const { addSectionMode, setAddSectionMode, ghostSection, setGhostSection, createSection } = useSectionStore()

	const { user } = useAuthStore()


	// panning the camera when dragging
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

	const handlePointerDown = async (e: React.PointerEvent) => {
		const target = e.currentTarget
		if (addSectionMode === "ACTIVE") {
			const coords = toCamera(e, camera)
			const newGhostSection: GhostSection = {
				start_x: coords.x,
				start_y: coords.y,
			}
			setGhostSection(newGhostSection)
			setAddSectionMode("ADDING")
		} else if (addSectionMode === "ADDING") {
			// coords.x, coords.y
			const coords = toCamera(e, camera)
			// ghostSeciton.x, .y have coordinates
			//
			const x = Math.min(ghostSection!.start_x, coords.x)
			const y = Math.min(ghostSection!.start_y, coords.y)
			const width = Math.abs(coords.x - ghostSection!.start_x)
			const height = Math.abs(coords.y - ghostSection!.start_y)

			const section: Section = {
				id: "",
				title: "Untitled Section",
				board_id: board!.id,
				author_id: user!.id,
				color: DEFAULT_SECTION_COLOR,
				x,
				y,
				width,
				height,
			}
			setGhostSection(undefined)
			setAddSectionMode("NONE")
			createSection(section)
			saveSection(section)
			const containedNotes = notes.filter(note => noteIsInSection(note, section))
			containedNotes.forEach(note => updateNote(note.id, { section_id: section.id }))

			await Promise.all([
				saveSection(section),
				...containedNotes.map(note => saveNote({ ...note, section_id: section.id }))
			])
		}
		target.setPointerCapture(e.pointerId)
	}

	// cancel out of all selections, drawings, etc.
	const handleEscape = () => {
		setAddArrowMode("NONE")
		setGhostArrow(undefined)
		setAddSectionMode("NONE")
		setGhostSection(undefined)
	}

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			console.log("Key pressed:", e.key);

			if (e.key === "Escape") { handleEscape() }
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	return (
		<div className="w-full h-full overflow-hidden"
			style={{
				backgroundImage: "radial-gradient(circle, #888, 1px, transparent 1px)",
				backgroundSize: `${30 * camera.zoom}px ${30 * camera.zoom}px`,
				backgroundPosition: `${camera.x % (30 * camera.zoom)}px ${camera.y % (30 * camera.zoom)}px`,
				backgroundColor: "#F5F5F5",
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
				{sections.map(section => (
					<SectionComponent key={section.id} section={section} />
				))}
				<ArrowLayer />
				<CollabLayer />
				{ghostSection &&
					<GhostSectionComponent ghostSection={ghostSection} />
				}

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
				left: 400,
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
				className="absolute left-10 top-30 flex flex-col gap-2 "
			>
				<button
					// XXX: change coords of new note to not be 0, 0 
					onClick={() => {
						const n = createNote(0, 0, board!.id, user!.id)
						const section = sections.find(s => noteIsInSection(n, s))
						if (section) {
							n.section_id = section.id
							updateNote(n.id, { section_id: section.id })
						}
						saveNote(n)
					}}
					onPointerDown={(e) => e.stopPropagation()}
					className="border p-3"
				>
					New Note
				</button>
				<button
					onClick={() => setAddArrowMode("ACTIVE")}
					onPointerDown={(e) => e.stopPropagation()}
					className="border p-3"
				>
					Draw Arrow
				</button>
				<button
					onClick={() => { setAddSectionMode("ACTIVE") }}
					onPointerDown={(e) => e.stopPropagation()}
					className="border p-3"
				>
					Draw Section
				</button>
			</div>
		</div >
	)
}

export default Canvas
