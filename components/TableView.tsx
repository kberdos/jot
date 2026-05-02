"use client"

import { useCameraStore } from "@/util/objects/camera"
import { useMemo } from "react"
import { useArrowStore } from "@/util/objects/arrow"
import { useNoteStore } from "@/util/objects/note"
import { useSectionStore } from "@/util/objects/section"


export default function TableView() {
	const { camera } = useCameraStore()
	const notes = useNoteStore((state) => state.notes)
	const arrows = useArrowStore((state) => state.arrows)
	const sections = useSectionStore((state) => state.sections)

	const { noteRows, sectionRows } = useMemo(() => {
		const noteIds = new Map(notes.map((note, index) => [note.id, index]))
		const sectionTitles = new Map(
			sections.map((section) => [section.id, section.title]),
		)

		const noteRows = notes.map((note, index) => {
			const connections = arrows
				.flatMap((arrow) => {
					if (arrow.start_note_id === note.id) return [arrow.end_note_id]
					if (arrow.end_note_id === note.id) return [arrow.start_note_id]
					return []
				})
				.map((id) => noteIds.get(id))
				.filter((id): id is number => id !== undefined)

			const uniqueConnections = Array.from(new Set(connections)).sort(
				(a, b) => a - b,
			)

			return {
				id: index,
				author: note.author_name || "Unknown",
				text: note.text || "",
				connections: `[${uniqueConnections.join(", ")}]`,
				section: note.section_id
					? sectionTitles.get(note.section_id) || ""
					: "",
			}
		})
		const sectionRows = sections.map((section, index) => {
			const sectionNoteIds = notes
				.filter((note) => note.section_id === section.id)
				.map((note) => noteIds.get(note.id))
				.filter((id): id is number => id !== undefined)
				.sort((a, b) => a - b)

			return {
				id: index,
				title: section.title,
				notes: `[${sectionNoteIds.join(", ")}]`,
			}
		})

		return { noteRows, sectionRows }
	}, [arrows, notes, sections])

	return (
		<div
			className="w-full h-full overflow-auto pt-40 px-16"
			style={{
				backgroundColor: "var(--light-grey)",
				backgroundImage: "radial-gradient(circle, #888, 1px, transparent 1px)",
				backgroundSize: `${30 * camera.zoom}px ${30 * camera.zoom}px`,
				backgroundPosition: `${camera.x % (30 * camera.zoom)}px ${camera.y % (30 * camera.zoom)
					}px`,
			}}
		>
			<div className="table-view-grid">
				<section className="table-view-section">
					<h2 className="table-view-title">Note Database</h2>

					<table className="database-table note-database-table">
						<thead>
							<tr>
								<th>ID</th>
								<th>Author</th>
								<th>Text</th>
								<th>Connections</th>
								<th>Section</th>
							</tr>
						</thead>
						<tbody>
							{noteRows.length > 0 ? (
								noteRows.map((row) => (
									<tr key={row.id}>
										<td>{row.id}</td>
										<td>{row.author}</td>
										<td>{row.text}</td>
										<td>{row.connections}</td>
										<td>{row.section}</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={5}>No notes yet.</td>
								</tr>
							)}
						</tbody>
					</table>
				</section>

				<section className="table-view-section table-view-section-small">
					<h2 className="table-view-title">Section Database</h2>

					<table className="database-table section-database-table">
						<thead>
							<tr>
								<th>ID</th>
								<th>Title</th>
								<th>Notes</th>
							</tr>
						</thead>
						<tbody>
							{sectionRows.length > 0 ? (
								sectionRows.map((row) => (
									<tr key={row.id}>
										<td>{row.id}</td>
										<td>{row.title}</td>
										<td>{row.notes}</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={3}>No sections yet.</td>
								</tr>
							)}
						</tbody>
					</table>
				</section>
			</div>
		</div>
	)
}
