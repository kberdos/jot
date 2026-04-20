import { create } from "zustand"
import { supabase } from "@/util/supabase/supabase"
import { User } from "@supabase/supabase-js";

const DEFAULT_NOTE_WIDTH = 200
// XXX: heights change dynamically based on text - can just use css styling 
const DEFAULT_NOTE_HEIGHT = 200
const DEFAULT_NOTE_COLOR = "#FEFF9C"

export interface Note {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number
	color: string;
	board_id: string; // OPTIONAL, if we're editing on sandbox
	author_id: string; // OPTIONAL, if we're editing on sandbox
}

interface NoteStore {
	notes: Note[];
	updateNote: (id: string, changes: Partial<Note>) => Promise<void>;
	loadNotes: (board_id: string) => Promise<void>;
	newNote: (x: number, y: number, board_id: string, user_id: string) => void;
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
		}, { onConflict: 'id' })
	if (error) throw error
}

export const useNoteStore = create<NoteStore>((set, get) => ({
	notes: [],
	updateNote: async (id, changes) => {
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
	newNote: (x, y, board_id: string, user_id: string) => {
		const n = {
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
			notes: [...state.notes, n],
		}))
		saveNote(n)
	},
}))
