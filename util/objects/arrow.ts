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
	createArrow: (arrow: Arrow) => void;
	addArrow: (arrow: Arrow) => void
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

export const useArrowStore = create<ArrowStore>((set, get) => ({
	arrows: [],
	updateArrow: (id, changes) => {
		set(state => ({
			arrows: state.arrows.map(a => a.id === id ? { ...a, ...changes } : a)
		}))
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
