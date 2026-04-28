import { create } from "zustand"
import { supabase } from "@/util/supabase/supabase"

const DEFAULT_NOTE_WIDTH = 200
// XXX: heights change dynamically based on text - can just use css styling 
const DEFAULT_NOTE_HEIGHT = 200
const DEFAULT_NOTE_COLOR = "#FFF4BF"

export interface Note {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number
	color: string;
	board_id: string;
	author_id: string;
	section_id?: string | null;
}

export type NoteSide = "TOP" | "RIGHT" | "BOTTOM" | "LEFT"

interface NoteStore {
	notes: Note[];
	// TODO: get note 
	updateNote: (id: string, changes: Partial<Note>) => void;
	loadNotes: (board_id: string) => Promise<void>;
	createNote: (x: number, y: number, board_id: string, user_id: string) => Note;
	addNote: (note: Note) => void;
}


export async function saveNote(note: Note) {
	console.log("saving note to board: ", note.board_id)
	// XXX: maybe you can split this up into doing less 
	const { error } = await supabase
		.from("notes")
		.upsert({
			id: note.id,
			x: note.x,
			y: note.y,
			color: note.color,
			width: note.width,
			height: note.height,
			board_id: note.board_id,
			author_id: note.author_id,
			section_id: note.section_id,
		}, { onConflict: 'id' })
	if (error) throw error
}

export const useNoteStore = create<NoteStore>((set, get) => ({
	notes: [],
	updateNote: (id, changes) => {
		set(state => ({
			notes: state.notes.map(n => n.id === id ? { ...n, ...changes } : n)
		}))
	},
	loadNotes: async (board_id: string) => {
		const { data, error } = await supabase
			.from("notes").
			select("*")
			.eq('board_id', board_id)

		if (error) throw error
		const notes = data as Note[]
		set(_ => ({
			notes: notes,
		}))
	},
	createNote: (x, y, board_id: string, user_id: string) => {
		const note = {
			id: crypto.randomUUID(),
			x: x,
			y: y,
			width: DEFAULT_NOTE_WIDTH,
			height: DEFAULT_NOTE_HEIGHT,
			color: DEFAULT_NOTE_COLOR,
			board_id: board_id,
			author_id: user_id,
		}
		set(state => ({
			notes: [...state.notes, note],
		}))
		return note;
	},
	// NOTE: this is used for adding notes pulled from database
	addNote: (note: Note) => {
		set(state => ({
			notes: [...state.notes, note],
		}))
	}
}))
