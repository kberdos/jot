import { Arrow } from "@/util/objects/arrow"
import { Note } from "@/util/objects/note"
import { Section } from "@/util/objects/section"

export interface NoteTableRow {
	id: number;
	author: string;
	type: string;
	text: string;
	connections: string;
	section: string;
}

export interface SectionTableRow {
	id: number;
	title: string;
	notes: string;
}

export function getTableData(
	notes: Note[],
	sections: Section[],
	arrows: Arrow[],
) {
	const noteIds = new Map(notes.map((note, index) => [note.id, index]))
	const sectionTitles = new Map(
		sections.map((section) => [section.id, section.title]),
	)

	const noteRows: NoteTableRow[] = notes.map((note, index) => {
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
			type: note.type,
			text: note.text || "",
			connections: `[${uniqueConnections.join(", ")}]`,
			section: note.section_id
				? sectionTitles.get(note.section_id) || ""
				: "",
		}
	})

	const sectionRows: SectionTableRow[] = sections.map((section, index) => {
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
}
