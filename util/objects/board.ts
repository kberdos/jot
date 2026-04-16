import { create } from "zustand"

interface Board {
	id: string; /* UID for this board */
	name: string; /* name of the board */
	author_id: string /* OAuth user ID of board author / owner */
}

interface BoardStore {
	board?: Board,
	setBoard: (id: string) => void;
}

export const useBoardStore = create<BoardStore>((set) => ({
	board: undefined,
	setBoard: (id): void => set(_ => ({
		// XXX: pull from supabase
		board: undefined,
	})),
}))
