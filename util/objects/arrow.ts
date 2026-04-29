import { create } from "zustand";
import { NoteSide } from "./note";
import { supabase } from "../supabase/supabase";

// drawn arrow
export interface Arrow {
	id: string;
	board_id: string;
	author_id: string;
	start_note_id: string;
	start_note_side: NoteSide;
	end_note_id: string;
	end_note_side: NoteSide;
	// add: some styling stuff
}

// arrow in the process of drawing
export interface GhostArrow {
	start_note_id: string;
	start_note_side: NoteSide;
}


export type AddArrowMode = "NONE" | "ACTIVE" | "ADDING"

interface ArrowStore {
	arrows: Arrow[];
	activeArrowId: string | null;
	createArrow: (arrow: Arrow) => void;
	addArrow: (arrow: Arrow) => void
	deleteArrow: (id: string) => void
	deleteArrowsForNote: (noteId: string) => void
	setActiveArrow: (id: string | null) => void
	updateArrow: (id: string, changes: Partial<Arrow>) => void
	loadArrows: (board_id: string) => Promise<void>;
	ghostArrow?: GhostArrow;
	setGhostArrow: (ghost?: GhostArrow) => void;
	addArrowMode: AddArrowMode;
	setAddArrowMode: (val: AddArrowMode) => void;
}

export async function saveArrow(arrow: Arrow) {
	// XXX: maybe can split this up into doing less 
	const { error } = await supabase
		.from("arrows")
		.upsert({
			id: arrow.id,
			board_id: arrow.board_id,
			author_id: arrow.author_id,
			start_note_id: arrow.start_note_id,
			start_note_side: arrow.start_note_side,
			end_note_id: arrow.end_note_id,
			end_note_side: arrow.end_note_side,
		}, { onConflict: 'id' })
	if (error) throw error
}

export async function deleteSavedArrow(id: string) {
	const { error } = await supabase
		.from("arrows")
		.delete()
		.eq("id", id)

	if (error) throw error
}

export async function deleteSavedArrowsForNote(noteId: string) {
	const { error } = await supabase
		.from("arrows")
		.delete()
		.or(`start_note_id.eq.${noteId},end_note_id.eq.${noteId}`)

	if (error) throw error
}

export const useArrowStore = create<ArrowStore>((set, get) => ({
	arrows: [],
	activeArrowId: null,
	updateArrow: (id, changes) => {
		set(state => ({
			arrows: state.arrows.map(a => a.id === id ? { ...a, ...changes } : a)
		}))
	},
	setActiveArrow: (id) => {
		set(_ => ({
			activeArrowId: id,
		}))
	},
	deleteArrow: (id) => {
		set(state => ({
			arrows: state.arrows.filter(a => a.id !== id),
			activeArrowId: state.activeArrowId === id ? null : state.activeArrowId,
		}))
	},
	deleteArrowsForNote: (noteId) => {
		set(state => {
			const activeArrow = state.arrows.find(a => a.id === state.activeArrowId)

			return {
				arrows: state.arrows.filter(a => a.start_note_id !== noteId && a.end_note_id !== noteId),
				activeArrowId: activeArrow?.start_note_id === noteId || activeArrow?.end_note_id === noteId ? null : state.activeArrowId,
			}
		})
	},
	addArrow: (arrow: Arrow) => {
		set(state => ({
			arrows: [...state.arrows, arrow],
		}))
	},
	createArrow: (arrow: Arrow) => {
		arrow.id = crypto.randomUUID()
		set(state => ({
			arrows: [...state.arrows, arrow],
		}))
		saveArrow(arrow)
	},
	loadArrows: async (board_id: string) => {
		const { data, error } = await supabase
			.from("arrows").
			select("*")
			.eq('board_id', board_id)

		if (error) throw error
		const arrows = data as Arrow[]
		set(_ => ({
			arrows: arrows,
		}))
	},
	ghostArrow: undefined,
	setGhostArrow: (ghost?: GhostArrow) => {
		set(_ => ({
			ghostArrow: ghost,
		}))
	},
	addArrowMode: "NONE",
	setAddArrowMode: (val: AddArrowMode) => {
		set(_ => ({
			addArrowMode: val,
		}))
	}
}))
