import { create } from "zustand"
import { supabase } from "@/util/supabase/supabase"
import { User } from "@supabase/supabase-js";

const DEFAULT_NOTE_WIDTH = 200
const DEFAULT_NOTE_HEIGHT = 200
const DEFAULT_NOTE_COLOR = "#FEFF9C"

export interface Note {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number
	color: string;
	board_id?: string; // OPTIONAL, if we're editing on sandbox
	author_id?: string; // OPTIONAL, if we're editing on sandbox
}

interface NoteStore {
	notes: Note[];
	updateNote: (id: string, changes: Partial<Note>) => Promise<void>;
	loadNotes: (board_id: string) => Promise<void>;
	newNote: (x: number, y: number) => void;
	saveNotes: (board_id: string, user: User) => Promise<void>;
}


const firstNote: Note = {
	id: crypto.randomUUID(),
	x: 300,
	y: 300,
	width: DEFAULT_NOTE_WIDTH,
	height: DEFAULT_NOTE_HEIGHT,
	color: DEFAULT_NOTE_COLOR,
}

async function saveNote(note: Note) {
	if (!note.board_id) return
	console.log("saving note to board: ", note.board_id)
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
	notes: [firstNote],
	updateNote: async (id, changes) => {
		// XXX: there's something wonky about mapping then finding
		set(state => ({
			notes: state.notes.map(n => n.id === id ? { ...n, ...changes } : n)
		}))
		const note = get().notes.find((note) => note.id === id)
		if (note === undefined || !note.board_id) return

		saveNote(note)
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
	newNote: (x, y) => set(state => ({
		notes: [...state.notes, {
			id: crypto.randomUUID(),
			x: x,
			y: y,
			width: DEFAULT_NOTE_WIDTH,
			height: DEFAULT_NOTE_HEIGHT,
			color: DEFAULT_NOTE_COLOR
		}],
		// TODO: save the note
	})),
	saveNotes: async (board_id: string, user: User) => {
		const { notes, updateNote } = get()

		const promises = notes.map(async (note) => {
			const updated = { ...note, board_id, author_id: user.id }
			return updateNote(note.id, { board_id, author_id: user.id }).then(() => saveNote(updated))
		})

		await Promise.all(promises)
	}
}))
