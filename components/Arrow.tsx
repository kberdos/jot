"use client"
import { getArrow } from "perfect-arrows"
import { Arrow, GhostArrow, useArrowStore } from "@/util/objects/arrow"
import { useEffect, useState } from "react";
import { useNoteStore } from "@/util/objects/note";
import { getNoteCoords } from "@/util/noteCoordinates";
import { useCameraStore } from "@/util/objects/camera";

export interface Coordinate {
	x: number;
	y: number;
}

const ArrowPath = (props: { start: Coordinate, end: Coordinate }) => {
	const padding = 20
	const arrowArr = getArrow(props.start.x, props.start.y, props.end.x, props.end.y, {
		stretch: 0,
		padEnd: padding,
	})
	const [sx, sy, cx, cy, ex, ey, ae] = arrowArr
	const endAngleAsDegrees = ae * (180 / Math.PI)
	return (
		<g stroke="#000" fill="#000" strokeWidth={3}>
			<path d={`M${sx},${sy} Q${cx},${cy} ${ex},${ey}`} fill="none" />
			<polygon
				points="0,-6 12,0, 0,6"
				transform={`translate(${ex},${ey}) rotate(${endAngleAsDegrees})`}
			/>
		</g>
	)
}

function ArrowComponent(props: { arrow: Arrow }) {
	const startNote = useNoteStore(state => state.notes.find(n => n.id === props.arrow.start_note_id))
	const endNote = useNoteStore(state => state.notes.find(n => n.id === props.arrow.end_note_id))
	const start = getNoteCoords(startNote!, props.arrow.start_note_side)
	const end = getNoteCoords(endNote!, props.arrow.end_note_side)
	return <ArrowPath start={start} end={end} />
}

function GhostArrowComponent(props: { ghost: GhostArrow }) {
	const { camera } = useCameraStore()
	const startNote = useNoteStore(state => state.notes.find(n => n.id === props.ghost.start_note_id))
	const start = getNoteCoords(startNote!, props.ghost.start_note_side)
	const [end, setEnd] = useState<Coordinate>({ x: start.x, y: start.y })

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			setEnd({
				x: (e.clientX - camera.x) / camera.zoom,
				y: (e.clientY - camera.y) / camera.zoom,
			})
		}
		window.addEventListener('mousemove', handleMouseMove)
		return () => window.removeEventListener('mousemove', handleMouseMove)
	}, [])

	return <ArrowPath start={start} end={end} />
}

export function ArrowLayer() {
	const arrows = useArrowStore(state => state.arrows)
	const ghost = useArrowStore(state => state.ghost)

	return (
		<svg
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100vw",
				height: "100vh",
				pointerEvents: "none",
				zIndex: 9999,
			}}
			overflow="visible"
		>
			{arrows.map(arrow => <ArrowComponent key={arrow.id} arrow={arrow} />)}
			{ghost && <GhostArrowComponent ghost={ghost} />}
		</svg>
	)
}
