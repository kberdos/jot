"use client"

import { useMemo } from "react"
import { useArrowStore } from "@/util/objects/arrow"
import { useNoteStore } from "@/util/objects/note"
import { useSectionStore } from "@/util/objects/section"
import { getTableData } from "@/util/tableData"


export default function TableView() {
	const notes = useNoteStore((state) => state.notes)
	const arrows = useArrowStore((state) => state.arrows)
	const sections = useSectionStore((state) => state.sections)

	const { noteRows, sectionRows } = useMemo(() =>
		getTableData(notes, sections, arrows),
		[notes, sections, arrows])
	return (
		<div
			className="w-full h-full overflow-auto pt-40 px-16"
			style={{
				backgroundColor: "var(--light-grey)",
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
								<th>Type</th>
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
										<td>{row.type}</td>
										<td>{row.text}</td>
										<td>{row.connections}</td>
										<td>{row.section}</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={5}>No notes yet</td>
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
									<td colSpan={3}>No sections yet</td>
								</tr>
							)}
						</tbody>
					</table>
				</section>
			</div>
		</div>
	)
}
