"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useCameraStore } from "@/util/objects/camera";
import { saveNote, useNoteStore } from "@/util/objects/note";
import { toCamera } from "@/util/pointerfunctions";
import NoteObj from "./NoteCard";
import { useBoardStore } from "@/util/objects/board";
import { useAuthStore } from "@/util/auth/auth";
import { ArrowLayer } from "./Arrow";
import { useArrowStore } from "@/util/objects/arrow";
import CollabLayer from "./Collab";

import {
	DEFAULT_SECTION_COLOR,
	GhostSection,
	noteIsInSection,
	saveSection,
	Section,
	useSectionStore,
} from "@/util/objects/section";
import { GhostSectionComponent, SectionComponent } from "./Section";
import CanvasToolbar, { CanvasTool } from "./CanvasToolbar";
import { useCanvasGestures } from "./useCanvasGestures";
import { useCanvasHotkeys } from "./useCanvasHotkeys";

const Canvas = () => {
	const { camera, setCamera, resetCamera } = useCameraStore()

	const {
		notes,
		createNote,
		updateNote,
		activeNoteId,
		highlightedNoteIds,
		setActiveNote,
		clearHighlightedNotes,
		deleteNote,
	} = useNoteStore()

	const { sections } = useSectionStore()

	const { board } = useBoardStore()

	const {
		setAddArrowMode,
		setGhostArrow,
		activeArrowId,
		setActiveArrow,
		deleteArrow,
		deleteArrowsForNote,
	} = useArrowStore()

	const {
		addSectionMode,
		activeSectionId,
		highlightedSectionIds,
		setAddSectionMode,
		setActiveSection,
		clearHighlightedSections,
		ghostSection,
		setGhostSection,
		createSection,
		deleteSection,
	} = useSectionStore()

	const { user } = useAuthStore()
	const canvasRef = useRef<HTMLDivElement>(null)
	const cameraRef = useRef(camera)
	const [activeTool, setActiveTool] = useState<CanvasTool>("cursor")


	useEffect(() => {
		cameraRef.current = camera
	}, [camera])

	const {
		handlePointerMove,
		handlePointerUp: handleCanvasPointerUp,
		startTouchPointer,
	} = useCanvasGestures(canvasRef, cameraRef, setCamera)

	const clearSelections = useCallback(() => {
		setActiveNote(null)
		setActiveArrow(null)
		setActiveSection(null)
	}, [setActiveArrow, setActiveNote, setActiveSection])

	const resetToCursor = useCallback(() => {
		clearSelections()
		setActiveTool("cursor")
	}, [clearSelections])

	const clearHighlights = useCallback(() => {
		clearHighlightedNotes()
		clearHighlightedSections()
	}, [clearHighlightedNotes, clearHighlightedSections])

	const handlePointerDown = async (e: React.PointerEvent) => {
		const target = e.currentTarget
		clearSelections()

		if (startTouchPointer(e)) {
			target.setPointerCapture(e.pointerId)
			return
		}

		if (addSectionMode === "ACTIVE") {
			const coords = toCamera(e, cameraRef.current)

			const newGhostSection: GhostSection = {
				start_x: coords.x,
				start_y: coords.y,
			}

			setGhostSection(newGhostSection)
			setAddSectionMode("ADDING")
		} else if (addSectionMode === "ADDING") {
			const coords = toCamera(e, cameraRef.current)

			const x = Math.min(ghostSection!.start_x, coords.x)
			const y = Math.min(ghostSection!.start_y, coords.y)
			const width = Math.abs(coords.x - ghostSection!.start_x)
			const height = Math.abs(coords.y - ghostSection!.start_y)

			const section: Section = {
				id: "",
				title: "Untitled Section",
				board_id: board!.id,
				author_id: user!.id,
				last_modified_by: user!.id,
				color: DEFAULT_SECTION_COLOR,
				x,
				y,
				width,
				height,
			}

			setGhostSection(undefined)
			setAddSectionMode("NONE")
			setActiveTool("cursor") 
			createSection(section)

			const containedNotes = notes.filter((note) =>
				noteIsInSection(note, section),
			)

			containedNotes.forEach((note) =>
				updateNote(note.id, {
					section_id: section.id,
					last_modified_by: user!.id,
				}),
			)

			await Promise.all([
				saveSection(section),
				...containedNotes.map((note) =>
					saveNote({
						...note,
						section_id: section.id,
						last_modified_by: user!.id,
					}),
				),
			])
		}

		target.setPointerCapture(e.pointerId)
	}

	const handleEscape = useCallback(() => {
		resetToCursor()
		clearSelections()
		setAddArrowMode("NONE")
		setGhostArrow(undefined)
		setAddSectionMode("NONE")
		setGhostSection(undefined)
	}, [
		resetToCursor,
		clearSelections,
		setAddArrowMode,
		setGhostArrow,
		setAddSectionMode,
		setGhostSection,
	])

	useCanvasHotkeys({
		activeNoteId,
		activeArrowId,
		activeSectionId,
		updateNote,
		deleteNote,
		deleteArrow,
		deleteSection,
		deleteArrowsForNote,
		board,
		user,
		handleEscape,
	})

	return (
		<div
			ref={canvasRef}
			className="w-full h-full overflow-hidden"
			style={{
				backgroundColor: "var(--light-grey)",
				backgroundImage: "radial-gradient(circle, #888, 1px, transparent 1px)",
				backgroundSize: `${30 * camera.zoom}px ${30 * camera.zoom}px`,
				backgroundPosition: `${camera.x % (30 * camera.zoom)}px ${camera.y % (30 * camera.zoom)
					}px`,
				touchAction: "none",
			}}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handleCanvasPointerUp}
			onPointerCancel={handleCanvasPointerUp}
		>
			<div
				style={{
					transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
					transformOrigin: "0 0",
				}}
				className="relative"
			>
				{notes.map((note) => (
					<NoteObj key={note.id} note={note} setActiveTool={setActiveTool}/>
				))}

				{sections.map((section) => (
					<SectionComponent key={section.id} section={section} />
				))}

				<ArrowLayer />
				<CollabLayer />

				{ghostSection && (
					<GhostSectionComponent ghostSection={ghostSection} />
				)}
			</div>

			{/* <div
				style={{
					position: "absolute",
					left: 20,
					bottom: 20,
				}}
				className="h-[50px] bg-white border p-3 text-center"
			>
				{`Camera X: ${Math.round(camera.x * 100) / 100}, Y: ${Math.round(camera.y * 100) / 100
					}, Zoom: ${Math.round(camera.zoom * 100) / 100}`}
			</div> */}

			{/* <button
				style={{
					position: "absolute",
					left: 400,
					bottom: 20,
				}}
				className={`border p-3 transition-opacity duration-500 ${camera.x !== 0 || camera.y !== 0 || camera.zoom !== 1
					? "opacity-100"
					: "opacity-0 pointer-events-none"
					}`}
				onClick={resetCamera}
				onPointerDown={(e) => e.stopPropagation()}
			>
				Reset View
			</button> */}

			{(highlightedNoteIds.length > 0 || highlightedSectionIds.length > 0) && (
				<button
					style={{
						position: "absolute",
						left: "50%",
						bottom: 20,
						transform: "translateX(-50%)",
					}}
					className="px-6 py-3 bg-white border border-[var(--grey)] rounded-[8px] text-xl shadow-[0_4px_10px_rgba(0,0,0,0.18)] hover:bg-[var(--light-grey)]"
					onClick={clearHighlights}
					onPointerDown={(e) => e.stopPropagation()}
				>
					Stop Highlighting
				</button>
			)}

			<CanvasToolbar
				activeTool={activeTool}
				setActiveTool={setActiveTool}
				clearSelections={clearSelections}
				resetToCursor={resetToCursor}
				setAddArrowMode={setAddArrowMode}
				setAddSectionMode={setAddSectionMode}
				canvasRef={canvasRef}
				camera={camera}
				board={board}
				user={user}
				createNote={createNote}
			/>

		</div>
	)
}

export default Canvas
