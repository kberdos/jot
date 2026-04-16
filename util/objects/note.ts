import { create } from "zustand"

const DEFAULT_NOTE_WIDTH = 200
const DEFAULT_NOTE_COLOR = "#FEFF9C"

export interface Note {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number
	color: string;
}

interface NoteStore {
	notes: Note[];
	updateNote: (id: string, changes: Partial<Note>) => void;
	newNote: (x: number, y: number) => void;
}

export const useNoteStore = create<NoteStore>((set) => ({
	notes: [{ id: "0", x: 300, y: 300, width: DEFAULT_NOTE_WIDTH, height: DEFAULT_NOTE_WIDTH, color: DEFAULT_NOTE_COLOR }],
	updateNote: (id, changes) => set(state => ({
		notes: state.notes.map(n => n.id === id ? { ...n, ...changes } : n)
	})),
	newNote: (x, y) => set(state => ({
		notes: [...state.notes, {
			id: crypto.randomUUID(),
			x: x,
			y: y,
			width: DEFAULT_NOTE_WIDTH,
			height: DEFAULT_NOTE_WIDTH,
			color: DEFAULT_NOTE_COLOR
		}],
	}))
}))
