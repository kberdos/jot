"use client"

import { Coordinate, useCameraStore } from "@/util/objects/camera"
import { GhostSection, Section, useSectionStore } from "@/util/objects/section"
import { toCamera } from "@/util/pointerfunctions"
import { useEffect, useState } from "react"
import { handlePointerDown } from "@/util/pointerfunctions"



export const SectionComponent = ({ section }: { section: Section }) => {
	const camera = useCameraStore(state => state.camera)
	const { updateSection } = useSectionStore()

	const handlePointerUp = (e: React.PointerEvent) => {
		e.currentTarget.releasePointerCapture(e.pointerId)
		// saveSection
	}
	const handlePointerMove = (e: React.PointerEvent) => {
		e.stopPropagation()
		if (e.buttons !== 1) return;
		updateSection(section.id, {
			x: section.x + e.movementX / camera.zoom,
			y: section.y + e.movementY / camera.zoom,
		})
	}

	return (
		<div style={{
			position: "absolute",
			left: section.x,
			top: section.y,
		}}
			onPointerDown={(e) => {
				e.stopPropagation()
				handlePointerDown(e)
			}}
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
