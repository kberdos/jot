"use client"

import { Coordinate, useCameraStore } from "@/util/objects/camera"
import { GhostSection, noteIsInSection, saveSection, Section, useSectionStore } from "@/util/objects/section"
import { toCamera } from "@/util/pointerfunctions"
import { useEffect, useRef, useState } from "react"
import { saveNote, useNoteStore } from "@/util/objects/note"



export const SectionComponent = ({ section }: { section: Section }) => {
	const camera = useCameraStore(state => state.camera)
	const { updateSection, getNotesInSection } = useSectionStore()
	const { notes, updateNote } = useNoteStore()

	const handlePointerDown = (e: React.PointerEvent) => {
		e.stopPropagation()
		e.currentTarget.setPointerCapture(e.pointerId)
	}

	const handlePointerMove = (e: React.PointerEvent) => {
		e.stopPropagation()
		if (e.buttons !== 1) return;
		const dx = e.movementX / camera.zoom;
		const dy = e.movementY / camera.zoom;
		updateSection(section.id, { x: section.x + dx, y: section.y + dy })
		notes
			.filter(note => note.section_id === section.id)
			.forEach(note => updateNote(note.id, { x: note.x + dx, y: note.y + dy }))
	}

	const handlePointerUp = async (e: React.PointerEvent) => {
		e.currentTarget.releasePointerCapture(e.pointerId)

		// assign newly overlapping notes that don't belong to this section yet
		const sweptNotes = notes.filter(note =>
			note.section_id !== section.id && noteIsInSection(note, section)
		)
		sweptNotes.forEach(note => updateNote(note.id, { section_id: section.id }))

		await Promise.all([
			...notes
				.filter(note => note.section_id === section.id)
				.map(note => saveNote(note)),
			...sweptNotes.map(note => saveNote({ ...note, section_id: section.id })),
			saveSection(section)
		])
	}

	return (
		<div style={{
			position: "absolute",
			left: section.x,
			top: section.y,
		}}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
		>
			<div style={{
				backgroundColor: section.color,
				width: `${section.width}px`,
				height: `${section.height}px`,
			}}
			>
			</div>
		</div>
	)
}

export const GhostSectionComponent = (props: { ghostSection: GhostSection }) => {
	const { camera } = useCameraStore()
	const [end, setEnd] = useState<Coordinate>({ x: props.ghostSection.start_x, y: props.ghostSection.start_y })

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			setEnd(toCamera(e, camera))
		}
		window.addEventListener('mousemove', handleMouseMove)
		return () => window.removeEventListener('mousemove', handleMouseMove)
	}, [])

	return (
		<div style={{
			position: 'absolute',
			left: Math.min(props.ghostSection.start_x, end.x),
			top: Math.min(props.ghostSection.start_y, end.y),
			width: Math.abs(end.x - props.ghostSection.start_x),
			height: Math.abs(end.y - props.ghostSection.start_y),
			border: '2px dashed #888',
			pointerEvents: 'none',
		}} />
	)
}
