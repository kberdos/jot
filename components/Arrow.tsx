"use client"
import { getArrow } from "perfect-arrows"
import { Arrow, GhostArrow } from "@/util/objects/arrow"
import { useEffect, useState } from "react";
import { useNoteStore } from "@/util/objects/note";
import { getNoteCoords } from "@/util/noteCoordinates";


export interface Coordinate {
	x: number;
	y: number;
}


const ArrowSVG = (props: { start: Coordinate, end: Coordinate }) => {
	const padding = 20
	const arrowArr = getArrow(props.start.x, props.start.y, props.end.x, props.end.y, {
		stretch: 0,
		padEnd: padding,
	})

	const [sx, sy, cx, cy, ex, ey, ae, as, ec] = arrowArr

	const minX = Math.min(sx, cx, ex) - padding
	const minY = Math.min(sy, cy, ey) - padding
	const maxX = Math.max(sx, cx, ex) + padding
	const maxY = Math.max(sy, cy, ey) + padding
	const width = maxX - minX
	const height = maxY - minY

	const endAngleAsDegrees = ae * (180 / Math.PI)

	return (
		<svg
			viewBox={`0 0 ${width} ${height}`}
			style={{
				width,
				height,
				pointerEvents: "none",
				overflow: "visible", // fallback if something clips
			}}
			stroke="#000"
			fill="#000"
			strokeWidth={3}
		>
			<path d={`M${sx},${sy} Q${cx},${cy} ${ex},${ey}`} fill="none" />
			<polygon
				points="0,-6 12,0, 0,6"
				transform={`translate(${ex},${ey}) rotate(${endAngleAsDegrees})`}
			/>
		</svg>
	)
}


export function ArrowComponent(props: { arrow: Arrow }) {
	const startNote = useNoteStore(state => state.notes.find(n => n.id === props.arrow.start_note_id))
	const endNote = useNoteStore(state => state.notes.find(n => n.id === props.arrow.end_note_id))

	const [start, setStart] = useState<Coordinate>(getNoteCoords(startNote!, props.arrow.start_note_side))
	const [end, setEnd] = useState<Coordinate>(getNoteCoords(endNote!, props.arrow.end_note_side))

	useEffect(() => {
		setStart(getNoteCoords(startNote!, props.arrow.start_note_side))
	}, [startNote])
	useEffect(() => {
		setEnd(getNoteCoords(endNote!, props.arrow.end_note_side))
	}, [endNote])

	return (
		<>
			<ArrowSVG start={start} end={end} />
		</>
	)
}


export function GhostArrowComponent(props: { ghost: GhostArrow }) {
	const startNote = useNoteStore(state => state.notes.find(n => n.id === props.ghost.start_note_id))

	const [start, setStart] = useState<Coordinate>(getNoteCoords(startNote!, props.ghost.start_note_side))
	const [end, setEnd] = useState<Coordinate>({ x: start.x, y: start.y })

	useEffect(() => {
		setStart(getNoteCoords(startNote!, props.ghost.start_note_side))
	}, [startNote])

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			setEnd({ x: e.clientX, y: e.clientY })
		}
		window.addEventListener('mousemove', handleMouseMove)
		return () => window.removeEventListener('mousemove', handleMouseMove)
	}, [])

	return (
		<>
			<ArrowSVG start={start} end={end} />
		</>
	)
}
