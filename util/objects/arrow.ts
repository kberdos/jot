import { create } from "zustand";
import { NoteSide } from "./note";

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


export type AddMode = "NONE" | "ACTIVE" | "ADDING"

interface ArrowStore {
	arrows: Arrow[];
	addArrow: (arrow: Arrow) => void;
	ghost?: GhostArrow;
	setGhost: (ghost?: GhostArrow) => void;
	addMode: AddMode;
	setAddMode: (val: AddMode) => void;
}

export const useArrowStore = create<ArrowStore>((set, get) => ({
	arrows: [],
	addArrow: (arrow: Arrow) => {
		console.log(arrow)
		set(state => ({
			arrows: [...state.arrows, arrow],
		}))
	},
	ghost: undefined,
	setGhost: (ghost?: GhostArrow) => {
		set(_ => ({
			ghost: ghost,
		}))
	},
	addMode: "NONE",
	setAddMode: (val: AddMode) => {
		set(_ => ({
			addMode: val,
		}))
	}
}))
