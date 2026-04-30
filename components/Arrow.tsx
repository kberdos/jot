"use client"
import { getArrow } from "perfect-arrows"
import { Arrow, GhostArrow, useArrowStore } from "@/util/objects/arrow"
import { useEffect, useState } from "react";
import { useNoteStore } from "@/util/objects/note";
import { getNoteCoords } from "@/util/noteCoordinates";
import { Coordinate, useCameraStore } from "@/util/objects/camera";
import { toCamera } from "@/util/pointerfunctions";
import { useSectionStore } from "@/util/objects/section";

const ArrowPath = (props: { start: Coordinate, end: Coordinate, isActive?: boolean, onPointerDown?: (e: React.PointerEvent<SVGGElement>) => void }) => {
	const padding = 20
	const arrowArr = getArrow(props.start.x, props.start.y, props.end.x, props.end.y, {
		stretch: 0,
		padEnd: padding,
	})
	const [sx, sy, cx, cy, ex, ey, ae] = arrowArr
	const endAngleAsDegrees = ae * (180 / Math.PI)
	const color = props.isActive ? "var(--blue)" : "#000"
	return (
		<g
			stroke={color}
			fill={color}
			strokeWidth={props.isActive ? 4 : 3}
			style={{
				cursor: props.onPointerDown ? "pointer" : "default",
				pointerEvents: props.onPointerDown ? "auto" : "none",
			}}
			onPointerDown={props.onPointerDown}
		>
			{props.onPointerDown &&
				<path
					d={`M${sx},${sy} Q${cx},${cy} ${ex},${ey}`}
					fill="none"
					stroke="transparent"
					strokeWidth={18}
					pointerEvents="stroke"
				/>
			}
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
	const setActiveNote = useNoteStore(state => state.setActiveNote)
	const activeArrowId = useArrowStore(state => state.activeArrowId)
	const setActiveArrow = useArrowStore(state => state.setActiveArrow)
	const setActiveSection = useSectionStore(state => state.setActiveSection)

	if (!startNote || !endNote) return null

	const start = getNoteCoords(startNote, props.arrow.start_note_side)
	const end = getNoteCoords(endNote, props.arrow.end_note_side)
	return (
		<ArrowPath
			start={start}
			end={end}
			isActive={activeArrowId === props.arrow.id}
			onPointerDown={(e) => {
				e.stopPropagation()
				setActiveNote(null)
				setActiveArrow(props.arrow.id)
				setActiveSection(null)
			}}
		/>
	)
}

function GhostArrowComponent(props: { ghost: GhostArrow }) {
	const { camera } = useCameraStore()
	const startNote = useNoteStore(state => state.notes.find(n => n.id === props.ghost.start_note_id))
	const start = startNote ? getNoteCoords(startNote, props.ghost.start_note_side) : undefined
	const [end, setEnd] = useState<Coordinate>({ x: start?.x ?? 0, y: start?.y ?? 0 })

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			setEnd(toCamera(e, camera))
		}
		window.addEventListener('mousemove', handleMouseMove)
		return () => window.removeEventListener('mousemove', handleMouseMove)
	}, [])

	if (!start) return null

	return <ArrowPath start={start} end={end} />
}

export function ArrowLayer() {
	const arrows = useArrowStore(state => state.arrows)
	const ghost = useArrowStore(state => state.ghostArrow)

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
