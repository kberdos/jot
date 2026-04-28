import { create } from "zustand"
import { supabase } from "@/util/supabase/supabase"
import { Note, useNoteStore } from "./note"

const DEFAULT_SECTION_WIDTH = 400
const DEFAULT_SECTION_HEIGHT = 400
const DEFAULT_SECTION_COLOR = "#E8F4FD"

export interface Section {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	color: string;
	board_id: string;
	author_id: string;
}

export interface GhostSection {
	start_x: number;
	start_y: number;
}

export type AddSectionMode = "NONE" | "ACTIVE" | "ADDING"

interface SectionStore {
	sections: Section[];
	updateSection: (id: string, changes: Partial<Section>) => void;
	loadSections: (board_id: string) => Promise<void>;
	createSection: (x: number, y: number, board_id: string, user_id: string) => Section;
	addSection: (section: Section) => void;
	deleteSection: (id: string) => void;
	// returns IDs of notes whose bounding boxes overlap with the section
	getNotesInSection: (sectionId: string) => Note[];
	addSectionMode: AddSectionMode;
	setAddSectionMode: (val: AddSectionMode) => void;
	ghostSection?: GhostSection
	setGhostSection: (ghost?: GhostSection) => void;
}

// save section to database
export async function saveSection(section: Section) {
	console.log("saving section to board: ", section.board_id)
	const { error } = await supabase
		.from("sections")
		.upsert({
			id: section.id,
			x: section.x,
			y: section.y,
			color: section.color,
			width: section.width,
			height: section.height,
			board_id: section.board_id,
			author_id: section.author_id,
		}, { onConflict: 'id' })
	if (error) throw error
}

function noteOverlapsSection(note: Note, section: Section): boolean {
	return (
		note.x < section.x + section.width &&
		note.x + note.width > section.x &&
		note.y < section.y + section.height &&
		note.y + note.height > section.y
	)
}

export const useSectionStore = create<SectionStore>((set, get) => ({
	sections: [],

	updateSection: (id, changes) => {
		set(state => ({
			sections: state.sections.map(s => s.id === id ? { ...s, ...changes } : s)
		}))
	},

	loadSections: async (board_id: string) => {
		const { data, error } = await supabase
			.from("sections")
			.select("*")
			.eq('board_id', board_id)
		if (error) throw error
		set(_ => ({
			sections: data as Section[],
		}))
	},

	createSection: (x, y, board_id, user_id) => {
		const section: Section = {
			id: crypto.randomUUID(),
			x,
			y,
			width: DEFAULT_SECTION_WIDTH,
			height: DEFAULT_SECTION_HEIGHT,
			color: DEFAULT_SECTION_COLOR,
			board_id,
			author_id: user_id,
		}
		set(state => ({
			sections: [...state.sections, section],
		}))
		return section
	},

	addSection: (section: Section) => {
		set(state => ({
			sections: [...state.sections, section],
		}))
	},

	deleteSection: (id: string) => {
		set(state => ({
			sections: state.sections.filter(s => s.id !== id),
		}))
	},

	getNotesInSection: (sectionId: string) => {
		const section = get().sections.find(s => s.id === sectionId)
		if (!section) return []
		const notes = useNoteStore.getState().notes
		return notes.filter(note => noteOverlapsSection(note, section))
	},
	addSectionMode: "NONE",
	setAddSectionMode: (val: AddSectionMode) => {
		set(_ => ({
			addSectionMode: val,
		}))
	},
	ghostSection: undefined,
	setGhostSection: (ghost?: GhostSection) => {
		set(_ => ({
			ghostSection: ghost,
		}))
	}
}))
