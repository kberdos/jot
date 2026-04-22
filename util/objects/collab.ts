import { create } from "zustand";


export interface CollabCursor {
	user_id: string;
	color: string;
	x: number;
	y: number;
}

interface CollabStore {
	cursors: CollabCursor[];
	newCursor: (cursor: CollabCursor) => void;
	moveCursor: (id: string, x: number, y: number) => void;
}

export const useCollabStore = create<CollabStore>((set, get) => ({
	cursors: [],
	newCursor: (cursor: CollabCursor) => {
		set(state => ({
			cursors: [...state.cursors, cursor]
		}))
	},
	moveCursor: (id: string, x: number, y: number) => {
		set(state => ({
			cursors: state.cursors.map(c => c.user_id === id ?
				{ ...c, x, y } : c),
		}))
	}
}))


