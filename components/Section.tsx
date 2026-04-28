"use client"

import { Coordinate, useCameraStore } from "@/util/objects/camera"
import { GhostSection } from "@/util/objects/section"
import { toCamera } from "@/util/pointerfunctions"
import { useEffect, useState } from "react"

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
