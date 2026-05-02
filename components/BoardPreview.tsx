"use client"

import { useId } from "react"
import { Arrow } from "@/util/objects/arrow"
import { Note } from "@/util/objects/note"
import { Section } from "@/util/objects/section"

export type BoardPreviewData = {
	notes: Note[]
	sections: Section[]
	arrows: Arrow[]
}

const PREVIEW_WIDTH = 320
const PREVIEW_HEIGHT = 180
const PREVIEW_PADDING = 26

const noteFill = (type: Note["type"]) =>
	type === "question" ? "var(--light-pink)" : "var(--light-yellow)"

const getNoteCenter = (note: Note) => ({
	x: note.x + note.width / 2,
	y: note.y + note.height / 2,
})

const getBounds = (data: BoardPreviewData) => {
	const boxes = [
		...data.sections.map((section) => ({
			minX: section.x,
			minY: section.y,
			maxX: section.x + section.width,
			maxY: section.y + section.height,
		})),
		...data.notes.map((note) => ({
			minX: note.x,
			minY: note.y,
			maxX: note.x + note.width,
			maxY: note.y + note.height,
		})),
	]

	if (boxes.length === 0) return null

	return boxes.reduce(
		(bounds, box) => ({
			minX: Math.min(bounds.minX, box.minX),
			minY: Math.min(bounds.minY, box.minY),
			maxX: Math.max(bounds.maxX, box.maxX),
			maxY: Math.max(bounds.maxY, box.maxY),
		}),
		boxes[0],
	)
}

const getPreviewTransform = (data: BoardPreviewData) => {
	const bounds = getBounds(data)

	if (!bounds) {
		return {
			scale: 1,
			x: PREVIEW_WIDTH / 2,
			y: PREVIEW_HEIGHT / 2,
		}
	}

	const boardWidth = Math.max(1, bounds.maxX - bounds.minX)
	const boardHeight = Math.max(1, bounds.maxY - bounds.minY)
	const scale = Math.min(
		(PREVIEW_WIDTH - PREVIEW_PADDING * 2) / boardWidth,
		(PREVIEW_HEIGHT - PREVIEW_PADDING * 2) / boardHeight,
	)

	return {
		scale,
		x: (PREVIEW_WIDTH - boardWidth * scale) / 2 - bounds.minX * scale,
		y: (PREVIEW_HEIGHT - boardHeight * scale) / 2 - bounds.minY * scale,
	}
}

const truncate = (text: string, maxLength: number) =>
	text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text

export default function BoardPreview({ data }: { data?: BoardPreviewData }) {
	const id = useId().replace(/:/g, "")
	const previewData = data ?? { notes: [], sections: [], arrows: [] }
	const transform = getPreviewTransform(previewData)
	const noteById = new Map(previewData.notes.map((note) => [note.id, note]))
	const markerId = `board-preview-arrow-${id}`

	const toPreview = (point: { x: number; y: number }) => ({
		x: point.x * transform.scale + transform.x,
		y: point.y * transform.scale + transform.y,
	})

	return (
		<svg
			viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}
			className="h-full w-full bg-[var(--light-grey)]"
			aria-hidden="true"
		>
			<defs>
				<pattern id={`${markerId}-dots`} width="16" height="16" patternUnits="userSpaceOnUse">
					<circle cx="2" cy="2" r="1" fill="#c8c8c8" />
				</pattern>
				<marker
					id={markerId}
					viewBox="0 0 10 10"
					refX="8"
					refY="5"
					markerWidth="5"
					markerHeight="5"
					orient="auto-start-reverse"
				>
					<path d="M 0 0 L 10 5 L 0 10 z" fill="#111" />
				</marker>
			</defs>

			<rect width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT} fill={`url(#${markerId}-dots)`} opacity="0.55" />

			{previewData.sections.map((section) => {
				const topLeft = toPreview({ x: section.x, y: section.y })
				const width = section.width * transform.scale
				const height = section.height * transform.scale

				return (
					<g key={section.id}>
						<rect
							x={topLeft.x}
							y={topLeft.y}
							width={width}
							height={height}
							fill="#fff"
						/>
						{width > 84 && height > 42 && (
							<text
								x={topLeft.x + 8}
								y={topLeft.y + 16}
								fontSize="7"
								fontWeight="700"
								fill="#111"
							>
								{truncate(section.title, 20)}
							</text>
						)}
					</g>
				)
			})}

			{previewData.arrows.map((arrow) => {
				const startNote = noteById.get(arrow.start_note_id)
				const endNote = noteById.get(arrow.end_note_id)
				if (!startNote || !endNote) return null

				const start = toPreview(getNoteCenter(startNote))
				const end = toPreview(getNoteCenter(endNote))

				return (
					<line
						key={arrow.id}
						x1={start.x}
						y1={start.y}
						x2={end.x}
						y2={end.y}
						stroke="#111"
						strokeWidth="1.8"
						markerEnd={`url(#${markerId})`}
					/>
				)
			})}

			{previewData.notes.map((note) => {
				const topLeft = toPreview({ x: note.x, y: note.y })
				const width = Math.max(10, note.width * transform.scale)
				const height = Math.max(10, note.height * transform.scale)
				const label = truncate(note.text.trim(), 18)

				return (
					<g key={note.id}>
						<rect
							x={topLeft.x}
							y={topLeft.y}
							width={width}
							height={height}
							fill={noteFill(note.type)}
							stroke="rgba(0,0,0,0.08)"
						/>
						{label && width > 28 && height > 22 && (
							<text
								x={topLeft.x + 5}
								y={topLeft.y + 10}
								fontSize="4"
								fontWeight="600"
								fill="#111"
							>
								{label}
							</text>
						)}
					</g>
				)
			})}
		</svg>
	)
}
