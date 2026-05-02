import { create } from "zustand"
import { User } from "@supabase/supabase-js"
import { supabase } from "@/util/supabase/supabase"
import { useAuthStore } from "@/util/auth/auth"

export interface Board {
	id: string; /* UID for this board */
	name: string; /* name of the board */
	author_id: string /* OAuth user ID of board author / owner */
	last_modified_by: string | null;
}

interface BoardStore {
	board?: Board, // undefined while we're hydrating the page
	setBoard: (id: string) => void; // gather from database
	renameBoard: (name: string) => Promise<void>;
	createBoard: (name: string, user: User) => Promise<Board>;
	isChatOpen: boolean;
	setIsChatOpen: (open: boolean) => void;
}

export const useBoardStore = create<BoardStore>((set, get) => ({
	board: undefined,

	isChatOpen: false,
	setIsChatOpen: (open: boolean) => set({ isChatOpen: open }),


	setBoard: async (id) => {
		// query board from supabase
		const { data, error } = await supabase
			.from("boards")
			.select("*")
			.eq("id", id)
			.single()

		// XXX: go to a 404 instead of throw error
		if (error) throw error

		set(_ => ({
			board: data,
		}))
	},
	// TODO: prob just a rename board and sync with database
	renameBoard: async (name: string) => {
		const { board } = get()
		if (!board) return
		const userId = useAuthStore.getState().user?.id ?? board.last_modified_by
		set(_ => ({
			board: {
				...board,
				name: name,
				last_modified_by: userId,
			},
		}))
		const { error } = await supabase
			.from('boards')
			.update({
				name: name,
				last_modified_by: userId,
			})
			.eq('id', board.id)

		if (error) throw error
	},
	createBoard: async (name: string, user: User) => {
		// make the board with supabasse
		const { data: board, error } = await supabase
			.from("boards")
			.insert({
				name,
				author: user.id,
				last_modified_by: user.id,
			})
			.select()
			.single()

		// XXX: go to a 404 instead of throw error
		if (error) throw error

		return board
	},
}))
