import { create } from "zustand"
import { supabase } from "@/util/supabase/supabase"
import { Note, useNoteStore } from "./note"

export const DEFAULT_SECTION_COLOR = "#FFFFFF"

export interface Section {
	id: string;
	title: string;
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
	activeSectionId: string | null;
	updateSection: (id: string, changes: Partial<Section>) => void;
	setActiveSection: (id: string | null) => void;
	loadSections: (board_id: string) => Promise<void>;
	createSection: (section: Section) => Section;
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
			title: section.title,
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

export async function deleteSavedSection(id: string) {
	const { error } = await supabase
		.from("sections")
		.delete()
		.eq("id", id)

	if (error) throw error
}

export function noteIsInSection(note: Note, section: Section): boolean {
	const overlapX = Math.min(note.x + note.width, section.x + section.width) - Math.max(note.x, section.x);
	const overlapY = Math.min(note.y + note.height, section.y + section.height) - Math.max(note.y, section.y);

	if (overlapX <= 0 || overlapY <= 0) return false;

	const overlapArea = overlapX * overlapY;
	const noteArea = note.width * note.height;

	return overlapArea / noteArea >= 0.5;
}

export const useSectionStore = create<SectionStore>((set, get) => ({
	sections: [],
	activeSectionId: null,

	updateSection: (id, changes) => {
		set(state => ({
			sections: state.sections.map(s => s.id === id ? { ...s, ...changes } : s)
		}))
	},

	setActiveSection: (id) => {
		set(_ => ({
			activeSectionId: id,
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

	createSection: (section: Section) => {
		section.id = crypto.randomUUID()
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
			activeSectionId: state.activeSectionId === id ? null : state.activeSectionId,
		}))
	},

	getNotesInSection: (sectionId: string) => {
		const section = get().sections.find(s => s.id === sectionId)
		if (!section) return []
		const notes = useNoteStore.getState().notes
		return notes.filter(note => noteIsInSection(note, section))
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
